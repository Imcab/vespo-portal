import { useState } from 'react';

export default function AdminEditForm({ onSubmit, onDelete, onCancel, children, submitLabel = 'Save' }) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 border-t border-line-soft pt-3">
      {children}
      {error && <p className="text-[13px] text-brown-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || deleting}
          className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-1.5 text-[12.5px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-ink-secondary hover:text-ink"
        >
          Cancel
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="ml-auto rounded-full px-3 py-1.5 text-[12.5px] font-medium text-brown-600 hover:bg-brand-100 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  );
}
