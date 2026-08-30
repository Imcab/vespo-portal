-- VespoUAV: mark drone config files as simulation-ready, and let a member
-- belong to more than one area (was a single nullable area_id column --
-- now a join table, same shape as recurso_drones from 0007).

alter table stl_files add column if not exists simulable boolean not null default false;

create table if not exists miembro_areas (
  miembro_id uuid not null references miembros(id) on delete cascade,
  area_id uuid not null references areas(id) on delete cascade,
  primary key (miembro_id, area_id)
);

alter table miembro_areas enable row level security;

drop policy if exists "Authenticated read access" on miembro_areas;
create policy "Authenticated read access" on miembro_areas
  for select to authenticated using (true);

drop policy if exists "Admins manage miembro_areas" on miembro_areas;
create policy "Admins manage miembro_areas" on miembro_areas
  for all to authenticated using (is_admin()) with check (is_admin());

insert into miembro_areas (miembro_id, area_id)
select id, area_id from miembros where area_id is not null
on conflict do nothing;

-- area_id is no longer a protected column on miembros (membership now lives
-- in miembro_areas, guarded by its own admin-only policy above) -- drop the
-- area_id check from the update-guard trigger before dropping the column.
create or replace function public.miembros_protect_restricted_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.is_admin is distinct from old.is_admin
       or new.user_id is distinct from old.user_id then
      raise exception 'Only admins can change admin status or user_id.';
    end if;
  end if;
  return new;
end;
$$;

alter table miembros drop column if exists area_id;
