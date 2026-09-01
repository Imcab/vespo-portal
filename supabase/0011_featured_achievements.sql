-- Lets a member pick up to 3 of their own unlocked achievements to feature
-- as badges on their profile (Profile.jsx "Featured achievements").
--
-- Stored as an array of logro ids on miembros so it can be updated with the
-- same self-service RLS policy ("Users can update own profile") already used
-- for every other profile field, no new policy needed.

alter table public.miembros
  add column logros_destacados uuid[] not null default '{}';

alter table public.miembros
  add constraint miembros_logros_destacados_max3
  check (array_length(logros_destacados, 1) is null or array_length(logros_destacados, 1) <= 3);

-- Belt-and-suspenders: even though the UI only offers achievements the
-- member has unlocked, guard the column itself so a member can't feature an
-- achievement they were never granted.
create or replace function public.validate_logros_destacados()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.logros_destacados is not null and array_length(new.logros_destacados, 1) > 0 then
    if exists (
      select 1
      from unnest(new.logros_destacados) as picked(logro_id)
      where not exists (
        select 1 from public.miembro_logros ml
        where ml.miembro_id = new.id and ml.logro_id = picked.logro_id
      )
    ) then
      raise exception 'logros_destacados can only contain achievements the member has unlocked';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_validate_logros_destacados
  before insert or update of logros_destacados on public.miembros
  for each row
  execute function public.validate_logros_destacados();
