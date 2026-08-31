const PRESETS = [
  '#6c450e',
  '#b8926a',
  '#e6c200',
  '#facc15',
  '#f97316',
  '#fb923c',
  '#ef4444',
  '#f43f5e',
  '#ec4899',
  '#d946ef',
  '#a855f7',
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#06b6d4',
  '#14b8a6',
  '#10b981',
  '#22c55e',
  '#84cc16',
  '#64748b',
  '#475569',
  '#78716c',
  '#57534e',
];

export default function ColorSwatchPicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={color}
            className={`h-7 w-7 shrink-0 rounded-full transition-transform duration-350 ease-emil ${
              value === color ? 'ring-2 ring-offset-2 ring-brown-600' : 'hover:scale-110'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <label className="flex w-fit items-center gap-2 rounded-control border border-line bg-white px-2.5 py-1.5">
        <input
          type="color"
          value={value || '#6c450e'}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer border-none bg-transparent p-0"
        />
        <span className="text-[12px] text-ink-secondary">Custom color</span>
      </label>
    </div>
  );
}
