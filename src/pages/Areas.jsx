import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Reveal from '../components/Reveal';
import { Layers } from 'lucide-react';

export default function Areas() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAreas() {
      const { data, error } = await supabase.from('areas').select('*').order('nombre');
      if (error) console.error('Error:', error);
      else setAreas(data || []);
      setLoading(false);
    }
    fetchAreas();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Areas</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-1/2 animate-shimmer rounded-full" />
              <div className="skeleton mt-3 h-3 w-full animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : areas.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Layers size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No areas registered yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, i) => (
            <Reveal key={area.id} delay={Math.min(i, 5) * 60} className="rounded-card bg-surface-soft p-5">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color || '#6c450e' }}
                />
                <h3 className="text-[15px] font-semibold text-ink">{area.nombre}</h3>
              </div>
              {area.descripcion && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{area.descripcion}</p>
              )}
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
