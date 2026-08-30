import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Reveal from '../components/Reveal';
import { Users } from 'lucide-react';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase
        .from('miembros')
        .select('*, miembro_areas(areas(nombre, color))')
        .eq('activo', true)
        .order('nombre');

      if (error) console.error('Error:', error);
      else setMembers(data || []);
      setLoading(false);
    }
    fetchMembers();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Members</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-card bg-surface-soft p-5">
              <div className="skeleton h-12 w-12 shrink-0 animate-shimmer rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="skeleton h-3.5 w-2/3 animate-shimmer rounded-full" />
                <div className="skeleton h-3 w-1/2 animate-shimmer rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <Users size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No members registered yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <Reveal
              key={member.id}
              delay={Math.min(i, 5) * 60}
              className="flex items-center gap-3 rounded-card bg-surface-soft p-5"
            >
              {member.foto_url ? (
                <img
                  src={member.foto_url}
                  alt={member.nombre}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[14px] font-semibold text-brown-600">
                  {initials(member.nombre)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-semibold text-ink">{member.nombre}</h3>
                {member.rol && <p className="truncate text-[13px] text-ink-secondary">{member.rol}</p>}
              </div>
              {member.miembro_areas?.length > 0 && (
                <div className="flex shrink-0 items-center gap-1">
                  {member.miembro_areas.map(({ areas: area }, idx) =>
                    area ? (
                      <span
                        key={idx}
                        title={area.nombre}
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: area.color || '#6c450e' }}
                      />
                    ) : null,
                  )}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
