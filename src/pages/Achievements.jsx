import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import IconPicker from '../components/IconPicker';
import ColorSwatchPicker from '../components/ColorSwatchPicker';
import AchievementBadge from '../components/AchievementBadge';
import Modal from '../components/Modal';
import { RARITY_LABEL, RARITY_COLOR } from '../utils/rarity';
import { Award, Search, Settings2, Flame, Minus, Pencil, ScrollText, Info } from 'lucide-react';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function MemberAvatar({ member, size = 24 }) {
  return member.foto_url ? (
    <img
      src={member.foto_url}
      alt={member.nombre}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brown-600"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initials(member.nombre)}
    </span>
  );
}

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyForm = {
  nombre: '',
  descripcion: '',
  comoObtener: '',
  puntos: 10,
  icono: 'lucide:Award',
  color: '#6c450e',
  nivel: 'common',
  esGlobal: true,
  areaIds: [],
};

const LOG_PAGE_SIZE = 25;
const LOG_TYPE_LABEL = {
  manual: 'Award',
  automatico: 'Automatic',
  daily: 'Daily',
  lootbox: 'Lootbox',
  task: 'Task',
  board: 'Board',
};

function timeUntil(date) {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

function AchievementFields({ form, setForm, areas }) {
  return (
    <>
      <input
        type="text"
        required
        placeholder="Name"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />
      <textarea
        placeholder="How to obtain it (optional)"
        value={form.comoObtener}
        onChange={(e) => setForm({ ...form, comoObtener: e.target.value })}
        rows={2}
        className={inputClass}
      />
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Points</span>
        <input
          type="number"
          min={0}
          required
          value={form.puntos}
          onChange={(e) => setForm({ ...form, puntos: Number(e.target.value) })}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Rarity</span>
        <select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} className={inputClass}>
          <option value="">No rarity</option>
          {Object.entries(RARITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Icon</span>
        <IconPicker value={form.icono} onChange={(icono) => setForm({ ...form, icono })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Background color</span>
        <ColorSwatchPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-ink-secondary">Scope</span>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input
            type="radio"
            checked={form.esGlobal}
            onChange={() => setForm({ ...form, esGlobal: true, areaIds: [] })}
          />
          Global (any area)
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink">
          <input type="radio" checked={!form.esGlobal} onChange={() => setForm({ ...form, esGlobal: false })} />
          Specific areas
        </label>
        {!form.esGlobal && (
          <div className="ml-6 flex flex-wrap gap-2">
            {areas.map((area) => {
              const checked = form.areaIds.includes(area.id);
              return (
                <label
                  key={area.id}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-350 ease-emil ${
                    checked ? 'bg-brand-100 text-brown-600' : 'bg-white text-ink-secondary ring-1 ring-inset ring-line'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() =>
                      setForm({
                        ...form,
                        areaIds: checked ? form.areaIds.filter((id) => id !== area.id) : [...form.areaIds, area.id],
                      })
                    }
                  />
                  {area.nombre}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function Achievements() {
  const { adminMode, member, refreshMember } = useAuth();
  const [logros, setLogros] = useState([]);
  const [areas, setAreas] = useState([]);
  const [members, setMembers] = useState([]);
  const [myGrants, setMyGrants] = useState([]);
  const [grantsByLogro, setGrantsByLogro] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [managingId, setManagingId] = useState(null);
  const [grantMemberId, setGrantMemberId] = useState('');
  const [grantNote, setGrantNote] = useState('');

  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  const [log, setLog] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logLoadingMore, setLogLoadingMore] = useState(false);
  const [logHasMore, setLogHasMore] = useState(true);

  const [detailLogro, setDetailLogro] = useState(null);
  const [detailHolderIds, setDetailHolderIds] = useState(new Set());
  const [detailLoading, setDetailLoading] = useState(false);

  async function openAchievementDetail(logro) {
    setDetailLogro(logro);
    setDetailLoading(true);
    const { data, error } = await supabase.from('miembro_logros').select('miembro_id').eq('logro_id', logro.id);
    if (error) console.error('Error:', error);
    setDetailHolderIds(new Set((data || []).map((row) => row.miembro_id)));
    setDetailLoading(false);
  }

  async function fetchLogros() {
    const { data, error } = await supabase
      .from('logros')
      .select('*, logro_areas(area_id, areas(id, nombre, color))')
      .in('tipo', ['manual', 'automatico', 'daily'])
      .order('nombre');
    if (error) console.error('Error:', error);
    setLogros(data || []);
  }

  async function fetchMyGrants() {
    if (!member) return;
    const { data } = await supabase
      .from('miembro_logros')
      .select('id, logro_id, created_at')
      .eq('miembro_id', member.id);
    setMyGrants(data || []);
  }

  async function fetchAllGrants() {
    if (!adminMode) return;
    const { data, error } = await supabase
      .from('miembro_logros')
      .select('id, logro_id, miembro_id, nota, created_at, miembros!miembro_logros_miembro_id_fkey(nombre)')
      .order('created_at', { ascending: false });
    if (error) console.error('Error:', error);
    const map = new Map();
    (data || []).forEach((row) => {
      const list = map.get(row.logro_id) || [];
      list.push(row);
      map.set(row.logro_id, list);
    });
    setGrantsByLogro(map);
  }

  // Global achievement activity feed — visible to every member, not just admins.
  async function fetchLog(offset = 0) {
    const { data, error } = await supabase
      .from('miembro_logros')
      .select(
        'id, puntos, nota, created_at, logros(nombre, icono, color, tipo), miembro:miembros!miembro_logros_miembro_id_fkey(nombre, foto_url), otorgante:miembros!miembro_logros_otorgado_por_fkey(nombre)',
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + LOG_PAGE_SIZE - 1);
    if (error) console.error('Error:', error);
    const rows = data || [];
    setLogHasMore(rows.length === LOG_PAGE_SIZE);
    setLog((prev) => (offset === 0 ? rows : [...prev, ...rows]));
  }

  async function loadMoreLog() {
    setLogLoadingMore(true);
    await fetchLog(log.length);
    setLogLoadingMore(false);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([
        fetchLogros(),
        supabase
          .from('areas')
          .select('*')
          .order('nombre')
          .then(({ data }) => setAreas(data || [])),
        supabase
          .from('miembros')
          .select('id, nombre, foto_url')
          .eq('activo', true)
          .order('nombre')
          .then(({ data }) => setMembers(data || [])),
        fetchLog(0).then(() => setLogLoading(false)),
      ]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function run() {
      await fetchMyGrants();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  useEffect(() => {
    async function run() {
      await fetchAllGrants();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminMode]);

  const myGrantCounts = useMemo(() => {
    const counts = new Map();
    myGrants.forEach((g) => counts.set(g.logro_id, (counts.get(g.logro_id) || 0) + 1));
    return counts;
  }, [myGrants]);

  const dailyLogro = useMemo(() => logros.find((l) => l.tipo === 'daily'), [logros]);
  const dailyNextAvailable = useMemo(() => {
    if (!dailyLogro) return null;
    const mine = myGrants.filter((g) => g.logro_id === dailyLogro.id);
    if (mine.length === 0) return null;
    const latest = mine.reduce((max, g) => (new Date(g.created_at) > max ? new Date(g.created_at) : max), new Date(0));
    return new Date(latest.getTime() + 24 * 60 * 60 * 1000);
  }, [dailyLogro, myGrants]);
  const dailyCooldown = dailyNextAvailable ? timeUntil(dailyNextAvailable) : null;

  async function claimDaily() {
    setClaiming(true);
    setClaimMessage('');
    try {
      const { data, error } = await supabase.rpc('claim_daily_checkin');
      if (error) throw error;
      if (data?.claimed) {
        setClaimMessage(`+${data.points} points! Come back tomorrow.`);
        await fetchMyGrants();
        await fetchLog(0);
        await refreshMember();
      } else {
        setClaimMessage('Already claimed today — come back later.');
      }
    } catch (err) {
      setClaimMessage(err.message);
    } finally {
      setClaiming(false);
    }
  }

  function buildPayload(form) {
    return {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      como_obtener: form.comoObtener.trim() || null,
      puntos: form.puntos,
      icono: form.icono,
      color: form.color,
      nivel: form.nivel || null,
      es_global: form.esGlobal,
    };
  }

  async function syncAreas(logroId, form) {
    await supabase.from('logro_areas').delete().eq('logro_id', logroId);
    if (!form.esGlobal && form.areaIds.length > 0) {
      await supabase.from('logro_areas').insert(form.areaIds.map((area_id) => ({ logro_id: logroId, area_id })));
    }
  }

  async function handleAdd() {
    const { data, error } = await supabase.from('logros').insert(buildPayload(addForm)).select().single();
    if (error) throw error;
    await syncAreas(data.id, addForm);
    setAddForm(emptyForm);
    fetchLogros();
  }

  function startEdit(logro) {
    setEditingId(logro.id);
    setEditForm({
      nombre: logro.nombre,
      descripcion: logro.descripcion || '',
      comoObtener: logro.como_obtener || '',
      puntos: logro.puntos,
      icono: logro.icono,
      color: logro.color,
      nivel: logro.nivel || '',
      esGlobal: logro.es_global,
      areaIds: (logro.logro_areas || []).map((la) => la.area_id),
    });
  }

  async function saveEdit(id) {
    const { error } = await supabase.from('logros').update(buildPayload(editForm)).eq('id', id);
    if (error) throw error;
    await syncAreas(id, editForm);
    setEditingId(null);
    fetchLogros();
  }

  async function deleteLogro(id) {
    const { error } = await supabase.from('logros').delete().eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchLogros();
    fetchAllGrants();
    fetchMyGrants();
    refreshMember();
  }

  async function grant(logro) {
    if (!grantMemberId) return;
    const { error } = await supabase.from('miembro_logros').insert({
      miembro_id: grantMemberId,
      logro_id: logro.id,
      puntos: logro.puntos,
      otorgado_por: member.id,
      nota: grantNote.trim() || null,
    });
    if (error) throw error;
    const grantedToMe = grantMemberId === member.id;
    setGrantMemberId('');
    setGrantNote('');
    await fetchAllGrants();
    await fetchLog(0);
    if (grantedToMe) {
      await fetchMyGrants();
      refreshMember();
    }
  }

  // Removes the single most recent grant for this member (decrements the ×N stack by one).
  async function revokeOne(group) {
    const latest = group.rows[0];
    const { error } = await supabase.from('miembro_logros').delete().eq('id', latest.id);
    if (error) throw error;
    await fetchAllGrants();
    await fetchLog(0);
    if (group.miembroId === member.id) {
      await fetchMyGrants();
      refreshMember();
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logros.filter((l) => {
      if (q && !`${l.nombre} ${l.descripcion || ''}`.toLowerCase().includes(q)) return false;
      if (levelFilter && l.nivel !== levelFilter) return false;
      if (areaFilter === 'global' && !l.es_global) return false;
      if (areaFilter && areaFilter !== 'global') {
        const areaIds = (l.logro_areas || []).map((la) => la.area_id);
        if (!areaIds.includes(areaFilter)) return false;
      }
      return true;
    });
  }, [logros, search, areaFilter, levelFilter]);

  const totalCount = logros.length;
  const unlockedCount = logros.filter((l) => myGrantCounts.has(l.id)).length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">Achievements</h1>
        {!loading && totalCount > 0 && (
          <div className="flex min-w-[220px] flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-secondary">
              {unlockedCount}/{totalCount} unlocked · {progressPct}%
            </span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-soft">
              <div
                className="h-full rounded-full bg-brown-600 transition-[width] duration-450 ease-emil"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {dailyLogro && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card p-5" style={{ backgroundColor: '#fff7ed' }}>
          <div className="flex items-center gap-3">
            <AchievementBadge icono={dailyLogro.icono} color={dailyLogro.color} locked={false} size={48} />
            <div>
              <h3 className="text-[15px] font-semibold text-ink">{dailyLogro.nombre}</h3>
              <p className="text-[12.5px] text-ink-secondary">{dailyLogro.descripcion}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {claimMessage && <span className="text-[12.5px] text-ink-secondary">{claimMessage}</span>}
            <button
              type="button"
              onClick={claimDaily}
              disabled={claiming || !!dailyCooldown}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-[13px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-orange-600 disabled:opacity-50"
            >
              <Flame size={14} strokeWidth={2} />
              {dailyCooldown ? `Next in ${dailyCooldown}` : claiming ? 'Claiming…' : 'Claim +10'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-control border border-line bg-white px-3.5 py-2.5">
          <Search size={15} strokeWidth={1.75} className="text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-[14px] text-ink outline-none"
          />
        </div>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className={inputClass}>
          <option value="">All areas</option>
          <option value="global">Global</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={inputClass}>
          <option value="">All rarities</option>
          {Object.entries(RARITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {adminMode && (
        <AdminAddPanel label="New achievement" onSubmit={handleAdd} submitLabel="Create achievement">
          <AchievementFields form={addForm} setForm={setAddForm} areas={areas} />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 w-full animate-shimmer rounded-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Award size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No achievements match your filters.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((logro, i) => {
            const count = myGrantCounts.get(logro.id) || 0;
            const unlocked = count > 0;
            const rawHolders = grantsByLogro.get(logro.id) || [];
            const holderGroups = (() => {
              const map = new Map();
              rawHolders.forEach((row) => {
                const g = map.get(row.miembro_id) || {
                  miembroId: row.miembro_id,
                  nombre: row.miembros?.nombre || 'Unknown',
                  rows: [],
                };
                g.rows.push(row);
                map.set(row.miembro_id, g);
              });
              return Array.from(map.values());
            })();
            const scopeLabel = logro.es_global
              ? 'Global (any area)'
              : (logro.logro_areas || []).map((la) => la.areas?.nombre).filter(Boolean).join(', ') || 'Specific areas';

            return (
              <Reveal key={logro.id} delay={Math.min(i, 6) * 40} className="rounded-card bg-surface-soft p-5">
                <div className="flex items-start gap-3">
                  <AchievementBadge
                    icono={logro.icono}
                    color={logro.color}
                    locked={!unlocked}
                    size={52}
                    nivel={logro.nivel}
                    count={count}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-[15px] font-semibold ${unlocked ? 'text-ink' : 'text-ink-secondary'}`}>
                      {logro.nombre}
                    </h3>
                    <p className="text-[12px] text-brown-600">{logro.puntos} pts</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
                      {scopeLabel}
                      {logro.nivel && (
                        <span
                          className="inline-flex items-center gap-1 font-medium"
                          style={{ color: RARITY_COLOR[logro.nivel] }}
                        >
                          · {RARITY_LABEL[logro.nivel]}
                        </span>
                      )}
                    </p>
                  </div>
                  {adminMode && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(logro)}
                        className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Edit achievement"
                        title="Edit achievement"
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setManagingId(managingId === logro.id ? null : logro.id)}
                        className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Award or remove from members"
                        title="Award or remove from members"
                      >
                        <Settings2 size={15} strokeWidth={1.75} />
                      </button>
                    </div>
                  )}
                </div>

                {logro.descripcion && (
                  <p className="mt-3 text-[12.5px] leading-relaxed text-ink-secondary">{logro.descripcion}</p>
                )}
                {logro.como_obtener && (
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-tertiary">
                    <span className="font-medium uppercase tracking-wide">How to get it — </span>
                    {logro.como_obtener}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openAchievementDetail(logro)}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-brown-600 hover:opacity-70"
                >
                  <Info size={13} strokeWidth={2} />
                  See more
                </button>

                {adminMode && managingId === logro.id && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-line-soft pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={grantMemberId}
                        onChange={(e) => setGrantMemberId(e.target.value)}
                        className={`${inputClass} flex-1`}
                      >
                        <option value="">Select member…</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={grantNote}
                        onChange={(e) => setGrantNote(e.target.value)}
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => grant(logro)}
                        disabled={!grantMemberId}
                        className="rounded-full bg-brand-500 px-3.5 py-2 text-[12.5px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-50"
                      >
                        Grant
                      </button>
                    </div>

                    {grantMemberId &&
                      (() => {
                        const selectedGroup = holderGroups.find((g) => g.miembroId === grantMemberId);
                        if (!selectedGroup) return null;
                        return (
                          <div className="flex items-center justify-between gap-2 rounded-control bg-brand-100 px-3 py-2">
                            <span className="text-[12.5px] text-brown-600">
                              {selectedGroup.nombre} already has this achievement
                              {selectedGroup.rows.length > 1 ? ` ×${selectedGroup.rows.length}` : ''}.
                            </span>
                            <button
                              type="button"
                              onClick={() => revokeOne(selectedGroup)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-brown-600 shadow-soft-xs hover:bg-brand-50"
                            >
                              <Minus size={13} strokeWidth={2} />
                              Remove one
                            </button>
                          </div>
                        );
                      })()}

                    {holderGroups.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-secondary">
                          Awarded to
                        </span>
                        {holderGroups.map((g) => (
                          <div
                            key={g.miembroId}
                            className="flex items-center justify-between gap-2 rounded-control bg-white px-3 py-1.5"
                          >
                            <span className="truncate text-[12.5px] text-ink">
                              {g.nombre}
                              {g.rows.length > 1 && (
                                <span className="ml-1.5 rounded-full bg-surface-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-secondary">
                                  ×{g.rows.length}
                                </span>
                              )}
                              {g.rows[0]?.nota && <span className="text-ink-secondary"> — {g.rows[0].nota}</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => revokeOne(g)}
                              className="shrink-0 rounded-control p-1 text-ink-secondary hover:bg-surface-soft hover:text-brown-600"
                              aria-label="Remove one"
                              title="Remove one instance"
                            >
                              <Minus size={13} strokeWidth={2} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {editingId === logro.id && (
                  <div className="mt-4 border-t border-line-soft pt-3">
                    <AdminEditForm
                      onSubmit={() => saveEdit(logro.id)}
                      onDelete={() => deleteLogro(logro.id)}
                      onCancel={() => setEditingId(null)}
                    >
                      <AchievementFields form={editForm} setForm={setEditForm} areas={areas} />
                    </AdminEditForm>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      )}

      <div className="mt-14">
        <div className="mb-4 flex items-center gap-2">
          <ScrollText size={17} strokeWidth={1.75} className="text-ink-tertiary" />
          <h2 className="text-[15px] font-semibold text-ink">Achievement log</h2>
        </div>

        {logLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full animate-shimmer rounded-card" />
            ))}
          </div>
        ) : log.length === 0 ? (
          <div className="rounded-card bg-surface-soft px-6 py-16 text-center">
            <p className="text-[13.5px] text-ink-secondary">No achievements have been awarded yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-card bg-surface-soft">
              <table className="w-full min-w-[820px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-soft text-[11px] uppercase tracking-wide text-ink-secondary">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Achievement</th>
                    <th className="px-4 py-3 font-medium">Points</th>
                    <th className="px-4 py-3 font-medium">Awarded by</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((row) => (
                    <tr key={row.id} className="border-b border-line-soft last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-ink-secondary">
                        {new Date(row.created_at).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.miembro?.nombre || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AchievementBadge icono={row.logros?.icono} color={row.logros?.color} locked={false} size={26} />
                          <span className="whitespace-nowrap text-ink">{row.logros?.nombre || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-600">+{row.puntos}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-secondary">{row.otorgante?.nombre || 'System'}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-ink-secondary" title={row.nota || ''}>
                        {row.nota || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-secondary">
                        {LOG_TYPE_LABEL[row.logros?.tipo] || 'Award'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logHasMore && (
              <button
                type="button"
                onClick={loadMoreLog}
                disabled={logLoadingMore}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-surface-soft px-4 py-2 text-[12.5px] font-medium text-ink-secondary transition-colors duration-350 ease-emil hover:bg-brand-100 hover:text-brown-600 disabled:opacity-60"
              >
                {logLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>

      <Modal open={!!detailLogro} onClose={() => setDetailLogro(null)} title={detailLogro?.nombre}>
        {detailLogro &&
          (() => {
            const total = members.length;
            const holders = members
              .filter((m) => detailHolderIds.has(m.id))
              .sort((a, b) => a.nombre.localeCompare(b.nombre));
            const nonHolders = members
              .filter((m) => !detailHolderIds.has(m.id))
              .sort((a, b) => a.nombre.localeCompare(b.nombre));
            const pct = total > 0 ? ((detailHolderIds.size / total) * 100).toFixed(1) : '0.0';

            return (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <AchievementBadge
                    icono={detailLogro.icono}
                    color={detailLogro.color}
                    locked={false}
                    size={48}
                    nivel={detailLogro.nivel}
                  />
                  <div>
                    <p className="text-[13px] text-ink-secondary">
                      {detailLogro.puntos} pts
                      {detailLogro.nivel && (
                        <>
                          {' · '}
                          <span style={{ color: RARITY_COLOR[detailLogro.nivel] }}>
                            {RARITY_LABEL[detailLogro.nivel]}
                          </span>
                        </>
                      )}
                    </p>
                    {detailLoading ? (
                      <p className="text-[13px] text-ink-secondary">Loading…</p>
                    ) : (
                      <p className="text-[13px] font-medium text-ink">
                        Earned by {pct}% of members ({detailHolderIds.size}/{total})
                      </p>
                    )}
                  </div>
                </div>

                {!detailLoading && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                        Has it ({holders.length})
                      </h4>
                      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                        {holders.length === 0 ? (
                          <p className="text-[12.5px] italic text-ink-tertiary">No one yet.</p>
                        ) : (
                          holders.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 rounded-control bg-surface-soft px-2.5 py-1.5"
                            >
                              <MemberAvatar member={m} />
                              <span className="truncate text-[13px] text-ink">{m.nombre}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                        Doesn't have it ({nonHolders.length})
                      </h4>
                      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                        {nonHolders.length === 0 ? (
                          <p className="text-[12.5px] italic text-ink-tertiary">Everyone has it!</p>
                        ) : (
                          nonHolders.map((m) => (
                            <div key={m.id} className="flex items-center gap-2 rounded-control px-2.5 py-1.5 opacity-60">
                              <MemberAvatar member={m} />
                              <span className="truncate text-[13px] text-ink-secondary">{m.nombre}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}
