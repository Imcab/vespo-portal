import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import { resolveIcon, iconLibraryOf, useTablerReady } from '../utils/icons';
import { parseYoutubeId } from '../utils/youtube';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Link2,
  Pencil,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyLessonForm = {
  tipo: 'leccion',
  titulo: '',
  descripcion: '',
  videoUrl: '',
  contenido: '',
  enlaceExterno: '',
  enlaces: [],
  puntos: 10,
};

function LessonFields({ form, setForm }) {
  function updateLink(i, field, value) {
    setForm((f) => ({ ...f, enlaces: f.enlaces.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)) }));
  }
  function removeLink(i) {
    setForm((f) => ({ ...f, enlaces: f.enlaces.filter((_, idx) => idx !== i) }));
  }
  function addLink() {
    setForm((f) => ({ ...f, enlaces: [...f.enlaces, { label: '', url: '' }] }));
  }

  return (
    <>
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
        <option value="leccion">Lesson</option>
        <option value="quiz">Final quiz</option>
      </select>
      <input
        type="text"
        required
        placeholder="Title"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        className={inputClass}
      />
      <textarea
        placeholder="Short description (optional)"
        value={form.descripcion}
        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        rows={2}
        className={inputClass}
      />

      {form.tipo === 'leccion' ? (
        <>
          <input
            type="url"
            placeholder="Video URL (optional, YouTube embeds automatically)"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Reading material / instructions / exercise (optional)"
            value={form.contenido}
            onChange={(e) => setForm({ ...form, contenido: e.target.value })}
            rows={5}
            className={inputClass}
          />
        </>
      ) : (
        <input
          type="url"
          required
          placeholder="External quiz link (Google Forms, Kahoot…)"
          value={form.enlaceExterno}
          onChange={(e) => setForm({ ...form, enlaceExterno: e.target.value })}
          className={inputClass}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Links (YouTube, tools, articles…)</span>
        {form.enlaces.map((link, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Label"
              value={link.label}
              onChange={(e) => updateLink(i, 'label', e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <input
              type="url"
              placeholder="URL"
              value={link.url}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeLink(i)}
              className="shrink-0 rounded-control p-2 text-ink-secondary hover:bg-white hover:text-ink"
              aria-label="Remove link"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addLink}
          className="inline-flex w-fit items-center gap-1 text-[12.5px] font-medium text-brown-600 hover:opacity-70"
        >
          <Plus size={13} strokeWidth={2} />
          Add link
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Points</span>
        <input
          type="number"
          min={0}
          required
          value={form.puntos}
          onChange={(e) => setForm({ ...form, puntos: Number(e.target.value) })}
          className={inputClass}
        />
      </label>
    </>
  );
}

function CourseIcon({ icono, color, size = 36 }) {
  useTablerReady(iconLibraryOf(icono) === 'tabler');
  const Icon = resolveIcon(icono);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-control"
      style={{ width: size, height: size, backgroundColor: color || '#6c450e' }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon is a stable
          reference resolved from a static icon-name map, not created per render. */}
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.75} color="#ffffff" />
    </span>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const { adminMode, member, refreshMember } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [addForm, setAddForm] = useState(emptyLessonForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyLessonForm);
  const [completingId, setCompletingId] = useState(null);
  const [completeMessage, setCompleteMessage] = useState('');

  async function fetchLessons() {
    const { data, error } = await supabase.from('curso_lecciones').select('*').eq('curso_id', id).order('orden');
    if (error) console.error('Error:', error);
    setLessons(data || []);
  }

  async function fetchProgress() {
    if (!member) return;
    const { data } = await supabase
      .from('miembro_leccion_progreso')
      .select('leccion_id, curso_lecciones!inner(curso_id)')
      .eq('miembro_id', member.id)
      .eq('curso_lecciones.curso_id', id);
    setCompletedIds(new Set((data || []).map((row) => row.leccion_id)));
  }

  async function fetchEnrollment() {
    if (!member) {
      setEnrolled(false);
      return;
    }
    const { data } = await supabase
      .from('curso_inscripciones')
      .select('curso_id')
      .eq('curso_id', id)
      .eq('miembro_id', member.id)
      .maybeSingle();
    setEnrolled(!!data);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: courseData } = await supabase.from('cursos').select('*').eq('id', id).single();
      setCourse(courseData);
      await fetchLessons();
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    async function run() {
      await Promise.all([fetchEnrollment(), fetchProgress()]);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id, id]);

  async function enroll() {
    if (!member) return;
    setEnrolling(true);
    const { error } = await supabase.from('curso_inscripciones').insert({ curso_id: id, miembro_id: member.id });
    if (!error) setEnrolled(true);
    setEnrolling(false);
  }

  async function completeLesson(leccionId, puntos) {
    setCompletingId(leccionId);
    setCompleteMessage('');
    try {
      const { data, error } = await supabase.rpc('complete_leccion', { p_leccion_id: leccionId });
      if (error) throw error;
      if (data?.completed) {
        setCompletedIds((prev) => new Set(prev).add(leccionId));
        setCompleteMessage(`+${data.points ?? puntos} points!`);
        await refreshMember();
      } else {
        setCompletedIds((prev) => new Set(prev).add(leccionId));
        setCompleteMessage('Already marked as done.');
      }
    } catch (err) {
      setCompleteMessage(err.message);
    } finally {
      setCompletingId(null);
    }
  }

  async function createShadowLogro(titulo, puntos) {
    const { data, error } = await supabase
      .from('logros')
      .insert({
        nombre: `Course: ${titulo}`,
        puntos,
        icono: 'lucide:GraduationCap',
        color: '#6c450e',
        es_global: true,
        tipo: 'course',
      })
      .select()
      .single();
    if (error) throw error;
    return data.id;
  }

  function buildLessonPayload(form) {
    return {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo: form.tipo,
      video_url: form.tipo === 'leccion' ? form.videoUrl.trim() || null : null,
      contenido: form.tipo === 'leccion' ? form.contenido.trim() || null : null,
      enlace_externo: form.tipo === 'quiz' ? form.enlaceExterno.trim() : null,
      enlaces: form.enlaces.filter((l) => l.label.trim() && l.url.trim()),
      puntos: form.puntos,
    };
  }

  async function handleAddLesson() {
    const logroId = await createShadowLogro(addForm.titulo.trim(), addForm.puntos);
    const maxOrden = lessons.reduce((max, l) => Math.max(max, l.orden), -1);
    const { error } = await supabase.from('curso_lecciones').insert({
      curso_id: id,
      ...buildLessonPayload(addForm),
      logro_id: logroId,
      orden: maxOrden + 1,
    });
    if (error) throw error;
    setAddForm(emptyLessonForm);
    fetchLessons();
  }

  function startEditLesson(lesson) {
    setEditingId(lesson.id);
    setEditForm({
      tipo: lesson.tipo,
      titulo: lesson.titulo,
      descripcion: lesson.descripcion || '',
      videoUrl: lesson.video_url || '',
      contenido: lesson.contenido || '',
      enlaceExterno: lesson.enlace_externo || '',
      enlaces: lesson.enlaces || [],
      puntos: lesson.puntos,
    });
  }

  async function saveEditLesson(lesson) {
    const { error } = await supabase.from('curso_lecciones').update(buildLessonPayload(editForm)).eq('id', lesson.id);
    if (error) throw error;
    if (lesson.logro_id && editForm.puntos !== lesson.puntos) {
      await supabase
        .from('logros')
        .update({ puntos: editForm.puntos, nombre: `Course: ${editForm.titulo.trim()}` })
        .eq('id', lesson.logro_id);
    }
    setEditingId(null);
    fetchLessons();
  }

  async function deleteLesson(lesson) {
    const { error } = await supabase.from('curso_lecciones').delete().eq('id', lesson.id);
    if (error) throw error;
    setEditingId(null);
    fetchLessons();
  }

  async function moveLesson(lesson, direction) {
    const sorted = [...lessons].sort((a, b) => a.orden - b.orden);
    const idx = sorted.findIndex((l) => l.id === lesson.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      supabase.from('curso_lecciones').update({ orden: other.orden }).eq('id', lesson.id),
      supabase.from('curso_lecciones').update({ orden: lesson.orden }).eq('id', other.id),
    ]);
    fetchLessons();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="skeleton mb-8 h-4 w-40 animate-shimmer rounded-full" />
        <div className="skeleton h-28 w-full animate-shimmer rounded-card" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center sm:px-8">
        <p className="text-[17px] text-ink-secondary">Course not found.</p>
        <Link
          to="/learning-center"
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 hover:opacity-70"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to Learning Center
        </Link>
      </div>
    );
  }

  const sortedLessons = [...lessons].sort((a, b) => a.orden - b.orden);
  const completedCount = sortedLessons.filter((l) => completedIds.has(l.id)).length;
  const totalCount = sortedLessons.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const pointsEarned = sortedLessons
    .filter((l) => completedIds.has(l.id))
    .reduce((sum, l) => sum + l.puntos, 0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Link
        to="/learning-center"
        className="mb-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 transition-opacity duration-350 ease-emil hover:opacity-70"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to Learning Center
      </Link>

      <Reveal className="mb-10 flex flex-col gap-4 rounded-card bg-surface-soft p-6">
        <div className="flex items-start gap-3">
          <CourseIcon icono={course.icono} color={course.color} size={44} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight text-ink">{course.titulo}</h1>
            {course.descripcion && (
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-secondary">{course.descripcion}</p>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-ink-secondary">
              {completedCount}/{totalCount} completed · {pct}% · {pointsEarned} pts earned in this course
            </span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brown-600 transition-[width] duration-450 ease-emil"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {!enrolled && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={enroll}
              disabled={enrolling}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
            >
              {enrolling ? 'Enrolling…' : 'Enroll in this course'}
            </button>
            <span className="text-[12.5px] text-ink-secondary">Enroll to track progress and earn points.</span>
          </div>
        )}
      </Reveal>

      {adminMode && (
        <AdminAddPanel label="Add lesson" onSubmit={handleAddLesson} submitLabel="Add lesson">
          <LessonFields form={addForm} setForm={setAddForm} />
        </AdminAddPanel>
      )}

      {completeMessage && <p className="mb-4 text-[13px] font-medium text-brown-600">{completeMessage}</p>}

      {sortedLessons.length === 0 ? (
        <p className="rounded-card bg-surface-soft px-6 py-16 text-center text-[14px] text-ink-secondary">
          No lessons yet.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedLessons.map((lesson, i) => {
            const done = completedIds.has(lesson.id);
            const isQuiz = lesson.tipo === 'quiz';
            const youtubeId = lesson.video_url ? parseYoutubeId(lesson.video_url) : null;
            const enlaces = lesson.enlaces || [];

            return (
              <Reveal key={lesson.id} delay={Math.min(i, 6) * 50} className="relative flex gap-4">
                {i < sortedLessons.length - 1 && (
                  <span className="absolute left-[19px] top-11 h-[calc(100%-4px)] w-px bg-line" aria-hidden="true" />
                )}
                <span
                  className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                    done
                      ? 'bg-green-500 text-white'
                      : isQuiz
                        ? 'bg-brand-500 text-ink'
                        : 'bg-white text-ink-secondary ring-1 ring-inset ring-line'
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={2.5} /> : i + 1}
                </span>

                <div className="mb-2 flex-1 rounded-card bg-surface-soft p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15.5px] font-semibold text-ink">{lesson.titulo}</h3>
                        {isQuiz && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10.5px] font-medium text-brown-600">
                            Final evaluation
                          </span>
                        )}
                      </div>
                      {lesson.descripcion && (
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">{lesson.descripcion}</p>
                      )}
                    </div>
                    {adminMode && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveLesson(lesson, -1)}
                          disabled={i === 0}
                          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLesson(lesson, 1)}
                          disabled={i === sortedLessons.length - 1}
                          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown size={15} strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditLesson(lesson)}
                          className="rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                          aria-label="Edit lesson"
                        >
                          <Pencil size={15} strokeWidth={1.75} />
                        </button>
                      </div>
                    )}
                  </div>

                  {youtubeId && (
                    <div className="mt-3 aspect-video overflow-hidden rounded-control">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={lesson.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {!youtubeId && lesson.video_url && (
                    <a
                      href={lesson.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-brown-600 hover:opacity-70"
                    >
                      <ExternalLink size={13} strokeWidth={2} />
                      Watch video
                    </a>
                  )}

                  {lesson.contenido && (
                    <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-secondary">
                      {lesson.contenido}
                    </p>
                  )}

                  {enlaces.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {enlaces.map((link, li) => (
                        <a
                          key={li}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-1.5 rounded-control bg-white px-3 py-1.5 text-[12.5px] font-medium text-brown-600 hover:opacity-70"
                        >
                          <Link2 size={13} strokeWidth={2} />
                          {link.label || link.url}
                        </a>
                      ))}
                    </div>
                  )}

                  {isQuiz && lesson.enlace_externo && (
                    <a
                      href={lesson.enlace_externo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-white transition-[background-color] duration-350 ease-emil hover:bg-ink/90"
                    >
                      <ExternalLink size={14} strokeWidth={2} />
                      Take the quiz
                    </a>
                  )}

                  <div className="mt-4 flex items-center gap-3 border-t border-line-soft pt-3">
                    {enrolled ? (
                      <button
                        type="button"
                        onClick={() => completeLesson(lesson.id, lesson.puntos)}
                        disabled={done || completingId === lesson.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-[12.5px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98] disabled:opacity-60"
                      >
                        {done
                          ? 'Completed'
                          : completingId === lesson.id
                            ? 'Saving…'
                            : `Mark as done (+${lesson.puntos} pts)`}
                      </button>
                    ) : (
                      <p className="text-[12px] text-ink-tertiary">Enroll to mark this as done.</p>
                    )}
                  </div>

                  {adminMode && editingId === lesson.id && (
                    <AdminEditForm
                      onSubmit={() => saveEditLesson(lesson)}
                      onDelete={() => deleteLesson(lesson)}
                      onCancel={() => setEditingId(null)}
                    >
                      <LessonFields form={editForm} setForm={setEditForm} />
                    </AdminEditForm>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
