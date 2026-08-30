-- VespoUAV: remove Sessions (superseded by Calendar), let admins manage
-- STL files, and let a resource link to multiple drones (was a single
-- nullable dron_id column -- now a join table so one resource can show up
-- on several drones' pages, plus in Tools with badges of which drones it's
-- linked to).

drop table if exists sesiones cascade;

drop policy if exists "Admins manage stl_files" on stl_files;
create policy "Admins manage stl_files" on stl_files
  for all to authenticated using (is_admin()) with check (is_admin());

alter table recursos drop column if exists dron_id;

create table if not exists recurso_drones (
  recurso_id uuid not null references recursos(id) on delete cascade,
  dron_id uuid not null references drones(id) on delete cascade,
  primary key (recurso_id, dron_id)
);

alter table recurso_drones enable row level security;

drop policy if exists "Authenticated read access" on recurso_drones;
create policy "Authenticated read access" on recurso_drones
  for select to authenticated using (true);

drop policy if exists "Admins manage recurso_drones" on recurso_drones;
create policy "Admins manage recurso_drones" on recurso_drones
  for all to authenticated using (is_admin()) with check (is_admin());
