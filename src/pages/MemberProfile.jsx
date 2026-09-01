import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import AchievementBadge from '../components/AchievementBadge';
import { ArrowLeft, Coins } from 'lucide-react';

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-secondary">{title}</h2>
      {children}
    </section>
  );
}

export default function MemberProfile() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      const { data: memberData, error } = await supabase
        .from('miembros')
        .select('*, miembro_areas(area_id, areas(id, nombre, color))')
        .eq('id', id)
        .maybeSingle();
      if (error || !memberData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setMember(memberData);

      const [{ data: grants }, { data: weekData }] = await Promise.all([
        supabase
          .from('miembro_logros')
          .select('logro_id, logros(id, nombre, icono, color, nivel, tipo)')
          .eq('miembro_id', id),
        supabase
          .from('actualizaciones_semanales')
          .select('*')
          .eq('miembro_id', id)
          .order('semana_inicio', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const byId = new Map();
      (grants || []).forEach((row) => {
        if (row.logros && !['lootbox', 'task', 'board'].includes(row.logros.tipo)) byId.set(row.logro_id, row.logros);
      });
      setAchievements(Array.from(byId.values()));
      setWeek(weekData || null);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="skeleton h-8 w-1/2 animate-shimmer rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[15px] text-ink-secondary">Member not found.</p>
        <Link
          to="/members"
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 transition-opacity duration-350 ease-emil hover:opacity-70"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to members
        </Link>
      </div>
    );
  }

  const myAreas = (member.miembro_areas || []).map((row) => row.areas).filter(Boolean);
  const featured = (member.logros_destacados || [])
    .map((logroId) => achievements.find((a) => a.id === logroId))
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <Link
        to="/members"
        className="mb-8 inline-flex items-center gap-1.5 text-[14px] font-medium text-brown-600 transition-opacity duration-350 ease-emil hover:opacity-70"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Back to members
      </Link>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {member.foto_url ? (
            <img src={member.foto_url} alt={member.nombre} className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[20px] font-semibold text-brown-600">
              {initials(member.nombre)}
            </span>
          )}
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

        <div className="flex shrink-0 flex-row gap-6 sm:flex-col sm:items-end sm:gap-1">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[26px] font-semibold leading-none text-ink">{member.puntaje ?? 0}</span>
            <span className="text-[11px] uppercase tracking-wide text-ink-secondary">points</span>
          </div>
          <div className="flex flex-col items-start sm:items-end">
            <span className="flex items-center gap-1 text-[16px] font-semibold leading-none text-brown-600">
              <Coins size={14} strokeWidth={2} />
              {member.monedas ?? 0}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-ink-secondary">coins</span>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="mb-10">
          <div className="flex flex-wrap gap-5">
            {featured.map((a) => (
              <div key={a.id} className="flex w-16 flex-col items-center gap-1.5 text-center">
                <AchievementBadge icono={a.icono} color={a.color} locked={false} nivel={a.nivel} size={56} />
                <span className="text-[11px] leading-tight text-ink-secondary">{a.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
        <Section title="About me">
          {member.acerca_de || member.pasatiempos || member.dato_curioso ? (
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
        </Section>

        <Section title="Culture">
          {member.cultura_musica || member.cultura_libro || member.cultura_idea || member.cultura_frase ? (
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
        </Section>
      </div>

      {week && (week.avanzando || week.fallando || week.aprendiendo) && (
        <div className="mt-10">
          <Section title="This week">
            <div className="flex flex-col gap-2.5 rounded-card bg-surface-soft p-5 text-[13.5px] text-ink-secondary">
              {week.avanzando && (
                <p>
                  <span className="font-medium text-ink-secondary">Advancing on: </span>
                  {week.avanzando}
                </p>
              )}
              {week.fallando && (
                <p>
                  <span className="font-medium text-ink-secondary">Struggling with: </span>
                  {week.fallando}
                </p>
              )}
              {week.aprendiendo && (
                <p>
                  <span className="font-medium text-ink-secondary">Learning: </span>
                  {week.aprendiendo}
                </p>
              )}
            </div>
          </Section>
        </div>
      )}

      <div className="mt-10">
        <Section title={`Achievements (${achievements.length})`}>
          {achievements.length === 0 ? (
            <p className="text-[13.5px] italic text-ink-tertiary">No achievements unlocked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {achievements.map((a) => (
                <div key={a.id} className="flex w-16 flex-col items-center gap-1.5 text-center" title={a.nombre}>
                  <AchievementBadge icono={a.icono} color={a.color} locked={false} nivel={a.nivel} size={48} />
                  <span className="truncate text-[10.5px] leading-tight text-ink-secondary">{a.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
