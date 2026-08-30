import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import ResourceIcon from '../components/ResourceIcon';
import { Wrench, Pencil } from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyForm = { titulo: '', descripcion: '', url: '', categoria: '', iconoUrl: '', droneIds: [] };

function ResourceFields({ form, setForm, drones }) {
  function toggleDrone(id) {
    setForm({
      ...form,
      droneIds: form.droneIds.includes(id) ? form.droneIds.filter((d) => d !== id) : [...form.droneIds, id],
    });
  }

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
      <textarea
        placeholder="Description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />
      <input
        type="url"
        required
        placeholder="https://…"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Category (optional)"
        value={form.categoria}
        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
        className={inputClass}
      />
      <input
        type="url"
        placeholder="Icon URL (optional)"
        value={form.iconoUrl}
        onChange={(e) => setForm({ ...form, iconoUrl: e.target.value })}
        className={inputClass}
      />
      {drones.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Linked drones (optional)</span>
          <div className="flex flex-wrap gap-1.5">
            {drones.map((drone) => (
              <button
                key={drone.id}
                type="button"
                onClick={() => toggleDrone(drone.id)}
                className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors duration-350 ease-emil ${
                  form.droneIds.includes(drone.id)
                    ? 'bg-brown-600 text-white'
                    : 'bg-white text-ink-secondary ring-1 ring-inset ring-line hover:text-ink'
                }`}
              >
                {drone.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function Tools() {
  const { adminMode } = useAuth();
  const [resources, setResources] = useState([]);
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function fetchResources() {
    const { data } = await supabase
      .from('recursos')
      .select('*, recurso_drones(dron_id, drones(nombre))')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    setResources(data || []);
  }

  useEffect(() => {
    async function loadResources() {
      const { data, error } = await supabase
        .from('recursos')
        .select('*, recurso_drones(dron_id, drones(nombre))')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) console.error('Error:', error);
      else setResources(data || []);
      setLoading(false);
    }
    loadResources();
    supabase
      .from('drones')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => setDrones(data || []));
  }, []);

  async function syncDroneLinks(resourceId, droneIds) {
    await supabase.from('recurso_drones').delete().eq('recurso_id', resourceId);
    if (droneIds.length > 0) {
      await supabase.from('recurso_drones').insert(droneIds.map((dron_id) => ({ recurso_id: resourceId, dron_id })));
    }
  }

  async function handleAdd() {
    const { data, error } = await supabase
      .from('recursos')
      .insert({
        titulo: addForm.titulo.trim(),
        descripcion: addForm.descripcion.trim() || null,
        url: addForm.url.trim(),
        categoria: addForm.categoria.trim() || null,
        icono_url: addForm.iconoUrl.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    await syncDroneLinks(data.id, addForm.droneIds);
    setAddForm(emptyForm);
    fetchResources();
  }

  function startEdit(resource) {
    setEditingId(resource.id);
    setEditForm({
      titulo: resource.titulo,
      descripcion: resource.descripcion || '',
      url: resource.url,
      categoria: resource.categoria || '',
      iconoUrl: resource.icono_url || '',
      droneIds: (resource.recurso_drones || []).map((link) => link.dron_id),
    });
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from('recursos')
      .update({
        titulo: editForm.titulo.trim(),
        descripcion: editForm.descripcion.trim() || null,
        url: editForm.url.trim(),
        categoria: editForm.categoria.trim() || null,
        icono_url: editForm.iconoUrl.trim() || null,
      })
      .eq('id', id);
    if (error) throw error;
    await syncDroneLinks(id, editForm.droneIds);
    setEditingId(null);
    fetchResources();
  }

  async function deleteResource(id) {
    const { error } = await supabase.from('recursos').delete().eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchResources();
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Tools</h1>

      {adminMode && (
        <AdminAddPanel label="Add tool" onSubmit={handleAdd} submitLabel="Add tool">
          <ResourceFields form={addForm} setForm={setAddForm} drones={drones} />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-2/3 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Wrench size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No tools or resources added yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {resources.map((resource, i) => {
            const linkedDrones = (resource.recurso_drones || []).map((link) => link.drones?.nombre).filter(Boolean);
            return (
              <Reveal
                key={resource.id}
                delay={Math.min(i, 5) * 60}
                className="relative rounded-card bg-surface-soft transition-[transform,box-shadow] duration-450 ease-emil hover:-translate-y-0.5 hover:shadow-soft-lg"
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-full items-start gap-3 p-5 ${adminMode ? 'pr-10' : ''}`}
                >
                  <ResourceIcon resource={resource} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-ink">{resource.titulo}</h3>
                      {resource.categoria && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brown-600">
                          {resource.categoria}
                        </span>
                      )}
                    </div>
                    {resource.descripcion && (
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{resource.descripcion}</p>
                    )}
                    {linkedDrones.length > 0 && (
                      <p className="mt-1.5 text-[12px] text-ink-secondary">Linked to: {linkedDrones.join(', ')}</p>
                    )}
                  </div>
                </a>

                {adminMode && (
                  <button
                    type="button"
                    onClick={() => startEdit(resource)}
                    className="absolute right-3 top-3 rounded-control p-1 text-ink-secondary hover:bg-white hover:text-ink"
                    aria-label="Edit tool"
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>
                )}

                {editingId === resource.id && (
                  <div className="px-5 pb-5">
                    <AdminEditForm
                      onSubmit={() => saveEdit(resource.id)}
                      onDelete={() => deleteResource(resource.id)}
                      onCancel={() => setEditingId(null)}
                    >
                      <ResourceFields form={editForm} setForm={setEditForm} drones={drones} />
                    </AdminEditForm>
                  </div>
                )}
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
