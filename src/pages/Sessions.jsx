import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import { CalendarClock } from 'lucide-react';

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

export default function Sessions() {
  const { adminMode } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [areaId, setAreaId] = useState('');

  useEffect(() => {
    async function loadSessions() {
      const { data, error } = await supabase
        .from('sesiones')
        .select('*, areas(nombre)')
        .order('fecha', { ascending: false });
      if (error) console.error('Error:', error);
      else setSessions(data || []);
      setLoading(false);
    }
    loadSessions();
    supabase
      .from('areas')
      .select('*')
      .order('nombre')
      .then(({ data }) => setAreas(data || []));
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('sesiones').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
      area_id: areaId || null,
    });
    if (error) throw error;
    setTitulo('');
    setDescripcion('');
    setFecha('');
    setAreaId('');

    const { data } = await supabase.from('sesiones').select('*, areas(nombre)').order('fecha', { ascending: false });
    setSessions(data || []);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Sessions</h1>

      {adminMode && (
        <AdminAddPanel label="Add session" onSubmit={handleAdd} submitLabel="Add session">
          <input
            type="text"
            required
            placeholder="Title"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
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
            type="datetime-local"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className={inputClass}>
            <option value="">No area</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-card bg-surface-soft p-5">
              <div className="skeleton h-4 w-1/3 animate-shimmer rounded-full" />
              <div className="skeleton mt-3 h-3 w-2/3 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <CalendarClock size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No sessions logged yet.</p>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session, i) => (
            <Reveal key={session.id} delay={Math.min(i, 5) * 60} className="rounded-card bg-surface-soft p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-ink">{session.titulo}</h3>
                {session.areas?.nombre && (
                  <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-medium text-brown-600">
                    {session.areas.nombre}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-ink-secondary">{dateFormatter.format(new Date(session.fecha))}</p>
              {session.descripcion && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{session.descripcion}</p>
              )}
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
