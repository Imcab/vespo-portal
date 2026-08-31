import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { LUCIDE_NAMES, TABLER_NAMES, resolveIcon, useTablerReady } from '../utils/icons';

const DEFAULT_SUGGESTIONS = [
  'lucide:Award',
  'lucide:Trophy',
  'lucide:Star',
  'lucide:Medal',
  'lucide:Rocket',
  'lucide:Feather',
  'lucide:Zap',
  'lucide:Target',
  'lucide:Flame',
  'lucide:Shield',
  'lucide:Crown',
  'lucide:Sparkles',
  'tabler:IconTrophy',
  'tabler:IconFlame',
  'tabler:IconBolt',
  'tabler:IconDiamond',
  'tabler:IconSwords',
  'tabler:IconRocket',
];

export default function IconPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  useTablerReady(true);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEFAULT_SUGGESTIONS;

    const results = [];
    if (source !== 'tabler') {
      for (const name of LUCIDE_NAMES) {
        if (name.toLowerCase().includes(q)) results.push(`lucide:${name}`);
        if (results.length >= 60) break;
      }
    }
    if (source !== 'lucide' && results.length < 90) {
      for (const name of TABLER_NAMES) {
        if (name.toLowerCase().includes(q)) results.push(`tabler:${name}`);
        if (results.length >= 90) break;
      }
    }
    return results;
  }, [query, source]);

  const SelectedIcon = resolveIcon(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-control border border-line bg-white px-3.5 py-2.5">
        <Search size={15} strokeWidth={1.75} className="text-ink-tertiary" />
        <input
          type="text"
          placeholder="Search thousands of icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-[14px] text-ink outline-none"
        />
        {value && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-1 text-[12px] font-medium text-brown-600">
            {/* eslint-disable-next-line react-hooks/static-components -- stable reference from a static icon-name map */}
            <SelectedIcon size={14} strokeWidth={1.75} />
            {value.split(':')[1] || value}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-full bg-surface-soft p-1 text-[11.5px] font-medium">
        {[
          { id: 'all', label: 'All' },
          { id: 'lucide', label: 'Lucide' },
          { id: 'tabler', label: 'Tabler' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSource(opt.id)}
            className={`rounded-full px-3 py-1 transition-colors duration-350 ease-emil ${
              source === opt.id ? 'bg-white text-ink shadow-soft-xs' : 'text-ink-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid max-h-52 grid-cols-6 gap-1.5 overflow-y-auto rounded-control bg-surface-soft p-2 sm:grid-cols-8">
        {visible.map((iconValue) => {
          const Icon = resolveIcon(iconValue);
          const selected = iconValue === value;
          return (
            <button
              key={iconValue}
              type="button"
              title={iconValue}
              onClick={() => onChange(iconValue)}
              className={`flex h-10 w-10 items-center justify-center rounded-control transition-colors duration-350 ease-emil ${
                selected ? 'bg-brown-600 text-white' : 'bg-white text-ink-secondary hover:text-ink'
              }`}
            >
              <Icon size={17} strokeWidth={1.75} />
            </button>
          );
        })}
        {visible.length === 0 && (
          <p className="col-span-full py-4 text-center text-[12.5px] text-ink-secondary">No icons found.</p>
        )}
      </div>
    </div>
  );
}
