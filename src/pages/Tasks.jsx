import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import { deadlineStatus, DEADLINE_LABEL, DEADLINE_COLOR } from '../utils/deadline';
import { CheckSquare, Pencil, CheckCircle2, Settings2 } from 'lucide-react';

const ESTADO_LABEL = { pendiente: 'Pending', en_progreso: 'In progress', completada: 'Completed' };
const ESTADO_STYLE = {
  pendiente: 'bg-white text-ink-secondary ring-1 ring-inset ring-line',
  en_progreso: 'bg-brand-100 text-brown-600',
  completada: 'bg-brown-600 text-white',
};
const PRIORIDAD_LABEL = { baja: 'Low', media: 'Medium', alta: 'High' };
const PRIORITY_COLOR = { baja: '#22c55e', media: '#f59e0b', alta: '#ef4444' };

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const TASK_SELECT =
  '*, logros(puntos), areas(nombre), tarea_asignados(miembro_id, estado, aprobada, completed_at, approved_at, miembros!tarea_asignados_miembro_id_fkey(nombre, foto_url))';

function MemberPicker({ members, selectedIds, onChange }) {
  const allSelected = members.length > 0 && selectedIds.length === members.length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-ink-secondary">Assign to</span>
        <button
          type="button"
          onClick={() => onChange(allSelected ? [] : members.map((m) => m.id))}
          className="text-[11.5px] font-medium text-brown-600 hover:opacity-70"
        >
          {allSelected ? 'Clear all' : 'Select all'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const checked = selectedIds.includes(m.id);
          return (
            <label
              key={m.id}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors duration-350 ease-emil ${
                checked ? 'bg-brand-100 text-brown-600' : 'bg-white text-ink-secondary ring-1 ring-inset ring-line'
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={() =>
                  onChange(checked ? selectedIds.filter((id) => id !== m.id) : [...selectedIds, m.id])
                }
              />
              {m.nombre}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TaskFields({ titulo, setTitulo, descripcion, setDescripcion, prioridad, setPrioridad, areaId, setAreaId, areas, fechaLimite, setFechaLimite, puntos, setPuntos, members, memberIds, setMemberIds }) {
  return (
    <>
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
        <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className={inputClass}>
          <option value="baja">Low priority</option>
          <option value="media">Medium priority</option>
          <option value="alta">High priority</option>
        </select>
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
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Points on approval</span>
          <input
            type="number"
            min={0}
            value={puntos}
            onChange={(e) => setPuntos(Number(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>
      <MemberPicker members={members} selectedIds={memberIds} onChange={setMemberIds} />
    </>
  );
}

export default function Tasks() {
  const { adminMode, member, refreshMember } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('mine');
  const [managingId, setManagingId] = useState(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [areaId, setAreaId] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [puntos, setPuntos] = useState(0);
  const [memberIds, setMemberIds] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrioridad, setEditPrioridad] = useState('media');
  const [editAreaId, setEditAreaId] = useState('');
  const [editFechaLimite, setEditFechaLimite] = useState('');
  const [editPuntos, setEditPuntos] = useState(0);
  const [editMemberIds, setEditMemberIds] = useState([]);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tareas')
      .select(TASK_SELECT)
      .order('fecha_limite', { ascending: true, nullsFirst: false });
    if (error) console.error('Error:', error);
    setTasks(data || []);
  }

  useEffect(() => {
    async function load() {
      await Promise.all([
        fetchTasks(),
        supabase
          .from('miembros')
          .select('*')
          .eq('activo', true)
          .order('nombre')
          .then(({ data }) => setMembers(data || [])),
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

  function startEdit(task) {
    setEditingId(task.id);
    setEditTitulo(task.titulo);
    setEditDescripcion(task.descripcion || '');
    setEditPrioridad(task.prioridad);
    setEditAreaId(task.area_id || '');
    setEditFechaLimite(task.fecha_limite || '');
    setEditPuntos(task.logros?.puntos ?? 0);
    setEditMemberIds((task.tarea_asignados || []).map((a) => a.miembro_id));
  }

  async function syncAssignees(tareaId, currentAssignees, selectedMemberIds) {
    const currentIds = currentAssignees.map((a) => a.miembro_id);
    const toAdd = selectedMemberIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentAssignees.filter((a) => !selectedMemberIds.includes(a.miembro_id));

    for (const a of toRemove) {
      if (a.aprobada) {
        await supabase
          .from('tarea_asignados')
          .update({ aprobada: false, approved_at: null, approved_by: null })
          .eq('tarea_id', tareaId)
          .eq('miembro_id', a.miembro_id);
      }
    }
    if (toRemove.length > 0) {
      await supabase
        .from('tarea_asignados')
        .delete()
        .eq('tarea_id', tareaId)
        .in('miembro_id', toRemove.map((a) => a.miembro_id));
    }
    if (toAdd.length > 0) {
      await supabase.from('tarea_asignados').insert(toAdd.map((miembro_id) => ({ tarea_id: tareaId, miembro_id })));
    }
  }

  async function handleAdd() {
    if (memberIds.length === 0) throw new Error('Select at least one member to assign this to.');

    const { data: logro, error: logroError } = await supabase
      .from('logros')
      .insert({
        nombre: titulo.trim(),
        descripcion: descripcion.trim() || null,
        puntos,
        icono: 'lucide:CheckSquare',
        color: '#6c450e',
        es_global: true,
        tipo: 'task',
      })
      .select()
      .single();
    if (logroError) throw logroError;

    const { data: task, error: taskError } = await supabase
      .from('tareas')
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        prioridad,
        area_id: areaId || null,
        fecha_limite: fechaLimite || null,
        logro_id: logro.id,
      })
      .select()
      .single();
    if (taskError) throw taskError;

    const { error: assignError } = await supabase
      .from('tarea_asignados')
      .insert(memberIds.map((miembro_id) => ({ tarea_id: task.id, miembro_id })));
    if (assignError) throw assignError;

    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setAreaId('');
    setFechaLimite('');
    setPuntos(0);
    setMemberIds([]);
    fetchTasks();
  }

  async function saveEdit(task) {
    if (editMemberIds.length === 0) throw new Error('Select at least one member to assign this to.');

    if (task.logro_id) {
      const { error: logroError } = await supabase
        .from('logros')
        .update({ nombre: editTitulo.trim(), descripcion: editDescripcion.trim() || null, puntos: editPuntos })
        .eq('id', task.logro_id);
      if (logroError) throw logroError;
    }

    const { error: taskError } = await supabase
      .from('tareas')
      .update({
        titulo: editTitulo.trim(),
        descripcion: editDescripcion.trim() || null,
        prioridad: editPrioridad,
        area_id: editAreaId || null,
        fecha_limite: editFechaLimite || null,
      })
      .eq('id', task.id);
    if (taskError) throw taskError;

    await syncAssignees(task.id, task.tarea_asignados || [], editMemberIds);

    setEditingId(null);
    fetchTasks();
  }

  async function deleteTask(task) {
    const { error } = await supabase.from('tareas').delete().eq('id', task.id);
    if (error) throw error;
    if (task.logro_id) {
      await supabase.from('logros').delete().eq('id', task.logro_id);
    }
    setEditingId(null);
    fetchTasks();
  }

  async function markDone(taskId) {
    const { error } = await supabase
      .from('tarea_asignados')
      .update({ estado: 'completada', completed_at: new Date().toISOString() })
      .eq('tarea_id', taskId)
      .eq('miembro_id', member.id);
    if (error) console.error('Error:', error);
    else fetchTasks();
  }

  async function setApproval(taskId, miembroId, approved) {
    const payload = approved
      ? { aprobada: true, approved_at: new Date().toISOString(), approved_by: member.id }
      : { aprobada: false, approved_at: null, approved_by: null };
    const { error } = await supabase.from('tarea_asignados').update(payload).eq('tarea_id', taskId).eq('miembro_id', miembroId);
    if (error) console.error('Error:', error);
    else {
      fetchTasks();
      refreshMember();
    }
  }

  const visibleTasks = useMemo(() => {
    if (view === 'team') return tasks;
    return tasks.filter((t) => (t.tarea_asignados || []).some((a) => a.miembro_id === member?.id));
  }, [tasks, view, member?.id]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-6 text-[22px] font-semibold tracking-tight text-ink">Tasks</h1>

      <div className="mb-8 inline-flex items-center gap-1 rounded-full bg-surface-soft p-1">
        <button
          type="button"
          onClick={() => setView('mine')}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors duration-350 ease-emil ${
            view === 'mine' ? 'bg-white text-ink shadow-soft-xs' : 'text-ink-secondary'
          }`}
        >
          My Tasks
        </button>
        <button
          type="button"
          onClick={() => setView('team')}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors duration-350 ease-emil ${
            view === 'team' ? 'bg-white text-ink shadow-soft-xs' : 'text-ink-secondary'
          }`}
        >
          Team Tasks
        </button>
      </div>

      {adminMode && (
        <AdminAddPanel label="Add task" onSubmit={handleAdd} submitLabel="Add task">
          <TaskFields
            titulo={titulo}
            setTitulo={setTitulo}
            descripcion={descripcion}
            setDescripcion={setDescripcion}
            prioridad={prioridad}
            setPrioridad={setPrioridad}
            areaId={areaId}
            setAreaId={setAreaId}
            areas={areas}
            fechaLimite={fechaLimite}
            setFechaLimite={setFechaLimite}
            puntos={puntos}
            setPuntos={setPuntos}
            members={members}
            memberIds={memberIds}
            setMemberIds={setMemberIds}
          />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-1/2 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : visibleTasks.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <CheckSquare size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">
            {view === 'mine' ? "You don't have any tasks assigned." : 'No tasks yet.'}
          </p>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleTasks.map((task, i) => {
            const assignees = task.tarea_asignados || [];
            const mine = assignees.find((a) => a.miembro_id === member?.id);
            const approvedCount = assignees.filter((a) => a.aprobada).length;
            const allApproved = assignees.length > 0 && approvedCount === assignees.length;
            const deadline = deadlineStatus(task.fecha_limite, allApproved);
            const points = task.logros?.puntos ?? 0;

            return (
              <Reveal key={task.id} delay={Math.min(i, 5) * 50} className="rounded-card bg-surface-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PRIORITY_COLOR[task.prioridad] }}
                      title={`${PRIORIDAD_LABEL[task.prioridad] || task.prioridad} priority`}
                    />
                    <h3 className="text-[15px] font-semibold text-ink">{task.titulo}</h3>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {deadline && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white"
                        style={{ backgroundColor: DEADLINE_COLOR[deadline] }}
                      >
                        {DEADLINE_LABEL[deadline]}
                      </span>
                    )}
                    {points > 0 && (
                      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brown-600">
                        {points} pts
                      </span>
                    )}
                    {assignees.length > 0 && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-secondary shadow-soft-xs">
                        {approvedCount}/{assignees.length} approved
                      </span>
                    )}
                    {adminMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => setManagingId(managingId === task.id ? null : task.id)}
                          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                          aria-label="Manage assignees"
                          title="Manage assignees"
                        >
                          <Settings2 size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(task)}
                          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                          aria-label="Edit task"
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {task.descripcion && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{task.descripcion}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-secondary">
                  <span>Priority: {PRIORIDAD_LABEL[task.prioridad] || task.prioridad}</span>
                  {task.areas?.nombre && <span>Area: {task.areas.nombre}</span>}
                  {task.fecha_limite && <span>Due: {dateFormatter.format(new Date(`${task.fecha_limite}T00:00:00`))}</span>}
                </div>

                {assignees.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {assignees.map((a) => (
                      <span
                        key={a.miembro_id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
                          ESTADO_STYLE[a.estado] || ESTADO_STYLE.pendiente
                        }`}
                      >
                        {a.miembros?.nombre || 'Unknown'}
                        {a.aprobada && <CheckCircle2 size={12} strokeWidth={2} />}
                        {!a.aprobada && a.estado !== 'pendiente' && <span>· {ESTADO_LABEL[a.estado]}</span>}
                      </span>
                    ))}
                  </div>
                )}

                {mine && mine.estado !== 'completada' && (
                  <button
                    type="button"
                    onClick={() => markDone(task.id)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-green-700"
                  >
                    <CheckCircle2 size={14} strokeWidth={2} />
                    Mark as done
                  </button>
                )}
                {mine && mine.estado === 'completada' && !mine.aprobada && (
                  <p className="mt-3 text-[12px] italic text-ink-tertiary">Marked done — waiting for approval.</p>
                )}

                {adminMode && managingId === task.id && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-3">
                    {assignees.length === 0 ? (
                      <p className="text-[12.5px] italic text-ink-tertiary">No one assigned.</p>
                    ) : (
                      assignees.map((a) => (
                        <div
                          key={a.miembro_id}
                          className="flex items-center justify-between gap-2 rounded-control bg-white px-3 py-2"
                        >
                          <span className="text-[12.5px] text-ink">
                            {a.miembros?.nombre || 'Unknown'}
                            <span className="ml-2 text-[11px] text-ink-secondary">{ESTADO_LABEL[a.estado]}</span>
                          </span>
                          {a.aprobada ? (
                            <button
                              type="button"
                              onClick={() => setApproval(task.id, a.miembro_id, false)}
                              className="shrink-0 rounded-full bg-surface-soft px-3 py-1.5 text-[12px] font-medium text-ink-secondary hover:bg-brand-100"
                            >
                              Unapprove
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setApproval(task.id, a.miembro_id, true)}
                              disabled={a.estado !== 'completada'}
                              className="shrink-0 rounded-full bg-brown-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-brown-700 disabled:opacity-40"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {editingId === task.id && (
                  <AdminEditForm
                    onSubmit={() => saveEdit(task)}
                    onDelete={() => deleteTask(task)}
                    onCancel={() => setEditingId(null)}
                  >
                    <TaskFields
                      titulo={editTitulo}
                      setTitulo={setEditTitulo}
                      descripcion={editDescripcion}
                      setDescripcion={setEditDescripcion}
                      prioridad={editPrioridad}
                      setPrioridad={setEditPrioridad}
                      areaId={editAreaId}
                      setAreaId={setEditAreaId}
                      areas={areas}
                      fechaLimite={editFechaLimite}
                      setFechaLimite={setEditFechaLimite}
                      puntos={editPuntos}
                      setPuntos={setEditPuntos}
                      members={members}
                      memberIds={editMemberIds}
                      setMemberIds={setEditMemberIds}
                    />
                  </AdminEditForm>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
