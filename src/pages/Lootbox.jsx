import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import AchievementBadge from '../components/AchievementBadge';
import { RARITY_LABEL, RARITY_COLOR } from '../utils/rarity';
import { Coins, Gift } from 'lucide-react';

// Must mirror the odds encoded in the claim_lootbox() Postgres function
// (supabase/0012_lootbox_and_coins.sql) — display only, the roll itself
// happens server-side.
const RARITY_ORDER = ['common', 'rare', 'super_rare', 'epic', 'legendary'];
const RARITY_ODDS = { common: 55, rare: 27, super_rare: 12, epic: 5, legendary: 1 };

const SPIN_TICK_MS = 70;
const SPIN_DURATION_MS = 1400;
const LANDING_DELAYS = [90, 110, 140, 190, 250, 330, 430];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timeUntil(date) {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function Lootbox() {
  const { member, refreshMember } = useAuth();
  const [tiers, setTiers] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [displayTier, setDisplayTier] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const fetchTiers = useCallback(async () => {
    const { data } = await supabase.from('logros').select('*').eq('tipo', 'lootbox');
    const sorted = (data || []).slice().sort((a, b) => RARITY_ORDER.indexOf(a.nivel) - RARITY_ORDER.indexOf(b.nivel));
    setTiers(sorted);
    setDisplayTier((prev) => prev || sorted[0] || null);
  }, []);

  const fetchPulls = useCallback(async () => {
    if (!member) return;
    const { data } = await supabase
      .from('miembro_logros')
      .select('created_at, logros!inner(nivel, tipo)')
      .eq('miembro_id', member.id)
      .eq('logros.tipo', 'lootbox')
      .order('created_at', { ascending: false });
    setPulls(data || []);
  }, [member]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchTiers(), fetchPulls()]);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const counts = useMemo(() => {
    const map = new Map();
    pulls.forEach((p) => {
      const nivel = p.logros?.nivel;
      if (nivel) map.set(nivel, (map.get(nivel) || 0) + 1);
    });
    return map;
  }, [pulls]);

  const nextAvailable = pulls[0] ? new Date(new Date(pulls[0].created_at).getTime() + 24 * 60 * 60 * 1000) : null;
  const cooldown = nextAvailable && nextAvailable.getTime() - now > 0 ? timeUntil(nextAvailable) : null;

  async function spinFiller(durationMs) {
    const ticks = Math.round(durationMs / SPIN_TICK_MS);
    for (let i = 0; i < ticks; i++) {
      setDisplayTier(tiers[i % tiers.length]);
      await sleep(SPIN_TICK_MS);
    }
  }

  async function landingSequence(nivel) {
    const finalTier = tiers.find((t) => t.nivel === nivel) || tiers[0];
    let idx = 0;
    for (const delay of LANDING_DELAYS) {
      setDisplayTier(tiers[idx % tiers.length]);
      idx++;
      await sleep(delay);
    }
    setDisplayTier(finalTier);
  }

  async function openLootbox() {
    if (opening || cooldown || tiers.length === 0) return;
    setOpening(true);
    setError('');
    setResult(null);

    const [rpcResult] = await Promise.all([supabase.rpc('claim_lootbox'), spinFiller(SPIN_DURATION_MS)]);
    const { data, error: rpcError } = rpcResult;

    if (rpcError) {
      setError(rpcError.message);
      setOpening(false);
      return;
    }
    if (!data?.claimed) {
      await fetchPulls();
      setOpening(false);
      return;
    }

    await landingSequence(data.nivel);
    setResult(data);
    setOpening(false);
    await Promise.all([refreshMember(), fetchPulls()]);
  }

  const ringColor = displayTier?.nivel ? RARITY_COLOR[displayTier.nivel] : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">Lootbox</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">One free pull every 24 hours. Better rarities pay more.</p>
        </div>
        {!loading && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[18px] font-semibold leading-none text-ink">{member?.puntaje ?? 0}</span>
              <span className="text-[10.5px] uppercase tracking-wide text-ink-secondary">points</span>
            </div>
            <div className="text-right">
              <span className="flex items-center justify-end gap-1 text-[18px] font-semibold leading-none text-brown-600">
                <Coins size={14} strokeWidth={2} />
                {member?.monedas ?? 0}
              </span>
              <span className="text-[10.5px] uppercase tracking-wide text-ink-secondary">coins</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-72 w-full animate-shimmer rounded-card" />
      ) : (
        <>
          <div className="flex flex-col items-center gap-6 rounded-card bg-surface-soft px-6 py-12">
            <div
              className={`relative flex h-28 w-28 items-center justify-center rounded-full transition-transform duration-350 ease-emil ${
                opening ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: displayTier?.color || '#d9d5cc',
                boxShadow: ringColor ? `0 0 0 4px white, 0 0 0 7px ${ringColor}, 0 0 24px ${ringColor}66` : 'none',
              }}
            >
              {displayTier && (
                <AchievementBadge key={displayTier.id} icono={displayTier.icono} color={displayTier.color} locked={false} size={96} />
              )}
            </div>

            {result ? (
              <div className="flex flex-col items-center gap-1 text-center animate-scale-in">
                <span className="text-[13px] font-medium uppercase tracking-wide" style={{ color: RARITY_COLOR[result.nivel] }}>
                  {RARITY_LABEL[result.nivel]}
                </span>
                <span className="text-[17px] font-semibold text-ink">{result.nombre}</span>
                <span className="text-[13px] text-ink-secondary">
                  +{result.points} points · +{Math.floor(result.points / 3)} coins
                </span>
              </div>
            ) : cooldown ? (
              <p className="text-[13px] text-ink-secondary">Next pull in {cooldown}</p>
            ) : (
              <p className="text-[13px] text-ink-secondary">Your daily lootbox is ready.</p>
            )}

            {error && <p className="text-[12.5px] text-red-600">{error}</p>}

            <button
              type="button"
              onClick={openLootbox}
              disabled={opening || !!cooldown}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13.5px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-50"
            >
              <Gift size={15} strokeWidth={2} />
              {opening ? 'Opening…' : cooldown ? `Next in ${cooldown}` : 'Open lootbox'}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-secondary">Drop rates</h2>
              <div className="flex flex-col gap-2">
                {tiers.map((tier) => (
                  <div key={tier.id} className="flex items-center gap-3 rounded-control bg-surface-soft px-3 py-2">
                    <AchievementBadge icono={tier.icono} color={tier.color} locked={false} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{tier.nombre}</p>
                      <p className="text-[11px] text-ink-secondary">+{tier.puntos} pts</p>
                    </div>
                    <span className="text-[12.5px] font-semibold" style={{ color: RARITY_COLOR[tier.nivel] }}>
                      {RARITY_ODDS[tier.nivel]}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-secondary">Your pulls</h2>
              {pulls.length === 0 ? (
                <p className="text-[13px] italic text-ink-tertiary">No pulls yet — open your first lootbox above.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {tiers.map((tier) => {
                    const count = counts.get(tier.nivel) || 0;
                    if (count === 0) return null;
                    return (
                      <div key={tier.id} className="flex flex-col items-center gap-1.5">
                        <AchievementBadge icono={tier.icono} color={tier.color} locked={false} nivel={tier.nivel} count={count} size={44} />
                        <span className="text-[10.5px] text-ink-secondary">{RARITY_LABEL[tier.nivel]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
