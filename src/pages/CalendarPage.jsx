import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Reveal from '../components/Reveal';
import { Calendar } from 'lucide-react';

const TIPO_LABEL = { general: 'General', sesion: 'Session', competencia: 'Competition', entrega: 'Deadline' };
const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' });
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const { data, error } = await supabase.from('eventos').select('*').order('fecha_inicio', { ascending: true });
      if (error) console.error('Error:', error);
      else setEvents(data || []);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Calendar</h1>

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
            return (
              <Reveal
                key={event.id}
                delay={Math.min(i, 5) * 50}
                className="flex items-center gap-4 rounded-card bg-surface-soft p-5"
              >
                <div className="flex shrink-0 flex-col items-center justify-center rounded-control bg-white px-3 py-2 text-center shadow-soft-xs">
                  <span className="text-[11px] font-medium uppercase text-brown-600">{monthFormatter.format(start)}</span>
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
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
