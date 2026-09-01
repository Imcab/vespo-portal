import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import { deadlineStatus, DEADLINE_LABEL, DEADLINE_COLOR } from '../utils/deadline';
import { Kanban, CheckCircle2, Trash2 } from 'lucide-react';

const ESTADO_LABEL = { pendiente: 'Pending', en_progreso: 'In progress', completada: 'Completed' };
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const BOARD_SELECT =
  '*, logros(puntos), areas(nombre), board_asignados(miembro_id, estado, aprobada, completed_at, approved_at, miembros!board_asignados_miembro_id_fkey(nombre))';

export default function Board() {
  const { adminMode, member, refreshMember } = useAuth();
  const [postings, setPostings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState('');

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [puntos, setPuntos] = useState(50);
  const [cupo, setCupo] = useState(1);
  const [areaId, setAreaId] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  async function fetchPostings() {
    const { data, error: fetchError } = await supabase
      .from('board_tareas')
      .select(BOARD_SELECT)
      .order('created_at', { ascending: false });
    if (fetchError) console.error('Error:', fetchError);
    setPostings(data || []);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([
        fetchPostings(),
        supabase
          .from('areas')
          .select('*')
          .order('nombre')
          .then(({ data }) => setAreas(data || [])),
      ]);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd() {
    const { data: logro, error: logroError } = await supabase
      .from('logros')
      .insert({
        nombre: titulo.trim(),
        descripcion: descripcion.trim() || null,
        puntos,
        icono: 'lucide:Kanban',
        color: '#3b82f6',
        es_global: true,
        tipo: 'board',
      })
      .select()
      .single();
    if (logroError) throw logroError;

    const { error: boardError } = await supabase.from('board_tareas').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      cupo,
      area_id: areaId || null,
      fecha_limite: fechaLimite || null,
      logro_id: logro.id,
      created_by: member.id,
    });
    if (boardError) throw boardError;

    setTitulo('');
    setDescripcion('');
    setPuntos(50);
    setCupo(1);
    setAreaId('');
    setFechaLimite('');
    fetchPostings();
  }

  async function deletePosting(posting) {
    if (!window.confirm('Delete this posting? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('board_tareas').delete().eq('id', posting.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (posting.logro_id) {
      await supabase.from('logros').delete().eq('id', posting.logro_id);
    }
    fetchPostings();
  }

  async function claim(postingId) {
    setClaimingId(postingId);
    setError('');
    try {
      const { data, error: claimError } = await supabase.rpc('claim_board_task', {
        target_board_tarea_id: postingId,
      });
      if (claimError) throw claimError;
      if (!data?.claimed) {
        setError(data?.reason === 'full' ? 'That posting just filled up.' : 'You already claimed this one.');
      }
      await fetchPostings();
    } catch (err) {
      setError(err.message);
    } finally {
      setClaimingId(null);
    }
  }

  async function unclaim(postingId) {
    const { error: unclaimError } = await supabase
      .from('board_asignados')
      .delete()
      .eq('board_tarea_id', postingId)
      .eq('miembro_id', member.id);
    if (unclaimError) setError(unclaimError.message);
    else fetchPostings();
  }

  async function markDone(postingId) {
    const { error: updateError } = await supabase
      .from('board_asignados')
      .update({ estado: 'completada', completed_at: new Date().toISOString() })
      .eq('board_tarea_id', postingId)
      .eq('miembro_id', member.id);
    if (updateError) setError(updateError.message);
    else fetchPostings();
  }

  async function setApproval(postingId, miembroId, approved) {
    const payload = approved
      ? { aprobada: true, approved_at: new Date().toISOString(), approved_by: member.id }
      : { aprobada: false, approved_at: null, approved_by: null };
    const { error: approveError } = await supabase
      .from('board_asignados')
      .update(payload)
      .eq('board_tarea_id', postingId)
      .eq('miembro_id', miembroId);
    if (approveError) setError(approveError.message);
    else {
      fetchPostings();
      refreshMember();
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">Board</h1>
        <p className="mt-1 text-[13px] text-ink-secondary">
          Opt-in tasks with limited slots. Claim one, get it done, and earn points once approved.
        </p>
      </div>

      {adminMode && (
        <AdminAddPanel label="Post task" onSubmit={handleAdd} submitLabel="Post task">
          <input
            type="text"
            required
            placeholder="Title"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className={inputClass}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-secondary">Points on approval</span>
              <input type="number" min={0} required value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-secondary">Slots (cupo)</span>
              <input type="number" min={1} required value={cupo} onChange={(e) => setCupo(Number(e.target.value))} className={inputClass} />
            </label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputClass}>
              <option value="">No area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-ink-secondary">Due date (optional)</span>
              <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className={inputClass} />
            </label>
          </div>
        </AdminAddPanel>
      )}

      {error && <p className="mb-4 text-[13px] text-red-600">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 w-full animate-shimmer rounded-card" />
          ))}
        </div>
      ) : postings.length === 0 ? (
        <Reveal as="div" className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center">
          <Kanban size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No open postings right now.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {postings.map((posting, i) => {
            const claims = posting.board_asignados || [];
            const mine = claims.find((c) => c.miembro_id === member?.id);
            const slotsLeft = posting.cupo - claims.length;
            const full = slotsLeft <= 0;
            const points = posting.logros?.puntos ?? 0;
            const deadline = deadlineStatus(posting.fecha_limite, !!mine?.aprobada);

            return (
              <Reveal key={posting.id} delay={Math.min(i, 5) * 50} className="flex flex-col rounded-card bg-surface-soft p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{posting.titulo}</h3>
                  {adminMode && (
                    <button
                      type="button"
                      onClick={() => deletePosting(posting)}
                      className="shrink-0 rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-brown-600"
                      aria-label="Delete posting"
                      title="Delete posting"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>

                {posting.descripcion && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{posting.descripcion}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-secondary">
                  <span className="rounded-full bg-brand-100 px-2.5 py-1 font-medium text-brown-600">{points} pts</span>
                  <span className={`font-medium ${full ? 'text-ink-tertiary' : 'text-ink'}`}>
                    {full ? 'Full' : `${slotsLeft}/${posting.cupo} slots left`}
                  </span>
                  {posting.areas?.nombre && <span>Area: {posting.areas.nombre}</span>}
                  {posting.fecha_limite && <span>Due: {dateFormatter.format(new Date(`${posting.fecha_limite}T00:00:00`))}</span>}
                  {deadline && (
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
                      style={{ backgroundColor: DEADLINE_COLOR[deadline] }}
                    >
                      {DEADLINE_LABEL[deadline]}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4">
                  {mine ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                          mine.aprobada
                            ? 'bg-brown-600 text-white'
                            : mine.estado === 'completada'
                              ? 'bg-brand-100 text-brown-600'
                              : 'bg-white text-ink-secondary ring-1 ring-inset ring-line'
                        }`}
                      >
                        {mine.aprobada ? 'Approved' : ESTADO_LABEL[mine.estado]}
                      </span>
                      {mine.estado !== 'completada' && !mine.aprobada && (
                        <>
                          <button
                            type="button"
                            onClick={() => markDone(posting.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-green-700"
                          >
                            <CheckCircle2 size={14} strokeWidth={2} />
                            Mark as done
                          </button>
                          <button
                            type="button"
                            onClick={() => unclaim(posting.id)}
                            className="text-[12px] font-medium text-ink-secondary hover:text-ink"
                          >
                            Give up slot
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => claim(posting.id)}
                      disabled={full || claimingId === posting.id}
                      className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-[12.5px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-50"
                    >
                      {claimingId === posting.id ? 'Claiming…' : full ? 'Full' : 'Claim'}
                    </button>
                  )}
                </div>

                {adminMode && claims.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-3">
                    {claims.map((c) => (
                      <div key={c.miembro_id} className="flex items-center justify-between gap-2 rounded-control bg-white px-3 py-2">
                        <span className="text-[12.5px] text-ink">
                          {c.miembros?.nombre || 'Unknown'}
                          <span className="ml-2 text-[11px] text-ink-secondary">{ESTADO_LABEL[c.estado]}</span>
                        </span>
                        {c.aprobada ? (
                          <button
                            type="button"
                            onClick={() => setApproval(posting.id, c.miembro_id, false)}
                            className="shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-[12px] font-medium text-ink-secondary hover:bg-brand-100"
                          >
                            Unapprove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setApproval(posting.id, c.miembro_id, true)}
                            disabled={c.estado !== 'completada'}
                            className="shrink-0 rounded-full bg-brown-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-brown-700 disabled:opacity-40"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
