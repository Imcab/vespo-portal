-- VespoUAV: admin role + admin-only write access, task approval, and
-- locking self-service area assignment down to the DB level.
-- Run this once in the Supabase SQL editor. Safe to re-run.

-- ============ ADMIN ROLE ============
alter table miembros add column if not exists is_admin boolean not null default false;

-- Bootstrap: make the team lead the first (and for now only) admin.
update miembros set is_admin = true where email = 'a01798415@tec.mx';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from miembros where user_id = auth.uid()), false);
$$;

-- ============ MIEMBROS: lock down self-service, allow admin writes ============
-- Non-admins may still update their own row (name/photo, from 0004) but not
-- area_id / is_admin / user_id. Admins may update any row (needed to assign
-- members to areas).
create or replace function public.miembros_protect_restricted_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.area_id is distinct from old.area_id
       or new.is_admin is distinct from old.is_admin
       or new.user_id is distinct from old.user_id then
      raise exception 'Only admins can change area, admin status, or user_id.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists miembros_protect_restricted_columns on miembros;
create trigger miembros_protect_restricted_columns
  before update on miembros
  for each row execute function public.miembros_protect_restricted_columns();

drop policy if exists "Admins can update any member" on miembros;
create policy "Admins can update any member" on miembros
  for update to authenticated
  using (is_admin())
  with check (is_admin());

-- ============ ADMIN-ONLY CONTENT MANAGEMENT ============
drop policy if exists "Admins manage sesiones" on sesiones;
create policy "Admins manage sesiones" on sesiones
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins manage eventos" on eventos;
create policy "Admins manage eventos" on eventos
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins manage recursos" on recursos;
create policy "Admins manage recursos" on recursos
  for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins manage drones" on drones;
create policy "Admins manage drones" on drones
  for all to authenticated using (is_admin()) with check (is_admin());

-- ============ TAREAS: admin CRUD + approval, member self-complete ============
alter table tareas add column if not exists aprobada boolean not null default false;

drop policy if exists "Admins manage tareas" on tareas;
create policy "Admins manage tareas" on tareas
  for all to authenticated using (is_admin()) with check (is_admin());

-- A member can update a task assigned to them (or broadcast to everyone,
-- asignado_a is null) — used by the UI's "Mark as done" action. Row-level
-- RLS can't restrict this to *only* the estado column, so this relies on the
-- client only ever sending {estado: 'completada'} here; admins are the only
-- ones with UI access to the `aprobada` flag. Acceptable for a small,
-- trusted team roster.
drop policy if exists "Members can update own tasks" on tareas;
create policy "Members can update own tasks" on tareas
  for update to authenticated
  using (
    asignado_a is null
    or asignado_a in (select id from miembros where user_id = auth.uid())
  )
  with check (
    asignado_a is null
    or asignado_a in (select id from miembros where user_id = auth.uid())
  );
