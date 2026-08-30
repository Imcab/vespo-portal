import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import { Layers, Check } from 'lucide-react';

export default function Areas() {
  const { adminMode } = useAuth();
  const [areas, setAreas] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAreaId, setOpenAreaId] = useState(null);
  const [assigning, setAssigning] = useState(null);

  async function fetchMembers() {
    const { data } = await supabase.from('miembros').select('*, miembro_areas(area_id)').order('nombre');
    setMembers(data || []);
  }

  useEffect(() => {
    async function loadAreas() {
      const { data, error } = await supabase.from('areas').select('*').order('nombre');
      if (error) console.error('Error:', error);
      else setAreas(data || []);
      setLoading(false);
    }
    loadAreas();
    supabase
      .from('miembros')
      .select('*, miembro_areas(area_id)')
      .order('nombre')
      .then(({ data }) => setMembers(data || []));
  }, []);

  async function toggleMember(memberId, areaId, isInArea) {
    setAssigning(memberId);
    const { error } = isInArea
      ? await supabase.from('miembro_areas').delete().eq('miembro_id', memberId).eq('area_id', areaId)
      : await supabase.from('miembro_areas').insert({ miembro_id: memberId, area_id: areaId });
    if (error) console.error('Error:', error);
    else await fetchMembers();
    setAssigning(null);
  }

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
          {areas.map((area, i) => {
            const isOpen = openAreaId === area.id;
            const memberCount = members.filter((m) =>
              (m.miembro_areas || []).some((row) => row.area_id === area.id),
            ).length;

            return (
              <Reveal key={area.id} delay={Math.min(i, 5) * 60} className="rounded-card bg-surface-soft p-5">
                <button
                  type="button"
                  disabled={!adminMode}
                  onClick={() => setOpenAreaId(isOpen ? null : area.id)}
                  className="flex w-full items-center gap-2 text-left disabled:cursor-default"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: area.color || '#6c450e' }}
                  />
                  <h3 className="text-[15px] font-semibold text-ink">{area.nombre}</h3>
                  <span className="ml-auto text-[12px] text-ink-secondary">{memberCount}</span>
                </button>
                {area.descripcion && (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{area.descripcion}</p>
                )}

                {adminMode && isOpen && (
                  <div className="mt-4 flex flex-col gap-1 border-t border-line-soft pt-3">
                    {members.map((member) => {
                      const isInArea = (member.miembro_areas || []).some((row) => row.area_id === area.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={assigning === member.id}
                          onClick={() => toggleMember(member.id, area.id, isInArea)}
                          className="flex items-center justify-between rounded-control px-2 py-1.5 text-left text-[13px] text-ink-secondary transition-colors duration-350 ease-emil hover:bg-white hover:text-ink disabled:opacity-60"
                        >
                          <span className="truncate">{member.nombre}</span>
                          {isInArea && <Check size={15} strokeWidth={2} className="shrink-0 text-brown-600" />}
                        </button>
                      );
                    })}
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
