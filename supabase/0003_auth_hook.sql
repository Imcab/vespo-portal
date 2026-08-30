-- VespoUAV auth: restrict sign-ups to @tec.mx email addresses
-- Run this in the Supabase SQL editor. This creates the Postgres function
-- backing a "Before User Created" Auth Hook — the current Supabase-recommended
-- way to reject sign-ups server-side (a client-side domain check alone is not
-- a real security boundary, since it's trivially bypassable).
--
-- After running this SQL, you still need to register the hook in the
-- Dashboard (this part can't be done by SQL alone):
--   Authentication -> Hooks -> "Before user created" -> Postgres function
--   -> select public.hook_restrict_signup_domain
--
-- To allow more than one domain later, change the `not like` check below to
-- an `not in (...)` / lookup-table check as needed.

create or replace function public.hook_restrict_signup_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  user_email text;
begin
  user_email := lower(event->'user'->>'email');

  if user_email is null or user_email not like '%@tec.mx' then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Only @tec.mx email addresses can sign in.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

-- Only the Auth service may call this function.
grant execute on function public.hook_restrict_signup_domain to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_domain from authenticated, anon, public;
