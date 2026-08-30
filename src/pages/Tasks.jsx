import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import { CheckSquare } from 'lucide-react';

const ESTADO_LABEL = { pendiente: 'Pending', en_progreso: 'In progress', completada: 'Completed' };
const ESTADO_STYLE = {
  pendiente: 'bg-surface-soft text-ink-secondary',
  en_progreso: 'bg-brand-100 text-brown-600',
  completada: 'bg-brown-600 text-white',
};
const PRIORIDAD_LABEL = { baja: 'Low', media: 'Medium', alta: 'High' };

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

export default function Tasks() {
  const { adminMode, member } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState('media');
  const [areaId, setAreaId] = useState('');
  const [asignadoA, setAsignadoA] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  async function fetchTasks() {
    const { data } = await supabase
      .from('tareas')
      .select('*, miembros(nombre), areas(nombre)')
      .order('fecha_limite', { ascending: true, nullsFirst: false });
    setTasks(data || []);
  }

  useEffect(() => {
    async function loadTasks() {
      const { data, error } = await supabase
        .from('tareas')
        .select('*, miembros(nombre), areas(nombre)')
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) console.error('Error:', error);
      else setTasks(data || []);
      setLoading(false);
    }
    loadTasks();
    supabase
      .from('miembros')
      .select('*')
      .order('nombre')
      .then(({ data }) => setMembers(data || []));
    supabase
      .from('areas')
      .select('*')
      .order('nombre')
      .then(({ data }) => setAreas(data || []));
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('tareas').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      prioridad,
      area_id: areaId || null,
      asignado_a: asignadoA || null,
      fecha_limite: fechaLimite || null,
    });
    if (error) throw error;
    setTitulo('');
    setDescripcion('');
    setPrioridad('media');
    setAreaId('');
    setAsignadoA('');
    setFechaLimite('');
    fetchTasks();
  }

  async function markDone(taskId) {
    const { error } = await supabase.from('tareas').update({ estado: 'completada' }).eq('id', taskId);
    if (error) console.error('Error:', error);
    else fetchTasks();
  }

  async function approve(taskId) {
    const { error } = await supabase.from('tareas').update({ aprobada: true }).eq('id', taskId);
    if (error) console.error('Error:', error);
    else fetchTasks();
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Tasks</h1>

      {adminMode && (
        <AdminAddPanel label="Add task" onSubmit={handleAdd} submitLabel="Add task">
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
          <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)} className={inputClass}>
            <option value="">Everyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-ink-secondary">Due date (optional)</span>
            <input
              type="date"
              value={fechaLimite}
              onChange={(e) => setFechaLimite(e.target.value)}
              className={inputClass}
            />
          </label>
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
      ) : tasks.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <CheckSquare size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No tasks yet.</p>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task, i) => {
            const isMine = !task.asignado_a || task.asignado_a === member?.id;
            const canMarkDone = isMine && task.estado !== 'completada';
            const canApprove = adminMode && task.estado === 'completada' && !task.aprobada;

            return (
              <Reveal key={task.id} delay={Math.min(i, 5) * 50} className="rounded-card bg-surface-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">{task.titulo}</h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {task.aprobada && (
                      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brown-600">
                        Approved
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        ESTADO_STYLE[task.estado] || ESTADO_STYLE.pendiente
                      }`}
                    >
                      {ESTADO_LABEL[task.estado] || task.estado}
                    </span>
                  </div>
                </div>
                {task.descripcion && (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{task.descripcion}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-secondary">
                  <span>Priority: {PRIORIDAD_LABEL[task.prioridad] || task.prioridad}</span>
                  <span>Assigned: {task.miembros?.nombre || 'Everyone'}</span>
                  {task.areas?.nombre && <span>Area: {task.areas.nombre}</span>}
                  {task.fecha_limite && <span>Due: {dateFormatter.format(new Date(task.fecha_limite))}</span>}
                </div>
                {(canMarkDone || canApprove) && (
                  <div className="mt-3 flex gap-2">
                    {canMarkDone && (
                      <button
                        type="button"
                        onClick={() => markDone(task.id)}
                        className="rounded-full bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-soft-xs transition-colors duration-350 ease-emil hover:bg-brand-100"
                      >
                        Mark as done
                      </button>
                    )}
                    {canApprove && (
                      <button
                        type="button"
                        onClick={() => approve(task.id)}
                        className="rounded-full bg-brown-600 px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors duration-350 ease-emil hover:bg-brown-700"
                      >
                        Approve
                      </button>
                    )}
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
