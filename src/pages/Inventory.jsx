import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import { Boxes, Pencil } from 'lucide-react';

const TIPO_LABEL = { consumible: 'Consumable', herramienta: 'Tool', equipo: 'Equipment' };
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyForm = { nombre: '', tipo: 'consumible', cantidad: 0, disponible: 0, unidad: 'pcs', minimo: 0, notas: '', areaId: '' };

function ItemFields({ form, setForm, areas }) {
  return (
    <>
      <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })} className={inputClass}>
        <option value="">General</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.nombre}
          </option>
        ))}
      </select>
      <input
        type="text"
        required
        placeholder="Name"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className={inputClass}
      />
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
        <option value="consumible">Consumable</option>
        <option value="herramienta">Tool</option>
        <option value="equipo">Equipment</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Quantity</span>
          <input
            type="number"
            min="0"
            required
            value={form.cantidad}
            onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Available</span>
          <input
            type="number"
            min="0"
            required
            value={form.disponible}
            onChange={(e) => setForm({ ...form, disponible: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Unit</span>
          <input
            type="text"
            required
            placeholder="pcs"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-ink-secondary">Minimum</span>
          <input
            type="number"
            min="0"
            value={form.minimo}
            onChange={(e) => setForm({ ...form, minimo: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <textarea
        placeholder="Notes (optional)"
        value={form.notas}
        onChange={(e) => setForm({ ...form, notas: e.target.value })}
        rows={2}
        className={inputClass}
      />
    </>
  );
}

export default function Inventory() {
  const { adminMode } = useAuth();
  const [items, setItems] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  async function fetchItems() {
    const { data } = await supabase.from('inventario').select('*, areas(nombre, color)').order('nombre');
    setItems(data || []);
  }

  useEffect(() => {
    async function loadItems() {
      const { data, error } = await supabase.from('inventario').select('*, areas(nombre, color)').order('nombre');
      if (error) console.error('Error:', error);
      else setItems(data || []);
      setLoading(false);
    }
    loadItems();
    supabase
      .from('areas')
      .select('*')
      .order('nombre')
      .then(({ data }) => setAreas(data || []));
  }, []);

  function payloadFrom(form) {
    return {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      cantidad: Number(form.cantidad) || 0,
      disponible: Number(form.disponible) || 0,
      unidad: form.unidad.trim() || 'pcs',
      minimo: Number(form.minimo) || 0,
      notas: form.notas.trim() || null,
      area_id: form.areaId || null,
    };
  }

  async function handleAdd() {
    const { error } = await supabase.from('inventario').insert(payloadFrom(addForm));
    if (error) throw error;
    setAddForm(emptyForm);
    fetchItems();
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({
      nombre: item.nombre,
      tipo: item.tipo,
      cantidad: item.cantidad,
      disponible: item.disponible,
      unidad: item.unidad,
      minimo: item.minimo,
      notas: item.notas || '',
      areaId: item.area_id || '',
    });
  }

  async function saveEdit(id) {
    const { error } = await supabase.from('inventario').update(payloadFrom(editForm)).eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchItems();
  }

  async function deleteItem(id) {
    const { error } = await supabase.from('inventario').delete().eq('id', id);
    if (error) throw error;
    setEditingId(null);
    fetchItems();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Inventory</h1>

      {adminMode && (
        <AdminAddPanel label="Add item" onSubmit={handleAdd} submitLabel="Add item">
          <ItemFields form={addForm} setForm={setAddForm} areas={areas} />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-1/2 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Boxes size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No inventory items yet.</p>
        </Reveal>
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface-soft">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-[11px] uppercase tracking-wide text-ink-secondary">
                <th className="px-4 py-3 font-medium">Area</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Min</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                {adminMode && <th className="px-4 py-3 font-medium" />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id} className="border-b border-line-soft last:border-0">
                    <td colSpan={adminMode ? 9 : 8} className="p-4">
                      <AdminEditForm
                        onSubmit={() => saveEdit(item.id)}
                        onDelete={() => deleteItem(item.id)}
                        onCancel={() => setEditingId(null)}
                      >
                        <ItemFields form={editForm} setForm={setEditForm} areas={areas} />
                      </AdminEditForm>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-b border-line-soft text-ink last:border-0">
                    <td className="px-4 py-3 text-ink-secondary">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.areas?.color || '#d9d3c9' }}
                        />
                        {item.areas?.nombre || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.nombre}</td>
                    <td className="px-4 py-3 text-ink-secondary">{TIPO_LABEL[item.tipo] || item.tipo}</td>
                    <td className="px-4 py-3">{item.cantidad}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.disponible <= item.minimo
                            ? 'rounded-full bg-brown-600 px-2 py-0.5 text-[11px] font-medium text-white'
                            : ''
                        }
                      >
                        {item.disponible}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary">{item.unidad}</td>
                    <td className="px-4 py-3 text-ink-secondary">{item.minimo}</td>
                    <td className="px-4 py-3 text-ink-secondary">{item.notas || '—'}</td>
                    {adminMode && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-control p-1 text-ink-secondary hover:bg-white hover:text-ink"
                          aria-label="Edit item"
                        >
                          <Pencil size={14} strokeWidth={1.75} />
                        </button>
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
