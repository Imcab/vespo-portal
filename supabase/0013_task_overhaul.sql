-- Rebuilds task assignment around a proper per-person join table (fixes the
-- "can only approve once everyone is done" problem when a task is shared),
-- and adds a self-claim "Board" system for opt-in tasks with limited slots.
-- Both regular tasks and Board tasks now carry a point value via a hidden
-- "shadow" logros row (same trick used for the 5 lootbox tiers), so
-- approval flows through the existing puntaje/monedas recalculation and
-- shows up for free in the Achievements page's global log.

-- 1. Allow the two new hidden achievement types.
alter table public.logros drop constraint logros_tipo_check;
alter table public.logros add constraint logros_tipo_check
  check (tipo = any (array['manual', 'automatico', 'daily', 'lootbox', 'task', 'board']::text[]));

-- 2. Per-person assignment on regular tasks.
create table public.tarea_asignados (
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  miembro_id uuid not null references public.miembros(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'completada')),
  aprobada boolean not null default false,
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.miembros(id),
  created_at timestamptz not null default now(),
  primary key (tarea_id, miembro_id)
);
alter table public.tarea_asignados enable row level security;

create policy "Authenticated read access" on public.tarea_asignados for select using (true);
create policy "Admins manage tarea_asignados" on public.tarea_asignados for all using (public.is_admin()) with check (public.is_admin());
create policy "Members update own assignment" on public.tarea_asignados for update
  using (miembro_id in (select id from public.miembros where user_id = auth.uid()))
  with check (miembro_id in (select id from public.miembros where user_id = auth.uid()));

-- 3. Board postings — admin-created, capacity-limited, self-claimed.
create table public.board_tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  cupo integer not null check (cupo > 0),
  area_id uuid references public.areas(id),
  fecha_limite date,
  logro_id uuid not null references public.logros(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.miembros(id)
);
alter table public.board_tareas enable row level security;

create policy "Authenticated read access" on public.board_tareas for select using (true);
create policy "Admins manage board_tareas" on public.board_tareas for all using (public.is_admin()) with check (public.is_admin());

create table public.board_asignados (
  board_tarea_id uuid not null references public.board_tareas(id) on delete cascade,
  miembro_id uuid not null references public.miembros(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'completada')),
  aprobada boolean not null default false,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.miembros(id),
  primary key (board_tarea_id, miembro_id)
);
alter table public.board_asignados enable row level security;

create policy "Authenticated read access" on public.board_asignados for select using (true);
create policy "Admins manage board_asignados" on public.board_asignados for all using (public.is_admin()) with check (public.is_admin());
create policy "Members update own claim" on public.board_asignados for update
  using (miembro_id in (select id from public.miembros where user_id = auth.uid()))
  with check (miembro_id in (select id from public.miembros where user_id = auth.uid()));
create policy "Members delete own unapproved claim" on public.board_asignados for delete
  using (aprobada = false and miembro_id in (select id from public.miembros where user_id = auth.uid()));

-- 4. Members can update their own assignment row (to mark done) but not the
-- approval fields — only admins (or the trigger below acting as the system)
-- can set those.
create or replace function public.protect_assignment_approval_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    if new.aprobada is distinct from old.aprobada
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by then
      raise exception 'Only admins can approve a task assignment.';
    end if;
  end if;
  return new;
end;
$function$;

create trigger trg_tarea_asignados_protect
  before update on public.tarea_asignados
  for each row execute function public.protect_assignment_approval_columns();

create trigger trg_board_asignados_protect
  before update on public.board_asignados
  for each row execute function public.protect_assignment_approval_columns();

-- 5. On approval, grant the parent task's shadow-logro points (once).
-- Un-approving (true -> false) cleanly revokes the grant again, mirroring
-- how achievement grants are revoked in Achievements.jsx.
create or replace function public.award_task_assignment_points()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  parent_logro_id uuid;
  parent_puntos int;
  parent_titulo text;
begin
  if tg_table_name = 'tarea_asignados' then
    select t.logro_id, t.titulo into parent_logro_id, parent_titulo from public.tareas t where t.id = new.tarea_id;
  else
    select b.logro_id, b.titulo into parent_logro_id, parent_titulo from public.board_tareas b where b.id = new.board_tarea_id;
  end if;

  if parent_logro_id is null then
    return new;
  end if;

  if new.aprobada and not old.aprobada then
    select puntos into parent_puntos from public.logros where id = parent_logro_id;
    if not exists (
      select 1 from public.miembro_logros
      where miembro_id = new.miembro_id and logro_id = parent_logro_id
    ) then
      insert into public.miembro_logros (miembro_id, logro_id, puntos, otorgado_por, nota)
      values (new.miembro_id, parent_logro_id, coalesce(parent_puntos, 0), new.approved_by, parent_titulo);
    end if;
  elsif old.aprobada and not new.aprobada then
    delete from public.miembro_logros
    where miembro_id = new.miembro_id and logro_id = parent_logro_id;
  end if;

  return new;
