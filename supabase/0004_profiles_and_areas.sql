-- VespoUAV: link auth users to the roster, self-serve profile editing, and
-- seed the fixed list of areas.
-- Run this once in the Supabase SQL editor. Safe to re-run.

-- ============ AREAS (seed) ============
insert into areas (nombre, color)
select v.nombre, v.color
from (
  values
    ('Manufacturing & Aerodynamics', '#b45309'),
    ('Electrical & Power Train', '#2563eb'),
    ('Logistics', '#059669'),
    ('Programming & Control', '#7c3aed'),
    ('Accounting', '#dc2626'),
    ('Marketing', '#db2777')
) as v(nombre, color)
where not exists (select 1 from areas a where a.nombre = v.nombre);

-- ============ MIEMBROS: link to auth.users ============
alter table miembros add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists miembros_user_id_key on miembros(user_id) where user_id is not null;

-- Auto-create a roster row for every new authenticated user, so they show
-- up on the Members page immediately without any manual step.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.miembros (user_id, nombre, email)
  values (new.id, split_part(new.email, '@', 1), new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing auth users created before this trigger existed.
insert into public.miembros (user_id, nombre, email)
select u.id, split_part(u.email, '@', 1), u.email
from auth.users u
where not exists (select 1 from public.miembros m where m.user_id = u.id);

-- Users can edit their own roster row (name, photo, area).
drop policy if exists "Users can update own profile" on miembros;
create policy "Users can update own profile" on miembros
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============ STORAGE: avatars bucket ============
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
