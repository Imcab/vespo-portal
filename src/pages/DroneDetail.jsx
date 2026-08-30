import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminEditForm from '../components/AdminEditForm';
import { ArrowLeft, Drone, Package, Wrench, Link2, Download, Pencil } from 'lucide-react';
import { droneDisplayName } from '../utils/drone';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="skeleton mb-8 h-4 w-40 animate-shimmer rounded-full" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="skeleton aspect-[4/3] animate-shimmer rounded-card" />
        <div className="flex flex-col gap-3">
          <div className="skeleton h-10 w-2/3 animate-shimmer rounded-full" />
          <div className="skeleton h-4 w-1/3 animate-shimmer rounded-full" />
          <div className="skeleton mt-4 h-24 w-full animate-shimmer rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function DroneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminMode } = useAuth();
  const [drone, setDrone] = useState(null);
  const [stlFiles, setStlFiles] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');

  function startEdit() {
    setEditNombre(drone.nombre);
    setEditModelo(drone.modelo || '');
    setEditDescripcion(drone.descripcion || '');
    setEditImagenUrl(drone.imagen_url || '');
    setEditing(true);
  }

  async function saveEdit() {
    const { data, error } = await supabase
      .from('drones')
      .update({
        nombre: editNombre.trim(),
        modelo: editModelo.trim() || null,
        descripcion: editDescripcion.trim() || null,
        imagen_url: editImagenUrl.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setDrone(data);
    setEditing(false);
  }

  async function deleteDrone() {
    const { error } = await supabase.from('drones').delete().eq('id', id);
    if (error) throw error;
    navigate('/');
  }

  useEffect(() => {
    async function fetchData() {
      const { data: droneData } = await supabase
        .from('drones').select('*').eq('id', id).single();

      const { data: stls } = await supabase
        .from('stl_files').select('*').eq('dron_id', id);

      const { data: recursos } = await supabase
        .from('recursos').select('*').eq('dron_id', id).eq('activo', true);

      setDrone(droneData);
      setStlFiles(stls || []);
      setResources(recursos || []);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!drone) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
        <p className="text-[17px] text-ink-secondary">Drone not found.</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 transition-opacity duration-350 ease-emil hover:opacity-70"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to fleet
        </Link>
      </div>
    );
  }

  const name = droneDisplayName(drone.nombre);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 transition-opacity duration-350 ease-emil hover:opacity-70"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to fleet
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-card bg-surface-soft">
          {drone.imagen_url ? (
            <img src={drone.imagen_url} alt={name} className="h-full w-full object-cover" />
          ) : (
            <Drone size={80} strokeWidth={1.1} className="text-ink-tertiary" />
          )}
        </Reveal>

        <Reveal delay={100} className="flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[36px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
              {name}
            </h1>
            {adminMode && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="mt-2 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-ink-secondary ring-1 ring-inset ring-line hover:text-ink"
              >
                <Pencil size={13} strokeWidth={1.75} />
                Edit
              </button>
            )}
          </div>
          {drone.modelo && !editing && (
            <p className="mt-1.5 text-[17px] text-ink-secondary">{drone.modelo}</p>
          )}
          {drone.descripcion && !editing && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink-secondary">{drone.descripcion}</p>
          )}

          {editing && (
            <div className="mt-4 rounded-card bg-surface-soft p-5">
              <AdminEditForm onSubmit={saveEdit} onDelete={deleteDrone} onCancel={() => setEditing(false)}>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Model (optional)"
                  value={editModelo}
                  onChange={(e) => setEditModelo(e.target.value)}
                  className={inputClass}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  value={editImagenUrl}
                  onChange={(e) => setEditImagenUrl(e.target.value)}
                  className={inputClass}
                />
              </AdminEditForm>
            </div>
          )}

          {drone.specs && Object.keys(drone.specs).length > 0 && (
            <div className="mt-8 rounded-card bg-surface-soft p-6">
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-secondary">
                Specifications
              </h3>
              <dl className="divide-y divide-line-soft">
                {Object.entries(drone.specs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 text-[14px] first:pt-0 last:pb-0">
                    <dt className="capitalize text-ink-secondary">{key}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Reveal>
      </div>

      <Reveal as="section" className="mt-16">
        <div className="mb-5 flex items-center gap-2">
          <Package size={19} strokeWidth={1.75} className="text-ink" />
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">STL Files</h2>
        </div>

        {stlFiles.length === 0 ? (
          <p className="rounded-card bg-surface-soft px-6 py-10 text-center text-[14px] text-ink-secondary">
            No STL files available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stlFiles.map((stl) => (
              <div
                key={stl.id}
                className="flex items-center justify-between gap-4 rounded-card bg-surface-soft p-5"
              >
                <div className="min-w-0">
                  <h4 className="truncate text-[15px] font-semibold text-ink">{stl.nombre}</h4>
                  {stl.descripcion && (
                    <p className="mt-0.5 truncate text-[13px] text-ink-secondary">{stl.descripcion}</p>
                  )}
                  {stl.tamano_kb && (
                    <p className="mt-1 text-[12px] text-ink-secondary">{stl.tamano_kb} KB</p>
                  )}
                </div>
                <a
                  href={stl.archivo_url}
                  download
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.97]"
                >
                  <Download size={14} strokeWidth={2} />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      <Reveal as="section" className="mb-4 mt-16">
        <div className="mb-5 flex items-center gap-2">
          <Wrench size={19} strokeWidth={1.75} className="text-ink" />
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">Resources</h2>
        </div>

        {resources.length === 0 ? (
          <p className="rounded-card bg-surface-soft px-6 py-10 text-center text-[14px] text-ink-secondary">
            No resources available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-card bg-surface-soft p-5 transition-[transform,box-shadow] duration-450 ease-emil hover:-translate-y-0.5 hover:shadow-soft-lg"
              >
                {resource.icono_url ? (
                  <img
                    src={resource.icono_url}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-control object-contain"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brown-600">
                    <Link2 size={16} strokeWidth={1.75} />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-ink">{resource.titulo}</h4>
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
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
