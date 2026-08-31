import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { getWeekStart } from '../utils/week';
import { compressImage, ACCEPTED_IMAGE_TYPES } from '../utils/image';
import { Camera, Pencil } from 'lucide-react';

const PROFILE_FIELDS = [
  { key: 'foto_url', label: 'Profile photo' },
  { key: 'fecha_nacimiento', label: 'Birth date' },
  { key: 'universidad', label: 'University' },
  { key: 'carrera', label: 'Major / Career' },
  { key: 'semestre', label: 'Semester' },
  { key: 'acerca_de', label: 'About me' },
  { key: 'pasatiempos', label: 'Hobbies and interests' },
  { key: 'dato_curioso', label: 'Fun fact' },
  { key: 'cultura_musica', label: 'What I listen to' },
  { key: 'cultura_libro', label: 'A book that marked me' },
  { key: 'cultura_idea', label: 'An idea that motivates me' },
  { key: 'cultura_frase', label: 'A phrase that moves me' },
  { key: 'personalidad', label: 'Personality' },
];

const PERSONALITY_OPTIONS = [
  'Detail-oriented',
  'Big-picture thinker',
  'Team player',
  'Independent worker',
  'Creative',
  'Analytical',
  'Fast learner',
  'Perfectionist',
];

const SEMESTER_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';
const labelClass = 'flex flex-col gap-1.5';
const smallLabelClass = 'text-[13px] font-medium text-ink-secondary';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function SectionHeader({ title, onEdit }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-ink-secondary">{title}</h2>
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-ink-secondary hover:text-ink" aria-label={`Edit ${title}`}>
          <Pencil size={13} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, member, refreshMember } = useAuth();
  const fileInputRef = useRef(null);

  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const [areas, setAreas] = useState([]);

  const [editingIdentity, setEditingIdentity] = useState(false);
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');

  const [editingAbout, setEditingAbout] = useState(false);
  const [acercaDe, setAcercaDe] = useState('');
  const [pasatiempos, setPasatiempos] = useState('');
  const [datoCurioso, setDatoCurioso] = useState('');

  const [editingCulture, setEditingCulture] = useState(false);
  const [culturaMusica, setCulturaMusica] = useState('');
  const [culturaLibro, setCulturaLibro] = useState('');
  const [culturaIdea, setCulturaIdea] = useState('');
  const [culturaFrase, setCulturaFrase] = useState('');
  const [personalidad, setPersonalidad] = useState('');

  const [avanzando, setAvanzando] = useState('');
  const [fallando, setFallando] = useState('');
  const [aprendiendo, setAprendiendo] = useState('');
  const [existingWeek, setExistingWeek] = useState(null);
  const [weekSaving, setWeekSaving] = useState(false);
  const [weekMessage, setWeekMessage] = useState('');

  function startEditIdentity() {
    setNombre(member.nombre || '');
    setFechaNacimiento(member.fecha_nacimiento || '');
    setUniversidad(member.universidad || '');
    setCarrera(member.carrera || '');
    setSemestre(member.semestre || '');
    setEditingIdentity(true);
  }

  function startEditAbout() {
    setAcercaDe(member.acerca_de || '');
    setPasatiempos(member.pasatiempos || '');
    setDatoCurioso(member.dato_curioso || '');
    setEditingAbout(true);
  }

  function startEditCulture() {
    setCulturaMusica(member.cultura_musica || '');
    setCulturaLibro(member.cultura_libro || '');
    setCulturaIdea(member.cultura_idea || '');
    setCulturaFrase(member.cultura_frase || '');
    setPersonalidad(member.personalidad || '');
    setEditingCulture(true);
  }

  useEffect(() => {
    supabase
      .from('areas')
      .select('*')
      .order('nombre')
      .then(({ data }) => setAreas(data || []));
  }, []);

  useEffect(() => {
    if (!member) return;
    const weekStart = getWeekStart();
    supabase
      .from('actualizaciones_semanales')
      .select('*')
      .eq('miembro_id', member.id)
      .eq('semana_inicio', weekStart)
      .maybeSingle()
      .then(({ data }) => {
        setExistingWeek(data || null);
        setAvanzando(data?.avanzando || '');
        setFallando(data?.fallando || '');
        setAprendiendo(data?.aprendiendo || '');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  async function updateMember(payload, onDone) {
    const { error } = await supabase.from('miembros').update(payload).eq('user_id', user.id);
    if (error) {
      setMessage(error.message);
      return false;
    }
    await refreshMember();
    onDone?.();
    return true;
  }

  async function handleSaveIdentity(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    await updateMember(
      {
        nombre: nombre.trim(),
        fecha_nacimiento: fechaNacimiento || null,
        universidad: universidad.trim() || null,
        carrera: carrera.trim() || null,
        semestre: semestre || null,
      },
      () => setEditingIdentity(false),
    );
    setSaving(false);
  }

  async function handleSaveAbout(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    await updateMember(
      {
        acerca_de: acercaDe.trim() || null,
        pasatiempos: pasatiempos.trim() || null,
        dato_curioso: datoCurioso.trim() || null,
      },
      () => setEditingAbout(false),
    );
    setSaving(false);
  }

  async function handleSaveCulture(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    await updateMember(
      {
        cultura_musica: culturaMusica.trim() || null,
        cultura_libro: culturaLibro.trim() || null,
        cultura_idea: culturaIdea.trim() || null,
        cultura_frase: culturaFrase.trim() || null,
        personalidad: personalidad || null,
      },
      () => setEditingCulture(false),
    );
    setSaving(false);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setMessage('Only PNG or JPG images are allowed.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const compressed = await compressImage(file);
      const path = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const fotoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error } = await supabase.from('miembros').update({ foto_url: fotoUrl }).eq('user_id', user.id);
      if (error) throw error;
      await refreshMember();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveWeek(e) {
    e.preventDefault();
    setWeekSaving(true);
    setWeekMessage('');

    const weekStart = getWeekStart();
    const payload = {
      avanzando: avanzando.trim() || null,
      fallando: fallando.trim() || null,
      aprendiendo: aprendiendo.trim() || null,
    };

    try {
      if (existingWeek) {
        const { data, error } = await supabase
          .from('actualizaciones_semanales')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existingWeek.id)
          .select()
          .single();
        if (error) throw error;
        setExistingWeek(data);
      } else {
        const { data, error } = await supabase
          .from('actualizaciones_semanales')
          .insert({ miembro_id: member.id, semana_inicio: weekStart, ...payload })
          .select()
          .single();
        if (error) throw error;
        setExistingWeek(data);
      }
      // A DB trigger auto-awards the "Weekly update" achievement the first time
      // all three fields are complete for this week — refresh to reflect any point change.
      await refreshMember();
      setWeekMessage('Saved.');
    } catch (err) {
      setWeekMessage(err.message);
    } finally {
      setWeekSaving(false);
    }
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="skeleton h-8 w-1/2 animate-shimmer rounded-full" />
      </div>
    );
  }

  const myAreas = (member.miembro_areas || [])
    .map((row) => areas.find((a) => a.id === row.area_id))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative h-20 w-20 shrink-0 rounded-full disabled:opacity-60"
          >
            {member?.foto_url ? (
              <img src={member.foto_url} alt={member.nombre} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-[20px] font-semibold text-brown-600">
                {initials(member.nombre)}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40 opacity-0 transition-opacity duration-350 ease-emil group-hover:opacity-100">
              <Camera size={20} strokeWidth={1.75} className="text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">{member.nombre}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {member.rol && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-medium text-brown-600">
                  {member.rol}
                </span>
              )}
              {myAreas.map((area) => (
                <span
                  key={area.id}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white"
                  style={{ backgroundColor: area.color || '#6c450e' }}
                >
                  {area.nombre}
                </span>
              ))}
              {member.personalidad && (
                <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary">
                  {member.personalidad}
                </span>
              )}
            </div>
            {(member.universidad || member.carrera || member.semestre) && (
              <p className="mt-1.5 text-[13px] text-ink-secondary">
                {[member.universidad, member.carrera, member.semestre && `${member.semestre} semester`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
          <span className="text-[26px] font-semibold leading-none text-ink">{member.puntaje ?? 0}</span>
          <span className="text-[11px] uppercase tracking-wide text-ink-secondary">points</span>
          <button
            type="button"
            onClick={editingIdentity ? () => setEditingIdentity(false) : startEditIdentity}
            className="mt-2 text-[12.5px] font-medium text-brown-600 hover:opacity-70"
          >
            Edit profile
          </button>
        </div>
      </div>

      {(() => {
        const missing = PROFILE_FIELDS.filter((f) => {
          const value = member[f.key];
          return value === null || value === undefined || value === '';
        });
        const completedCount = PROFILE_FIELDS.length - missing.length;
        const pct = Math.round((completedCount / PROFILE_FIELDS.length) * 100);
        if (missing.length === 0) return null;

        return (
          <div className="mb-10 rounded-card bg-surface-soft p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">Complete your profile</span>
              <span className="text-[12px] text-ink-secondary">
                {completedCount}/{PROFILE_FIELDS.length} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brown-600 transition-[width] duration-450 ease-emil"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2.5 text-[12px] text-ink-secondary">
              Still missing: {missing.map((f) => f.label).join(', ')}. Complete every field to unlock the{' '}
              <span className="font-medium text-ink">Profile complete</span> achievement.
            </p>
          </div>
        );
      })()}

      {editingIdentity && (
        <form onSubmit={handleSaveIdentity} className="mb-10 flex flex-col gap-3 rounded-card bg-surface-soft p-5">
          <label className={labelClass}>
            <span className={smallLabelClass}>Name</span>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={smallLabelClass}>Email</span>
            <input type="email" disabled value={user.email} className={`${inputClass} bg-surface-soft text-ink-secondary`} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={smallLabelClass}>Birth date</span>
              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span className={smallLabelClass}>University</span>
              <input type="text" value={universidad} onChange={(e) => setUniversidad(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={smallLabelClass}>Major / Career</span>
              <input type="text" value={carrera} onChange={(e) => setCarrera(e.target.value)} className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={smallLabelClass}>Semester</span>
              <select value={semestre} onChange={(e) => setSemestre(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {message && <p className="text-[13px] text-ink-secondary">{message}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditingIdentity(false)} className="text-[13px] font-medium text-ink-secondary hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <section>
          <SectionHeader title="About me" onEdit={editingAbout ? () => setEditingAbout(false) : startEditAbout} />
          {editingAbout ? (
            <form onSubmit={handleSaveAbout} className="flex flex-col gap-3">
              <label className={labelClass}>
                <span className={smallLabelClass}>About me</span>
                <textarea
                  placeholder="Tell your team about yourself…"
                  value={acercaDe}
                  onChange={(e) => setAcercaDe(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>Hobbies and interests</span>
                <input
                  type="text"
                  placeholder="Reading, robotics, music…"
                  value={pasatiempos}
                  onChange={(e) => setPasatiempos(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>Fun fact</span>
                <input
                  type="text"
                  placeholder="Share something surprising about you…"
                  value={datoCurioso}
                  onChange={(e) => setDatoCurioso(e.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingAbout(false)} className="text-[12.5px] font-medium text-ink-secondary hover:text-ink">
                  Cancel
                </button>
              </div>
            </form>
          ) : member.acerca_de || member.pasatiempos || member.dato_curioso ? (
            <div className="flex flex-col gap-2.5 text-[13.5px] text-ink-secondary">
              {member.acerca_de && <p className="leading-relaxed text-ink">{member.acerca_de}</p>}
              {member.pasatiempos && (
                <p>
                  <span className="font-medium text-ink-secondary">Hobbies: </span>
                  {member.pasatiempos}
                </p>
              )}
              {member.dato_curioso && (
                <p>
                  <span className="font-medium text-ink-secondary">Fun fact: </span>
                  {member.dato_curioso}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[13.5px] italic text-ink-tertiary">No information yet.</p>
          )}
        </section>

        <section>
          <SectionHeader title="Culture" onEdit={editingCulture ? () => setEditingCulture(false) : startEditCulture} />
          {editingCulture ? (
            <form onSubmit={handleSaveCulture} className="flex flex-col gap-3">
              <label className={labelClass}>
                <span className={smallLabelClass}>What I listen to</span>
                <input type="text" value={culturaMusica} onChange={(e) => setCulturaMusica(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>A book that marked me</span>
                <input type="text" value={culturaLibro} onChange={(e) => setCulturaLibro(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>An idea that motivates me</span>
                <input type="text" value={culturaIdea} onChange={(e) => setCulturaIdea(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>A phrase that moves me</span>
                <input type="text" value={culturaFrase} onChange={(e) => setCulturaFrase(e.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={smallLabelClass}>I am…</span>
                <select value={personalidad} onChange={(e) => setPersonalidad(e.target.value)} className={inputClass}>
                  <option value="">Select…</option>
                  {PERSONALITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-1.5 text-[12.5px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditingCulture(false)} className="text-[12.5px] font-medium text-ink-secondary hover:text-ink">
                  Cancel
                </button>
              </div>
            </form>
          ) : member.cultura_musica || member.cultura_libro || member.cultura_idea || member.cultura_frase ? (
            <div className="flex flex-col gap-2 text-[13.5px] text-ink-secondary">
              {member.cultura_musica && (
                <p>
                  <span className="font-medium text-ink-secondary">Listening to: </span>
                  {member.cultura_musica}
                </p>
              )}
              {member.cultura_libro && (
                <p>
                  <span className="font-medium text-ink-secondary">Book: </span>
                  {member.cultura_libro}
                </p>
              )}
              {member.cultura_idea && (
                <p>
                  <span className="font-medium text-ink-secondary">Idea: </span>
                  {member.cultura_idea}
                </p>
              )}
              {member.cultura_frase && <p className="italic">"{member.cultura_frase}"</p>}
            </div>
          ) : (
            <p className="text-[13.5px] italic text-ink-tertiary">No information yet.</p>
          )}
        </section>
      </div>

      <section className="mt-10">
        <SectionHeader title="This week" />
        <form onSubmit={handleSaveWeek} className="flex flex-col gap-3 rounded-card bg-surface-soft p-5">
          <label className={labelClass}>
            <span className={smallLabelClass}>What I'm advancing on…</span>
            <input
              type="text"
              placeholder="What are you advancing on?"
              value={avanzando}
              onChange={(e) => setAvanzando(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={smallLabelClass}>What I'm struggling with…</span>
            <input
              type="text"
              placeholder="What are you struggling with?"
              value={fallando}
              onChange={(e) => setFallando(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            <span className={smallLabelClass}>What I'm learning…</span>
            <input
              type="text"
              placeholder="What are you learning?"
              value={aprendiendo}
              onChange={(e) => setAprendiendo(e.target.value)}
              className={inputClass}
            />
          </label>
          <div className="flex items-center justify-between">
            {weekMessage && <p className="text-[13px] text-ink-secondary">{weekMessage}</p>}
            <button
              type="submit"
              disabled={weekSaving}
              className="ml-auto inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-350 ease-emil hover:bg-brand-600 disabled:opacity-60"
            >
              {weekSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
