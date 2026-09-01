-- Fix "Database error creating new user" on sign-up.
--
-- public.handle_new_user() (fired by the on_auth_user_created trigger on
-- auth.users) does:
--   insert into public.miembros (user_id, nombre, email)
--   values (...) on conflict (user_id) do nothing;
--
-- but miembros_user_id_key was a PARTIAL unique index
-- (UNIQUE (user_id) WHERE user_id IS NOT NULL). Postgres only picks a
-- partial unique index as the ON CONFLICT arbiter when the INSERT's
-- ON CONFLICT clause repeats the same WHERE predicate, which this one
-- doesn't. Every sign-up hit:
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
-- and Supabase Auth surfaced that as "Database error creating new user".
--
-- A plain UNIQUE constraint already treats NULLs as distinct from each
-- other, so the partial predicate wasn't buying anything — replace it
-- with a regular unique constraint that ON CONFLICT (user_id) can match
-- directly.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'miembros_user_id_key'
      and conrelid = 'public.miembros'::regclass
      and contype = 'u'
  ) then
    execute 'drop index if exists public.miembros_user_id_key';
    execute 'alter table public.miembros add constraint miembros_user_id_key unique (user_id)';
  end if;
end $$;
