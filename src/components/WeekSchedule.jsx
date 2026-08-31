import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWeekStart, getWeekDays, addWeeks } from '../utils/week';

const GRID_START = 6; // 6:00
const GRID_END = 23; // 23:00
const ROW_HEIGHT = 44;
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const TIPO_COLOR = {
  general: '#57524c',
  sesion: '#e6c200',
  competencia: '#0ea5e9',
  entrega: '#ef4444',
  tarea: '#6c450e',
};

function hourLabel(hour) {
  const period = hour < 12 ? 'AM' : 'PM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:00 ${period}`;
}

export default function WeekSchedule({ events, adminMode, onSelectEvent }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = new Date();
  const hours = useMemo(() => {
    const list = [];
    for (let h = GRID_START; h < GRID_END; h++) list.push(h);
    return list;
  }, []);

  const { allDayByDay, timedByDay } = useMemo(() => {
    const allDay = Array.from({ length: 7 }, () => []);
    const timed = Array.from({ length: 7 }, () => []);

    events.forEach((event) => {
      const start = new Date(event.fecha_inicio);
      const dayIndex = days.findIndex((d) => d.toDateString() === start.toDateString());
      if (dayIndex === -1) return;

      if (event.tipo === 'tarea') {
        allDay[dayIndex].push(event);
        return;
      }

      const startHour = Math.min(Math.max(start.getHours() + start.getMinutes() / 60, GRID_START), GRID_END);
      const end = event.fecha_fin ? new Date(event.fecha_fin) : null;
      let endHour =
        end && end.toDateString() === start.toDateString()
          ? end.getHours() + end.getMinutes() / 60
          : startHour + 1;
      endHour = Math.min(Math.max(endHour, startHour + 0.5), GRID_END);

      timed[dayIndex].push({
        ...event,
        top: (startHour - GRID_START) * ROW_HEIGHT,
        height: (endHour - startHour) * ROW_HEIGHT,
      });
    });

    return { allDayByDay: allDay, timedByDay: timed };
  }, [events, days]);

  const hasAllDay = allDayByDay.some((list) => list.length > 0);
  const weekLabel = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="mb-8 rounded-card bg-surface-soft p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, -1))}
          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink">{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekStart(getWeekStart())}
            className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-secondary shadow-soft-xs hover:text-ink"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
          aria-label="Next week"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[56px_repeat(7,1fr)]">
            <div />
            {days.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 py-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-ink-tertiary">
                    {WEEKDAY_LABELS[i]}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12.5px] font-semibold ${
                      isToday ? 'bg-brown-600 text-white' : 'text-ink'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {hasAllDay && (
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-line-soft">
              <div className="flex items-start justify-end pr-2 pt-1 text-[10px] text-ink-tertiary">All day</div>
              {allDayByDay.map((list, i) => (
                <div key={i} className="flex flex-col gap-0.5 border-l border-line-soft p-1">
                  {list.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => adminMode && event.tipo !== 'tarea' && onSelectEvent(event)}
                      className="truncate rounded-control px-1.5 py-0.5 text-left text-[10.5px] font-medium text-white"
                      style={{ backgroundColor: TIPO_COLOR.tarea }}
                      title={event.titulo}
                    >
                      {event.titulo}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-t border-line-soft">
            <div className="flex flex-col">
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: ROW_HEIGHT }}
                  className="flex items-start justify-end pr-2 text-[10px] text-ink-tertiary"
                >
                  <span className="-translate-y-1.5">{hourLabel(h)}</span>
                </div>
              ))}
            </div>

            {timedByDay.map((list, dayIdx) => (
              <div
                key={dayIdx}
                className="relative border-l border-line-soft"
                style={{ height: ROW_HEIGHT * hours.length }}
              >
                {hours.map((h) => (
                  <div key={h} style={{ height: ROW_HEIGHT }} className="border-t border-line-soft" />
                ))}
                {list.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => adminMode && onSelectEvent(event)}
                    className="absolute left-0.5 right-0.5 overflow-hidden rounded-control px-1.5 py-0.5 text-left text-white shadow-soft-xs transition-transform duration-350 ease-emil hover:z-10 hover:scale-[1.02]"
                    style={{ top: event.top, height: Math.max(event.height, 20), backgroundColor: TIPO_COLOR[event.tipo] || TIPO_COLOR.general }}
                    title={event.titulo}
                  >
                    <div className="truncate text-[11px] font-semibold leading-tight">{event.titulo}</div>
                    {event.descripcion && event.height > 30 && (
                      <div className="truncate text-[10px] italic leading-tight opacity-90">{event.descripcion}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
