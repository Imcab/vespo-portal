import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import { Calendar, Pencil } from 'lucide-react';

const TIPO_LABEL = {
  general: 'General',
  sesion: 'Session',
  competencia: 'Competition',
  entrega: 'Deadline',
  tarea: 'Task',
};
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

async function loadEventsAndTasks() {
  const [{ data: eventos, error: eventosError }, { data: tareas, error: tareasError }] = await Promise.all([
    supabase.from('eventos').select('*').order('fecha_inicio', { ascending: true }),
    supabase
      .from('tareas')
      .select('id, titulo, descripcion, fecha_limite')
      .eq('aprobada', true)
      .not('fecha_limite', 'is', null),
  ]);
  if (eventosError) console.error('Error:', eventosError);
  if (tareasError) console.error('Error:', tareasError);

  const approvedTasksAsEvents = (tareas || []).map((task) => ({
    id: `tarea-${task.id}`,
    titulo: task.titulo,
    descripcion: task.descripcion,
    tipo: 'tarea',
    fecha_inicio: task.fecha_limite,
  }));

  return [...(eventos || []), ...approvedTasksAsEvents].sort(
    (a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio),
  );
}

export default function CalendarPage() {
  const { adminMode } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('general');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editTipo, setEditTipo] = useState('general');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');

  function startEdit(event) {
    setEditingId(event.id);
    setEditTitulo(event.titulo);
    setEditDescripcion(event.descripcion || '');
    setEditTipo(event.tipo);
    setEditFechaInicio(event.fecha_inicio ? event.fecha_inicio.slice(0, 16) : '');
    setEditFechaFin(event.fecha_fin ? event.fecha_fin.slice(0, 16) : '');
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from('eventos')
      .update({
        titulo: editTitulo.trim(),
        descripcion: editDescripcion.trim() || null,
        tipo: editTipo,
        fecha_inicio: new Date(editFechaInicio).toISOString(),
        fecha_fin: editFechaFin ? new Date(editFechaFin).toISOString() : null,
      })
      .eq('id', id);
    if (error) throw error;
    setEditingId(null);
    setEvents(await loadEventsAndTasks());
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) throw error;
    setEditingId(null);
    setEvents(await loadEventsAndTasks());
  }

  useEffect(() => {
    async function load() {
      const merged = await loadEventsAndTasks();
      setEvents(merged);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('eventos').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      tipo,
      fecha_inicio: new Date(fechaInicio).toISOString(),
      fecha_fin: fechaFin ? new Date(fechaFin).toISOString() : null,
    });
    if (error) throw error;
    setTitulo('');
    setDescripcion('');
    setTipo('general');
    setFechaInicio('');
    setFechaFin('');
    setEvents(await loadEventsAndTasks());
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Calendar</h1>

      {adminMode && (
        <AdminAddPanel label="Add event" onSubmit={handleAdd} submitLabel="Add event">
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
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
            <option value="general">General</option>
            <option value="sesion">Session</option>
            <option value="competencia">Competition</option>
            <option value="entrega">Deadline</option>
          </select>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-ink-secondary">Start</span>
            <input
              type="datetime-local"
              required
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] text-ink-secondary">End (optional)</span>
            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className={inputClass}
            />
          </label>
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-1/3 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Calendar size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No events scheduled yet.</p>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event, i) => {
            const start = new Date(event.fecha_inicio);
            const isRealEvent = event.tipo !== 'tarea';
            return (
              <Reveal key={event.id} delay={Math.min(i, 5) * 50} className="rounded-card bg-surface-soft p-5">
                <div className="flex items-center gap-4">
                  <div className="flex shrink-0 flex-col items-center justify-center rounded-control bg-white px-3 py-2 text-center shadow-soft-xs">
                    <span className="text-[11px] font-medium uppercase text-brown-600">
                      {monthFormatter.format(start)}
                    </span>
                    <span className="text-[18px] font-semibold text-ink">{start.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink">{event.titulo}</h3>
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brown-600">
                        {TIPO_LABEL[event.tipo] || event.tipo}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-secondary">{dateFormatter.format(start)}</p>
                    {event.descripcion && (
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{event.descripcion}</p>
                    )}
                  </div>
                  {adminMode && isRealEvent && (
                    <button
                      type="button"
                      onClick={() => startEdit(event)}
                      className="shrink-0 rounded-control p-1 text-ink-secondary hover:bg-white hover:text-ink"
                      aria-label="Edit event"
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>

                {editingId === event.id && (
                  <AdminEditForm
                    onSubmit={() => saveEdit(event.id)}
                    onDelete={() => deleteEvent(event.id)}
                    onCancel={() => setEditingId(null)}
                  >
                    <input
                      type="text"
                      required
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      className={inputClass}
                    />
                    <textarea
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      rows={2}
                      className={inputClass}
                    />
                    <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)} className={inputClass}>
                      <option value="general">General</option>
                      <option value="sesion">Session</option>
                      <option value="competencia">Competition</option>
                      <option value="entrega">Deadline</option>
                    </select>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] text-ink-secondary">Start</span>
                      <input
                        type="datetime-local"
                        required
                        value={editFechaInicio}
                        onChange={(e) => setEditFechaInicio(e.target.value)}
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] text-ink-secondary">End (optional)</span>
                      <input
                        type="datetime-local"
                        value={editFechaFin}
                        onChange={(e) => setEditFechaFin(e.target.value)}
                        className={inputClass}
                      />
                    </label>
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
