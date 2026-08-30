import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AdminAddPanel({ label, onSubmit, children, submitLabel = 'Add' }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit();
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98]"
      >
        <Plus size={15} strokeWidth={1.75} />
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-10 flex flex-col gap-3 rounded-card bg-surface-soft p-5">
      {children}
      {error && <p className="text-[13px] text-brown-600">{error}</p>}
      <div className="mt-1 flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-[13px] font-medium text-ink-secondary hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
