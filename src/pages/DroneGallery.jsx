import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import DroneCard from '../components/DroneCard';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import { Drone } from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card bg-surface-soft">
      <div className="skeleton aspect-[4/3] animate-shimmer" />
      <div className="flex flex-col gap-2.5 px-6 py-5">
        <div className="skeleton h-4 w-2/3 animate-shimmer rounded-full" />
        <div className="skeleton h-3 w-1/3 animate-shimmer rounded-full" />
        <div className="skeleton h-3 w-full animate-shimmer rounded-full" />
      </div>
    </div>
  );
}

export default function DroneGallery() {
  const { adminMode } = useAuth();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [modelo, setModelo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  useEffect(() => {
    async function loadDrones() {
      const { data, error } = await supabase
        .from('drones')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) console.error('Error:', error);
      else setDrones(data || []);
      setLoading(false);
    }
    loadDrones();
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('drones').insert({
      nombre: nombre.trim(),
      modelo: modelo.trim() || null,
      descripcion: descripcion.trim() || null,
      imagen_url: imagenUrl.trim() || null,
    });
    if (error) throw error;
    setNombre('');
    setModelo('');
    setDescripcion('');
    setImagenUrl('');

    const { data } = await supabase
      .from('drones')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    setDrones(data || []);
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <Reveal as="div" className="mb-10 flex items-baseline justify-between">
        <h2 className="text-[22px] font-semibold tracking-tight text-ink">Available models</h2>
        {!loading && (
          <span className="text-[13px] text-ink-secondary">
            {drones.length} {drones.length === 1 ? 'drone' : 'drones'}
          </span>
        )}
      </Reveal>

      {adminMode && (
        <AdminAddPanel label="Add drone" onSubmit={handleAdd} submitLabel="Add drone">
          <input
            type="text"
            required
            placeholder="Name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Model (optional)"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className={inputClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className={inputClass}
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            className={inputClass}
          />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : drones.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Drone size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No drones registered yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drones.map((drone, i) => (
            <Reveal key={drone.id} delay={Math.min(i, 5) * 70}>
              <DroneCard drone={drone} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
