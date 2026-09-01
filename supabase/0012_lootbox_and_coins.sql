-- Adds a "coins" currency (1/3 of every point-earning event, for a future
-- shop) and a daily gacha-style lootbox that grants points based on a
-- randomly rolled rarity tier, using the same miembro_logros ledger that
-- already drives puntaje and the achievement log — so lootbox pulls show up
-- for free in the global "Achievement log" and the points/coins recalc.

-- 1. Coins column, protected the same way puntaje already is.
alter table public.miembros
  add column monedas integer not null default 0;

create or replace function public.recalc_miembro_puntaje(member_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform set_config('vespo.allow_puntaje_write', 'on', true);
  update public.miembros
  set puntaje = coalesce(
    (select sum(l.puntos) from public.miembro_logros ml join public.logros l on l.id = ml.logro_id where ml.miembro_id = member_id),
    0
  ),
  monedas = coalesce(
    (select sum(floor(l.puntos / 3.0))::int from public.miembro_logros ml join public.logros l on l.id = ml.logro_id where ml.miembro_id = member_id),
    0
  )
  where id = member_id;
end;
$function$;

create or replace function public.miembros_protect_restricted_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    if new.is_admin is distinct from old.is_admin
       or new.user_id is distinct from old.user_id then
      raise exception 'Only admins can change admin status or user_id.';
    end if;
    if (new.puntaje is distinct from old.puntaje or new.monedas is distinct from old.monedas)
       and coalesce(current_setting('vespo.allow_puntaje_write', true), '') <> 'on' then
      raise exception 'puntaje and monedas can only be changed by the system.';
    end if;
  end if;
  return new;
end;
$function$;

-- Backfill coins for points already on the books (recalc_miembro_puntaje
-- sets the allow_puntaje_write guard flag itself before writing).
select public.recalc_miembro_puntaje(id) from public.miembros;

-- 2. Lootbox achievement rows — one per rarity tier, hidden from the main
-- Achievements catalog (filtered out client-side by tipo = 'lootbox') but
-- otherwise ordinary logros rows so grants, points and coins all flow
-- through the existing machinery.
alter table public.logros drop constraint logros_tipo_check;
alter table public.logros add constraint logros_tipo_check
  check (tipo = any (array['manual'::text, 'automatico'::text, 'daily'::text, 'lootbox'::text]));

insert into public.logros (nombre, descripcion, como_obtener, puntos, icono, color, nivel, es_global, tipo)
values
  ('Common Drop', 'A common lootbox pull.', 'Open the daily lootbox.', 5, 'lucide:Package', '#9ca3af', 'common', true, 'lootbox'),
  ('Rare Drop', 'A rare lootbox pull.', 'Open the daily lootbox.', 15, 'lucide:Gift', '#22c55e', 'rare', true, 'lootbox'),
  ('Super Rare Drop', 'A super rare lootbox pull.', 'Open the daily lootbox.', 35, 'lucide:Gem', '#3b82f6', 'super_rare', true, 'lootbox'),
  ('Epic Drop', 'An epic lootbox pull.', 'Open the daily lootbox.', 80, 'lucide:Sparkles', '#a855f7', 'epic', true, 'lootbox'),
  ('Legendary Drop', 'A legendary lootbox pull.', 'Open the daily lootbox.', 200, 'lucide:Crown', '#ef4444', 'legendary', true, 'lootbox');

-- 3. Claim RPC — one pull per member per 24h, weighted rarity roll.
-- Odds: common 55% · rare 27% · super_rare 12% · epic 5% · legendary 1%.
create or replace function public.claim_lootbox()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  my_member_id uuid;
  last_claim timestamptz;
  next_available timestamptz;
  roll numeric;
  picked record;
begin
  select id into my_member_id from public.miembros where user_id = auth.uid();
  if my_member_id is null then
    raise exception 'No member profile found for the current user.';
  end if;

  select max(ml.created_at) into last_claim
  from public.miembro_logros ml
  join public.logros l on l.id = ml.logro_id
  where ml.miembro_id = my_member_id and l.tipo = 'lootbox';

  if last_claim is not null and now() - last_claim < interval '24 hours' then
    next_available := last_claim + interval '24 hours';
    return jsonb_build_object('claimed', false, 'next_available_at', next_available);
  end if;

  roll := random() * 100;

  with weights(nivel, weight) as (
    values ('common', 55), ('rare', 27), ('super_rare', 12), ('epic', 5), ('legendary', 1)
  ),
  cum as (
    select
      l.id, l.nombre, l.puntos, l.nivel, l.icono, l.color,
      sum(w.weight) over (order by w.weight desc rows unbounded preceding) as upper_bound,
      sum(w.weight) over (order by w.weight desc rows unbounded preceding) - w.weight as lower_bound
    from public.logros l
    join weights w on w.nivel = l.nivel
    where l.tipo = 'lootbox'
  )
  select id, nombre, puntos, nivel, icono, color into picked
  from cum
  where roll >= lower_bound and roll < upper_bound
  limit 1;

  if not found then
    raise exception 'Lootbox is not configured.';
  end if;

  insert into public.miembro_logros (miembro_id, logro_id, puntos, otorgado_por, nota)
  values (my_member_id, picked.id, picked.puntos, null, 'Lootbox drop');

  return jsonb_build_object(
    'claimed', true,
    'nivel', picked.nivel,
    'nombre', picked.nombre,
    'points', picked.puntos,
    'icono', picked.icono,
    'color', picked.color,
    'next_available_at', now() + interval '24 hours'
  );
end;
$function$;

-- Supabase grants EXECUTE on new functions to anon/authenticated by default
-- (ALTER DEFAULT PRIVILEGES), and that grant is separate from the PUBLIC
-- pseudo-role — "revoke ... from public" alone does not touch it, so anon
-- must be revoked explicitly too.
revoke all on function public.claim_lootbox() from public;
revoke all on function public.claim_lootbox() from anon;
grant execute on function public.claim_lootbox() to authenticated;
