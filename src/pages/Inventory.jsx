import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Reveal from '../components/Reveal';
import { Boxes } from 'lucide-react';

const ESTADO_LABEL = {
  disponible: 'Available',
  en_uso: 'In use',
  agotado: 'Out of stock',
  en_reparacion: 'In repair',
};
const ESTADO_STYLE = {
  disponible: 'bg-brand-100 text-brown-600',
  en_uso: 'bg-surface-soft text-ink-secondary',
  agotado: 'bg-brown-600 text-white',
  en_reparacion: 'bg-surface-soft text-ink-secondary',
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase.from('inventario').select('*').order('nombre');
      if (error) console.error('Error:', error);
      else setItems(data || []);
      setLoading(false);
    }
    fetchItems();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Inventory</h1>

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
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <Reveal
              key={item.id}
              delay={Math.min(i, 5) * 50}
              className="flex items-center justify-between gap-4 rounded-card bg-surface-soft p-5"
            >
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-ink">{item.nombre}</h3>
                <p className="mt-0.5 text-[12px] text-ink-secondary">
                  {item.categoria ? `${item.categoria} · ` : ''}
                  {item.cantidad} {item.unidad}
                  {item.ubicacion ? ` · ${item.ubicacion}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  ESTADO_STYLE[item.estado] || ESTADO_STYLE.disponible
                }`}
              >
                {ESTADO_LABEL[item.estado] || item.estado}
              </span>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
