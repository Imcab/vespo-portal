import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import { Wrench, Link2 } from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

export default function Tools() {
  const { adminMode } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    async function loadResources() {
      const { data, error } = await supabase
        .from('recursos')
        .select('*')
        .is('dron_id', null)
        .eq('activo', true)
        .order('created_at', { ascending: false });
      if (error) console.error('Error:', error);
      else setResources(data || []);
      setLoading(false);
    }
    loadResources();
  }, []);

  async function handleAdd() {
    const { error } = await supabase.from('recursos').insert({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      url: url.trim(),
      categoria: categoria.trim() || null,
      dron_id: null,
    });
    if (error) throw error;
    setTitulo('');
    setDescripcion('');
    setUrl('');
    setCategoria('');

    const { data } = await supabase
      .from('recursos')
      .select('*')
      .is('dron_id', null)
      .eq('activo', true)
      .order('created_at', { ascending: false });
    setResources(data || []);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-10 text-[22px] font-semibold tracking-tight text-ink">Tools</h1>

      {adminMode && (
        <AdminAddPanel label="Add tool" onSubmit={handleAdd} submitLabel="Add tool">
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
            type="url"
            required
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          />
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
          {resources.map((resource, i) => (
            <Reveal key={resource.id} delay={Math.min(i, 5) * 60}>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full items-start gap-3 rounded-card bg-surface-soft p-5 transition-[transform,box-shadow] duration-450 ease-emil hover:-translate-y-0.5 hover:shadow-soft-lg"
              >
                {resource.icono_url ? (
                  <img src={resource.icono_url} alt="" className="h-8 w-8 shrink-0 rounded-control object-contain" />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brown-600">
                    <Link2 size={16} strokeWidth={1.75} />
                  </span>
                )}
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
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
