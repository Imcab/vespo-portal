import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import Reveal from '../components/Reveal';
import AdminAddPanel from '../components/AdminAddPanel';
import AdminEditForm from '../components/AdminEditForm';
import Toggle from '../components/Toggle';
import IconPicker from '../components/IconPicker';
import ColorSwatchPicker from '../components/ColorSwatchPicker';
import { resolveIcon, iconLibraryOf, useTablerReady } from '../utils/icons';
import { GraduationCap, ArrowRight, Pencil } from 'lucide-react';

const inputClass =
  'rounded-control border border-line bg-white px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors duration-350 ease-emil focus:border-brown-600';

const emptyCourseForm = {
  titulo: '',
  descripcion: '',
  portadaUrl: '',
  color: '#6c450e',
  icono: 'lucide:GraduationCap',
  publicado: false,
};

function CourseFields({ form, setForm }) {
  return (
    <>
      <input
        type="text"
        required
        placeholder="Title"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
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
        placeholder="Cover image URL (optional)"
        value={form.portadaUrl}
        onChange={(e) => setForm({ ...form, portadaUrl: e.target.value })}
        className={inputClass}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Icon</span>
        <IconPicker value={form.icono} onChange={(icono) => setForm({ ...form, icono })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] text-ink-secondary">Color</span>
        <ColorSwatchPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
      </div>
      <Toggle
        checked={form.publicado}
        onChange={(publicado) => setForm({ ...form, publicado })}
        label="Published (visible to members)"
      />
    </>
  );
}

function CourseIcon({ icono, color, size = 40 }) {
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

export default function LearningCenter() {
  const { adminMode, member } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState(emptyCourseForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyCourseForm);

  async function fetchCourses() {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, curso_lecciones(count)')
      .order('orden')
      .order('created_at');
    if (error) console.error('Error:', error);
    setCourses(data || []);
  }

  async function fetchEnrollments() {
    if (!member) return;
    const { data } = await supabase.from('curso_inscripciones').select('curso_id').eq('miembro_id', member.id);
    setEnrolledIds(new Set((data || []).map((row) => row.curso_id)));
  }

  useEffect(() => {
    async function load() {
      await fetchCourses();
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function run() {
      await fetchEnrollments();
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  function buildCoursePayload(form) {
    return {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      portada_url: form.portadaUrl.trim() || null,
      color: form.color,
      icono: form.icono,
      publicado: form.publicado,
    };
  }

  async function handleAdd() {
    const { error } = await supabase.from('cursos').insert({
      ...buildCoursePayload(addForm),
      created_by: member?.id || null,
    });
    if (error) throw error;
    setAddForm(emptyCourseForm);
    fetchCourses();
  }

  function startEdit(course) {
    setEditingId(course.id);
    setEditForm({
      titulo: course.titulo,
      descripcion: course.descripcion || '',
      portadaUrl: course.portada_url || '',
      color: course.color,
      icono: course.icono,
      publicado: course.publicado,
    });
  }

  async function saveEdit(courseId) {
    const { error } = await supabase.from('cursos').update(buildCoursePayload(editForm)).eq('id', courseId);
    if (error) throw error;
    setEditingId(null);
    fetchCourses();
  }

  async function deleteCourse(courseId) {
    const { error } = await supabase.from('cursos').delete().eq('id', courseId);
    if (error) throw error;
    setEditingId(null);
    fetchCourses();
  }

  async function enroll(curso) {
    if (!member) return;
    const { error } = await supabase.from('curso_inscripciones').insert({ curso_id: curso.id, miembro_id: member.id });
    if (error) {
      console.error('Error:', error);
      return;
    }
    setEnrolledIds((prev) => new Set(prev).add(curso.id));
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="mb-8 text-[22px] font-semibold tracking-tight text-ink">Learning Center</h1>

      {adminMode && (
        <AdminAddPanel label="New course" onSubmit={handleAdd} submitLabel="Create course">
          <CourseFields form={addForm} setForm={setAddForm} />
        </AdminAddPanel>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 w-full animate-shimmer rounded-card" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Reveal
          as="div"
          className="flex flex-col items-center gap-3 rounded-card bg-surface-soft px-6 py-24 text-center"
        >
          <GraduationCap size={40} strokeWidth={1.25} className="text-ink-tertiary" />
          <p className="text-[15px] text-ink-secondary">No courses available yet.</p>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => {
            const lessonCount = course.curso_lecciones?.[0]?.count ?? 0;
            const enrolled = enrolledIds.has(course.id);
            return (
              <Reveal
                key={course.id}
                delay={Math.min(i, 6) * 60}
                className="flex flex-col overflow-hidden rounded-card bg-surface-soft shadow-soft-xs"
              >
                <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-white">
                  {course.portada_url ? (
                    <img src={course.portada_url} alt={course.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <CourseIcon icono={course.icono} color={course.color} size={56} />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 px-5 py-5">
                  <div className="flex items-center gap-2">
                    <CourseIcon icono={course.icono} color={course.color} size={28} />
                    <h3 className="min-w-0 flex-1 truncate text-[16px] font-semibold text-ink">{course.titulo}</h3>
                    {!course.publicado && (
                      <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[10.5px] font-medium text-ink-secondary ring-1 ring-inset ring-line">
                        Draft
                      </span>
                    )}
                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => startEdit(course)}
                        className="shrink-0 rounded-control p-1.5 text-ink-secondary hover:bg-white hover:text-ink"
                        aria-label="Edit course"
                        title="Edit course"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  {course.descripcion && (
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-secondary">{course.descripcion}</p>
                  )}
                  <p className="text-[11.5px] text-ink-tertiary">
                    {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                  </p>

                  {editingId === course.id ? (
                    <AdminEditForm
                      onSubmit={() => saveEdit(course.id)}
                      onDelete={() => deleteCourse(course.id)}
                      onCancel={() => setEditingId(null)}
                    >
                      <CourseFields form={editForm} setForm={setEditForm} />
                    </AdminEditForm>
                  ) : (
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      {enrolled ? (
                        <Link
                          to={`/learning-center/${course.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brown-600 px-4 py-2 text-[13px] font-medium text-white transition-[background-color,transform] duration-350 ease-emil hover:bg-brown-700 active:scale-[0.98]"
                        >
                          Continue
                          <ArrowRight size={14} strokeWidth={2} />
                        </Link>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => enroll(course)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-[13px] font-medium text-ink transition-[background-color,transform] duration-350 ease-emil hover:bg-brand-600 active:scale-[0.98]"
                          >
                            Enroll
                          </button>
                          <Link
                            to={`/learning-center/${course.id}`}
                            className="text-[12.5px] font-medium text-brown-600 hover:opacity-70"
                          >
                            Preview
                          </Link>
                        </>
                      )}
                    </div>
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
