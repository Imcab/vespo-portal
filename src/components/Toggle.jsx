export default function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      {label && <span className="text-[13px] text-ink-secondary">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-350 ease-emil ${
          checked ? 'bg-brown-600' : 'bg-line'
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-soft-xs transition-transform duration-350 ease-emil ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
