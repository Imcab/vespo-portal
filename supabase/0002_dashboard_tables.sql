-- VespoUAV dashboard tables
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

create extension if not exists pgcrypto;

-- ============ AREAS ============
-- Team sub-groups (e.g. "Aerodynamics", "Electronics", "Software").
create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  color text,
  created_at timestamptz not null default now()
);

-- ============ MIEMBROS ============
-- Team roster.
create table if not exists miembros (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rol text,
  email text,
  foto_url text,
  area_id uuid references areas(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ SESIONES ============
-- Work/meeting sessions log.
create table if not exists sesiones (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha timestamptz not null default now(),
  area_id uuid references areas(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ TAREAS ============
-- Task board.
create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_progreso', 'completada')),
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  asignado_a uuid references miembros(id) on delete set null,
  area_id uuid references areas(id) on delete set null,
  fecha_limite date,
  created_at timestamptz not null default now()
);

-- ============ EVENTOS ============
-- Calendar events (competitions, deadlines, sessions, etc.).
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  tipo text not null default 'general' check (tipo in ('general', 'sesion', 'competencia', 'entrega')),
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  created_at timestamptz not null default now()
);

-- ============ RECURSOS ============
-- Shared resources table: team-wide (dron_id null, shown under "Tools") and
-- per-drone (dron_id set, shown on that drone's detail page). Replaces the
-- old `documentacion` table — the app no longer queries `documentacion`,
-- it's left in place untouched in case you want to migrate old rows by hand.
create table if not exists recursos (
  id uuid primary key default gen_random_uuid(),
  dron_id uuid references drones(id) on delete cascade,
  titulo text not null,
  descripcion text,
  url text not null,
  icono_url text,
  categoria text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ INVENTARIO ============
-- Parts / components stock tracking.
create table if not exists inventario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  cantidad integer not null default 0,
  unidad text not null default 'pcs',
  ubicacion text,
  estado text not null default 'disponible' check (estado in ('disponible', 'en_uso', 'agotado', 'en_reparacion')),
  notas text,
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
-- The app now requires sign-in (see 0003_auth_hook.sql), so these tables are
-- readable by any signed-in @tec.mx user, not the public/anon key. No public
-- write policy exists yet — add one later, scoped to the actual owner column,
-- when you build create/edit UI (see supabase-postgres-best-practices notes
-- on `to authenticated` + an ownership predicate, and on UPDATE needing both
-- USING and WITH CHECK).
alter table areas enable row level security;
alter table miembros enable row level security;
alter table sesiones enable row level security;
alter table tareas enable row level security;
alter table eventos enable row level security;
alter table recursos enable row level security;
alter table inventario enable row level security;

drop policy if exists "Public read access" on areas;
drop policy if exists "Public read access" on miembros;
drop policy if exists "Public read access" on sesiones;
drop policy if exists "Public read access" on tareas;
drop policy if exists "Public read access" on eventos;
drop policy if exists "Public read access" on recursos;
drop policy if exists "Public read access" on inventario;

create policy "Authenticated read access" on areas for select to authenticated using (true);
create policy "Authenticated read access" on miembros for select to authenticated using (true);
create policy "Authenticated read access" on sesiones for select to authenticated using (true);
create policy "Authenticated read access" on tareas for select to authenticated using (true);
create policy "Authenticated read access" on eventos for select to authenticated using (true);
create policy "Authenticated read access" on recursos for select to authenticated using (true);
create policy "Authenticated read access" on inventario for select to authenticated using (true);

-- Optional but recommended: your existing `drones`, `stl_files`, and
-- `documentacion` tables were built before login existed and likely still
-- allow anon/public read. If you want the whole app gated behind sign-in
-- (not just these new tables), tighten those the same way — review their
-- current policies first (policy names vary), e.g.:
--   drop policy if exists "<existing policy name>" on drones;
--   create policy "Authenticated read access" on drones for select to authenticated using (true);
-- (repeat for stl_files, documentacion). Left commented out here since I
-- can't see your current policy names without an authenticated DB session.
