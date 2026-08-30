import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthCalendar({ events, selectedDate, onSelectDate }) {
  const [cursor, setCursor] = useState(() => {
    const base = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventDates = new Set(events.map((e) => new Date(e.fecha_inicio).toDateString()));

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="mb-8 rounded-card bg-surface-soft p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
        <span className="text-[14px] font-semibold text-ink">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
          aria-label="Next month"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-ink-secondary">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDate && date.toDateString() === new Date(selectedDate).toDateString();
          const hasEvent = eventDates.has(date.toDateString());

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : date)}
              className={`flex flex-col items-center gap-0.5 rounded-control py-1.5 text-[13px] transition-colors duration-350 ease-emil ${
                isSelected
                  ? 'bg-brown-600 text-white'
                  : isToday
                    ? 'bg-brand-100 font-semibold text-brown-600'
                    : 'text-ink hover:bg-white'
              }`}
            >
              {date.getDate()}
              <span
                className={`h-1 w-1 rounded-full ${hasEvent ? (isSelected ? 'bg-white' : 'bg-brown-600') : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
