import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import { downloadLeaderboardPng } from '../utils/leaderboardImage';
import { Trophy, ImageDown } from 'lucide-react';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function Avatar({ member }) {
  return member.foto_url ? (
    <img src={member.foto_url} alt={member.nombre} className="h-9 w-9 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-semibold text-brown-600">
      {initials(member.nombre)}
    </span>
  );
}

export default function Leaderboard() {
  const { adminMode } = useAuth();
  const [mode, setMode] = useState('points');
  const [pointsRanking, setPointsRanking] = useState([]);
  const [effortRanking, setEffortRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPng() {
    setDownloading(true);
    try {
      await downloadLeaderboardPng(pointsRanking.slice(0, 3));
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    async function load() {
      const [{ data: members }, { data: effort }] = await Promise.all([
        supabase
          .from('miembros')
          .select('*, miembro_areas(areas(nombre, color))')
          .eq('activo', true)
          .order('puntaje', { ascending: false }),
        supabase.from('member_effort_stats').select('*'),
      ]);

      setPointsRanking(members || []);

      const effortByMember = new Map((effort || []).map((row) => [row.miembro_id, row]));
      const merged = (members || [])
        .map((m) => ({ ...m, effort: effortByMember.get(m.id) || { actualizaciones: 0, tareas_completadas: 0, effort_score: 0 } }))
        .sort((a, b) => b.effort.effort_score - a.effort.effort_score);
      setEffortRanking(merged);

      setLoading(false);
    }
    load();
  }, []);

  const ranking = mode === 'points' ? pointsRanking : effortRanking;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">Leaderboard</h1>
        {adminMode && !loading && pointsRanking.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-ink-secondary ring-1 ring-inset ring-line transition-colors duration-350 ease-emil hover:text-ink disabled:opacity-60"
          >
            <ImageDown size={14} strokeWidth={1.75} />
            {downloading ? 'Generating…' : 'Download PNG (top 3)'}
          </button>
        )}
      </div>

      <div className="mb-8 inline-flex items-center gap-1 rounded-full bg-surface-soft p-1">
        <button
          type="button"
          onClick={() => setMode('points')}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors duration-350 ease-emil ${
            mode === 'points' ? 'bg-white text-ink shadow-soft-xs' : 'text-ink-secondary'
          }`}
        >
          By points
        </button>
        <button
          type="button"
          onClick={() => setMode('effort')}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors duration-350 ease-emil ${
            mode === 'effort' ? 'bg-white text-ink shadow-soft-xs' : 'text-ink-secondary'
          }`}
        >
          By effort
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full animate-shimmer rounded-card" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Trophy size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No ranking data yet.</p>
        </Reveal>
      ) : (
        <div className="overflow-hidden rounded-card bg-surface-soft">
          <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-line-soft px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-ink-secondary sm:grid-cols-[40px_1fr_120px_auto]">
            <span>#</span>
            <span>Member</span>
            <span className="hidden sm:block">Area</span>
            <span className="text-right">{mode === 'points' ? 'Points' : 'Effort'}</span>
          </div>
          {ranking.map((m, i) => {
            const area = m.miembro_areas?.[0]?.areas;
            return (
              <Reveal
                key={m.id}
                delay={Math.min(i, 6) * 40}
                className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0 sm:grid-cols-[40px_1fr_120px_auto]"
              >
                <span className={`text-[14px] font-semibold ${i < 3 ? 'text-brown-600' : 'text-ink-secondary'}`}>
                  {i + 1}
                </span>
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar member={m} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink">{m.nombre}</p>
                    {m.rol && <p className="truncate text-[11.5px] text-ink-secondary">{m.rol}</p>}
                  </div>
                </div>
                <div className="hidden items-center gap-1.5 sm:flex">
                  {area && (
                    <>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: area.color || '#6c450e' }} />
                      <span className="truncate text-[12.5px] text-ink-secondary">{area.nombre}</span>
                    </>
                  )}
                </div>
                <div className="text-right">
                  {mode === 'points' ? (
                    <span className="text-[15px] font-semibold text-ink">{m.puntaje ?? 0}</span>
                  ) : (
                    <div>
                      <span className="text-[15px] font-semibold text-ink">{m.effort.effort_score}</span>
                      <p className="text-[10.5px] text-ink-secondary">
                        {m.effort.actualizaciones} updates · {m.effort.tareas_completadas} tasks
                      </p>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
