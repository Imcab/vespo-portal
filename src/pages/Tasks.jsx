import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Reveal from '../components/Reveal';
import { CheckSquare } from 'lucide-react';

const ESTADO_LABEL = { pendiente: 'Pending', en_progreso: 'In progress', completada: 'Completed' };
const ESTADO_STYLE = {
  pendiente: 'bg-surface-soft text-ink-secondary',
  en_progreso: 'bg-brand-100 text-brown-600',
  completada: 'bg-brown-600 text-white',
};
const PRIORIDAD_LABEL = { baja: 'Low', media: 'Medium', alta: 'High' };

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('tareas')
        .select('*, miembros(nombre), areas(nombre)')
        .order('fecha_limite', { ascending: true, nullsFirst: false });
      if (error) console.error('Error:', error);
      else setTasks(data || []);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Tasks</h1>

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
          {tasks.map((task, i) => (
            <Reveal key={task.id} delay={Math.min(i, 5) * 50} className="rounded-card bg-surface-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-ink">{task.titulo}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    ESTADO_STYLE[task.estado] || ESTADO_STYLE.pendiente
                  }`}
                >
                  {ESTADO_LABEL[task.estado] || task.estado}
                </span>
              </div>
              {task.descripcion && (
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">{task.descripcion}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-secondary">
                <span>Priority: {PRIORIDAD_LABEL[task.prioridad] || task.prioridad}</span>
                {task.miembros?.nombre && <span>Assigned: {task.miembros.nombre}</span>}
                {task.areas?.nombre && <span>Area: {task.areas.nombre}</span>}
                {task.fecha_limite && <span>Due: {dateFormatter.format(new Date(task.fecha_limite))}</span>}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
