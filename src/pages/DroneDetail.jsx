import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import ResourceIcon from '../components/ResourceIcon';
import Toggle from '../components/Toggle';
import { ArrowLeft, Drone, Package, Wrench, Download, Pencil, Plus, X, FileCog, GitFork, ExternalLink } from 'lucide-react';
import { droneDisplayName } from '../utils/drone';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyStlForm = { nombre: '', descripcion: '', archivoUrl: '' };
const emptyRepoForm = { nombre: '', url: '', descripcion: '' };

function RepoFields({ form, setForm }) {
  return (
    <>
      <input
        type="text"
        required
        placeholder="Project name"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className={inputClass}
      />
      <input
        type="url"
        required
        placeholder="GitHub URL (https://github.com/…)"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />
    </>
  );
}

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

function StlFields({ form, setForm }) {
  return (
    <>
      <input
        type="text"
        required
        placeholder="File name"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />
      <input
        type="url"
        required
        placeholder="File link (https://…)"
        value={form.archivoUrl}
        onChange={(e) => setForm({ ...form, archivoUrl: e.target.value })}
        className={inputClass}
      />
    </>
  );
}

export default function DroneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { adminMode } = useAuth();
  const [drone, setDrone] = useState(null);
  const [stlFiles, setStlFiles] = useState([]);
  const [resources, setResources] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editImagenUrl, setEditImagenUrl] = useState('');
  const [editSimulable, setEditSimulable] = useState(false);
  const [editEsReal, setEditEsReal] = useState(true);
  const [editSpecs, setEditSpecs] = useState([]);

  const [stlAddForm, setStlAddForm] = useState(emptyStlForm);
  const [editingStlId, setEditingStlId] = useState(null);
  const [stlEditForm, setStlEditForm] = useState(emptyStlForm);

  const [repoAddForm, setRepoAddForm] = useState(emptyRepoForm);
  const [editingRepoId, setEditingRepoId] = useState(null);
  const [repoEditForm, setRepoEditForm] = useState(emptyRepoForm);

  function startEdit() {
    setEditNombre(drone.nombre);
    setEditModelo(drone.modelo || '');
    setEditDescripcion(drone.descripcion || '');
    setEditImagenUrl(drone.imagen_url || '');
    setEditSimulable(drone.simulable);
    setEditEsReal(drone.es_real);
    setEditSpecs(Object.entries(drone.specs || {}).map(([key, value]) => ({ key, value: String(value) })));
    setEditing(true);
  }

  function updateSpecRow(index, field, value) {
    setEditSpecs((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeSpecRow(index) {
    setEditSpecs((rows) => rows.filter((_, i) => i !== index));
  }

  async function saveEdit() {
    const specs = {};
    editSpecs.forEach(({ key, value }) => {
      if (key.trim()) specs[key.trim()] = value;
    });

    const { data, error } = await supabase
      .from('drones')
      .update({
        nombre: editNombre.trim(),
        modelo: editModelo.trim() || null,
        descripcion: editDescripcion.trim() || null,
        imagen_url: editImagenUrl.trim() || null,
        simulable: editSimulable,
        es_real: editEsReal,
        specs: Object.keys(specs).length > 0 ? specs : null,
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

  async function fetchStlFiles() {
    const { data } = await supabase.from('stl_files').select('*').eq('dron_id', id).order('created_at');
    setStlFiles(data || []);
  }

  async function handleAddStl() {
    const { error } = await supabase.from('stl_files').insert({
      dron_id: id,
      nombre: stlAddForm.nombre.trim(),
      descripcion: stlAddForm.descripcion.trim() || null,
      archivo_url: stlAddForm.archivoUrl.trim(),
    });
    if (error) throw error;
    setStlAddForm(emptyStlForm);
    fetchStlFiles();
  }

  function startEditStl(stl) {
    setEditingStlId(stl.id);
    setStlEditForm({
      nombre: stl.nombre,
      descripcion: stl.descripcion || '',
      archivoUrl: stl.archivo_url,
    });
  }

  async function saveEditStl(stlId) {
    const { error } = await supabase
      .from('stl_files')
      .update({
        nombre: stlEditForm.nombre.trim(),
        descripcion: stlEditForm.descripcion.trim() || null,
        archivo_url: stlEditForm.archivoUrl.trim(),
      })
      .eq('id', stlId);
    if (error) throw error;
    setEditingStlId(null);
    fetchStlFiles();
  }

  async function deleteStl(stlId) {
    const { error } = await supabase.from('stl_files').delete().eq('id', stlId);
    if (error) throw error;
    setEditingStlId(null);
    fetchStlFiles();
  }

  async function fetchRepos() {
    const { data } = await supabase.from('dron_repos').select('*').eq('dron_id', id).order('created_at');
    setRepos(data || []);
  }

  async function handleAddRepo() {
    const { error } = await supabase.from('dron_repos').insert({
      dron_id: id,
      nombre: repoAddForm.nombre.trim(),
      url: repoAddForm.url.trim(),
      descripcion: repoAddForm.descripcion.trim() || null,
    });
    if (error) throw error;
    setRepoAddForm(emptyRepoForm);
    fetchRepos();
  }

  function startEditRepo(repo) {
    setEditingRepoId(repo.id);
    setRepoEditForm({
      nombre: repo.nombre,
      url: repo.url,
      descripcion: repo.descripcion || '',
    });
  }

  async function saveEditRepo(repoId) {
    const { error } = await supabase
      .from('dron_repos')
      .update({
        nombre: repoEditForm.nombre.trim(),
        url: repoEditForm.url.trim(),
        descripcion: repoEditForm.descripcion.trim() || null,
      })
      .eq('id', repoId);
    if (error) throw error;
    setEditingRepoId(null);
    fetchRepos();
  }

  async function deleteRepo(repoId) {
    const { error } = await supabase.from('dron_repos').delete().eq('id', repoId);
    if (error) throw error;
    setEditingRepoId(null);
    fetchRepos();
  }

  useEffect(() => {
    async function fetchData() {
      const { data: droneData } = await supabase.from('drones').select('*').eq('id', id).single();
      const { data: stls } = await supabase.from('stl_files').select('*').eq('dron_id', id).order('created_at');
      const { data: links } = await supabase
        .from('recurso_drones')
        .select('recursos(*)')
        .eq('dron_id', id);
      const { data: repoRows } = await supabase.from('dron_repos').select('*').eq('dron_id', id).order('created_at');

      setDrone(droneData);
      setStlFiles(stls || []);
      setResources((links || []).map((link) => link.recursos).filter(Boolean));
      setRepos(repoRows || []);
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
            <div>
              <h1 className="text-[36px] font-semibold leading-tight tracking-tight text-ink sm:text-[44px]">
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    drone.simulable
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-surface-soft text-ink-secondary'
                  }`}
                >
                  {drone.simulable ? 'Simulable' : 'Not simulable'}
                </span>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    drone.es_real
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {drone.es_real ? 'Real drone' : 'Simulation only'}
                </span>
              </div>
            </div>
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
          {drone.modelo && !editing && <p className="mt-1.5 text-[17px] text-ink-secondary">{drone.modelo}</p>}
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

                <Toggle checked={editSimulable} onChange={setEditSimulable} label="Available in simulation" />
                <Toggle checked={editEsReal} onChange={setEditEsReal} label="Physical drone (not simulation-only)" />

                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] text-ink-secondary">Specifications</span>
                  {editSpecs.map((row, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Key"
                        value={row.key}
                        onChange={(e) => updateSpecRow(i, 'key', e.target.value)}
                        className={`${inputClass} flex-1`}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => updateSpecRow(i, 'value', e.target.value)}
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecRow(i)}
                        className="shrink-0 rounded-control p-2 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Remove spec"
                      >
                        <X size={14} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditSpecs((rows) => [...rows, { key: '', value: '' }])}
                    className="inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-brown-600 hover:opacity-70"
                  >
                    <Plus size={13} strokeWidth={2} />
                    Add spec
                  </button>
                </div>
              </AdminEditForm>
            </div>
          )}

          {!editing && drone.specs && Object.keys(drone.specs).length > 0 && (
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
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">Configuration</h2>
        </div>

        {adminMode && (
          <AdminAddPanel label="Add file" onSubmit={handleAddStl} submitLabel="Add file">
            <StlFields form={stlAddForm} setForm={setStlAddForm} />
          </AdminAddPanel>
        )}

        {stlFiles.length === 0 ? (
          <p className="rounded-card bg-surface-soft px-6 py-10 text-center text-[14px] text-ink-secondary">
            No configuration files available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stlFiles.map((stl) => (
              <div key={stl.id} className="rounded-card bg-surface-soft p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brown-600">
                      <FileCog size={16} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="truncate text-[15px] font-semibold text-ink">{stl.nombre}</h4>
                      {stl.descripcion && (
                        <p className="mt-0.5 truncate text-[13px] text-ink-secondary">{stl.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={stl.archivo_url}
                      download
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-[13px] font-medium text-white transition-[background-color,transform] duration-350 ease-emil hover:bg-blue-700 active:scale-[0.97]"
                    >
                      <Download size={14} strokeWidth={2} />
                      Download
                    </a>
                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => startEditStl(stl)}
                        className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Edit STL file"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {editingStlId === stl.id && (
                  <AdminEditForm
                    onSubmit={() => saveEditStl(stl.id)}
                    onDelete={() => deleteStl(stl.id)}
                    onCancel={() => setEditingStlId(null)}
                  >
                    <StlFields form={stlEditForm} setForm={setStlEditForm} />
                  </AdminEditForm>
                )}
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
            No resources linked yet — add one from Tools and link it to this drone.
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
                <ResourceIcon resource={resource} />
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

      <Reveal as="section" className="mb-4 mt-16">
        <div className="mb-5 flex items-center gap-2">
          <GitFork size={19} strokeWidth={1.75} className="text-ink" />
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">Projects</h2>
        </div>

        {adminMode && (
          <AdminAddPanel label="Add project" onSubmit={handleAddRepo} submitLabel="Add project">
            <RepoFields form={repoAddForm} setForm={setRepoAddForm} />
          </AdminAddPanel>
        )}

        {repos.length === 0 ? (
          <p className="rounded-card bg-surface-soft px-6 py-10 text-center text-[14px] text-ink-secondary">
            No GitHub projects linked yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {repos.map((repo) => (
              <div key={repo.id} className="rounded-card bg-surface-soft p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-brand-100 text-brown-600">
                      <GitFork size={16} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="truncate text-[15px] font-semibold text-ink">{repo.nombre}</h4>
                      {repo.descripcion && (
                        <p className="mt-0.5 truncate text-[13px] text-ink-secondary">{repo.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white transition-[background-color,transform] duration-350 ease-emil hover:bg-ink/90 active:scale-[0.97]"
                    >
                      <ExternalLink size={14} strokeWidth={2} />
                      Open
                    </a>
                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => startEditRepo(repo)}
                        className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Edit project"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>

                {editingRepoId === repo.id && (
                  <AdminEditForm
                    onSubmit={() => saveEditRepo(repo.id)}
                    onDelete={() => deleteRepo(repo.id)}
                    onCancel={() => setEditingRepoId(null)}
                  >
                    <RepoFields form={repoEditForm} setForm={setRepoEditForm} />
                  </AdminEditForm>
                )}
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </div>
  );
}