end;
$function$;

create trigger trg_award_tarea_asignados
  after update on public.tarea_asignados
  for each row
  when (new.aprobada is distinct from old.aprobada)
  execute function public.award_task_assignment_points();

create trigger trg_award_board_asignados
  after update on public.board_asignados
  for each row
  when (new.aprobada is distinct from old.aprobada)
  execute function public.award_task_assignment_points();

-- 6. Self-claim RPC — enforces "not already claimed" and "slots remaining".
create or replace function public.claim_board_task(target_board_tarea_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  my_member_id uuid;
  cupo_max int;
  claimed_count int;
begin
  select id into my_member_id from public.miembros where user_id = auth.uid();
  if my_member_id is null then
    raise exception 'No member profile found for the current user.';
  end if;

  select cupo into cupo_max from public.board_tareas where id = target_board_tarea_id;
  if cupo_max is null then
    raise exception 'Board task not found.';
  end if;

  if exists (
    select 1 from public.board_asignados
    where board_tarea_id = target_board_tarea_id and miembro_id = my_member_id
  ) then
    return jsonb_build_object('claimed', false, 'reason', 'already_claimed');
  end if;

  select count(*) into claimed_count from public.board_asignados where board_tarea_id = target_board_tarea_id;
  if claimed_count >= cupo_max then
    return jsonb_build_object('claimed', false, 'reason', 'full');
  end if;

  insert into public.board_asignados (board_tarea_id, miembro_id) values (target_board_tarea_id, my_member_id);
  return jsonb_build_object('claimed', true);
end;
$function$;

revoke all on function public.claim_board_task(uuid) from public;
revoke all on function public.claim_board_task(uuid) from anon;
grant execute on function public.claim_board_task(uuid) to authenticated;

-- 7. Effort leaderboard now counts completions from both assignment tables.
create or replace view public.member_effort_stats as
select
  m.id as miembro_id,
  coalesce(u.updates_count, 0) as actualizaciones,
  coalesce(t.tasks_count, 0) as tareas_completadas,
  coalesce(u.updates_count, 0) + coalesce(t.tasks_count, 0) as effort_score
from public.miembros m
left join (
  select miembro_id, count(*) as updates_count
  from public.actualizaciones_semanales
  group by miembro_id
) u on u.miembro_id = m.id
left join (
  select miembro_id, count(*) as tasks_count
  from (
    select miembro_id from public.tarea_asignados where estado = 'completada' and aprobada = true
    union all
    select miembro_id from public.board_asignados where estado = 'completada' and aprobada = true
  ) combined
  group by miembro_id
) t on t.miembro_id = m.id;

-- Recreating the view resets Postgres's view options, so re-assert
-- security_invoker explicitly (the Supabase linter flags a security-definer
-- view as an error otherwise — it would run with the view owner's
-- privileges instead of the querying user's).
alter view public.member_effort_stats set (security_invoker = true);

-- 8. Migrate tareas: single asignado_a -> per-person tarea_asignados, and
-- give every task a shadow logros row to hold its point value.
alter table public.tareas add column logro_id uuid references public.logros(id);

do $$
declare
  r record;
  new_logro_id uuid;
  m record;
begin
  for r in select id, titulo, descripcion, estado, aprobada, asignado_a from public.tareas loop
    insert into public.logros (nombre, descripcion, puntos, icono, color, es_global, tipo)
    values (r.titulo, r.descripcion, 0, 'lucide:CheckSquare', '#6c450e', true, 'task')
    returning id into new_logro_id;

    update public.tareas set logro_id = new_logro_id where id = r.id;

    if r.asignado_a is null then
      for m in select id from public.miembros where activo = true loop
        insert into public.tarea_asignados (tarea_id, miembro_id, estado, aprobada, completed_at, approved_at)
        values (
          r.id, m.id,
          coalesce(r.estado, 'pendiente'),
          coalesce(r.aprobada, false),
          case when r.estado = 'completada' then now() else null end,
          case when r.aprobada then now() else null end
        );
      end loop;
    else
      insert into public.tarea_asignados (tarea_id, miembro_id, estado, aprobada, completed_at, approved_at)
      values (
        r.id, r.asignado_a,
        coalesce(r.estado, 'pendiente'),
        coalesce(r.aprobada, false),
        case when r.estado = 'completada' then now() else null end,
        case when r.aprobada then now() else null end
      );
    end if;
  end loop;
end $$;

drop policy "Members can update own tasks" on public.tareas;
alter table public.tareas drop column asignado_a;
alter table public.tareas drop column estado;
alter table public.tareas drop column aprobada;
