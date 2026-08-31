import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import { parseDriveUrl } from '../utils/drive';
import { BookOpen, FileText, ExternalLink, Pencil } from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyForm = { titulo: '', driveUrl: '', descripcion: '' };

function LibraryFields({ form, setForm }) {
  return (
    <>
      <input
        type="text"
        required
        placeholder="Title"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        className={inputClass}
      />
      <input
        type="url"
        required
        placeholder="Google Drive link (https://drive.google.com/…)"
        value={form.driveUrl}
        onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />
    </>
  );
}

export default function Library() {
  const { adminMode, member } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function fetchItems() {
    const { data, error } = await supabase.from('biblioteca').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error:', error);
    else setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    async function run() {
      await fetchItems();
    }
    run();
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('biblioteca').insert({
      titulo: addForm.titulo.trim(),
      drive_url: addForm.driveUrl.trim(),
      descripcion: addForm.descripcion.trim() || null,
      creado_por: member?.id || null,
    });
    if (error) throw error;
    setAddForm(emptyForm);
    fetchItems();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({ titulo: item.titulo, driveUrl: item.drive_url, descripcion: item.descripcion || '' });
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from('biblioteca')
      .update({
        titulo: editForm.titulo.trim(),
        drive_url: editForm.driveUrl.trim(),
        descripcion: editForm.descripcion.trim() || null,
      })
      .eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchItems();
  }

  async function deleteItem(id) {
    const { error } = await supabase.from('biblioteca').delete().eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchItems();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Library</h1>

      {adminMode && (
        <AdminAddPanel label="Add document" onSubmit={handleAdd} submitLabel="Add document">
          <LibraryFields form={addForm} setForm={setAddForm} />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3] animate-shimmer rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <BookOpen size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No documents in the library yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const drive = parseDriveUrl(item.drive_url);
            return (
              <Reveal key={item.id} delay={Math.min(i, 5) * 60} className="rounded-card bg-surface-soft p-4">
                <div className="mb-3 aspect-[4/3] overflow-hidden rounded-control bg-white">
                  {drive ? (
                    <iframe
                      src={drive.previewUrl}
                      title={item.titulo}
                      className="h-full w-full"
                      sandbox="allow-scripts allow-same-origin allow-popups"
                      loading="lazy"
                    />
                  ) : (
                    <a
                      href={item.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-secondary hover:text-ink"
                    >
                      <FileText size={32} strokeWidth={1.25} />
                      <span className="text-[12px]">Open link</span>
                    </a>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[14.5px] font-semibold text-ink">{item.titulo}</h3>
                    {item.descripcion && (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-secondary">{item.descripcion}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={item.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                      aria-label="Open in Drive"
                    >
                      <ExternalLink size={14} strokeWidth={1.75} />
                    </a>
                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Edit document"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {editingId === item.id && (
                  <AdminEditForm
                    onSubmit={() => saveEdit(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onCancel={() => setEditingId(null)}
                  >
                    <LibraryFields form={editForm} setForm={setEditForm} />
                  </AdminEditForm>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
