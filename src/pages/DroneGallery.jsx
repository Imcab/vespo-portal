import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import DroneCard from '../components/DroneCard';
import Reveal from '../components/Reveal';
import { Drone } from 'lucide-react';

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
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDrones() {
      const { data, error } = await supabase
        .from('drones')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) console.error('Error:', error);
      else setDrones(data || []);
      setLoading(false);
    }
    fetchDrones();
  }, []);

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
