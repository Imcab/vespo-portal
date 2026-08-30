-- VespoUAV: redesign `inventario` per the requested columns (Area, Name,
-- Type, Quantity, Available, Unit, Minimum, Notes), admin-only CRUD, and a
-- couple of related fixes (edit/delete already covered by the existing
-- admin "for all" policies from 0005 -- INSERT/UPDATE/DELETE, not just
-- INSERT -- so no RLS changes needed there, this migration only touches
-- inventario's shape and its admin policy).
-- Table has 0 rows in production, so this is a plain reshape, not a backfill.

alter table inventario drop column if exists categoria;
alter table inventario drop column if exists ubicacion;
alter table inventario drop column if exists estado;

alter table inventario add column if not exists area_id uuid references areas(id) on delete set null;
alter table inventario add column if not exists tipo text not null default 'consumible'
  check (tipo in ('consumible', 'herramienta', 'equipo'));
alter table inventario add column if not exists disponible integer not null default 0;
alter table inventario add column if not exists minimo integer not null default 0;

drop policy if exists "Admins manage inventario" on inventario;
create policy "Admins manage inventario" on inventario
  for all to authenticated using (is_admin()) with check (is_admin());
