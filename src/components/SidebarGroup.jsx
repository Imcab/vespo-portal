import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SidebarGroup({ label, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="px-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-control px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-secondary transition-colors duration-350 ease-emil hover:text-ink"
      >
        {label}
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`transition-transform duration-350 ease-emil ${open ? '' : '-rotate-90'}`}
        />
      </button>
      <div className={`collapse-grid ${open ? 'is-open' : ''}`}>
        <div>
          <div className="flex flex-col gap-0.5 pb-2 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
