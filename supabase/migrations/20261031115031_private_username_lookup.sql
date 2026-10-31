-- Keep public username-only behavior, with privileged lookup code outside the Data API schema.
-- Do not add filemate_private to Supabase's exposed schemas.
begin;
create schema filemate_private;
revoke all on schema filemate_private from public;
grant usage on schema filemate_private to anon, authenticated;

create function filemate_private.lookup_username(candidate text)
returns table (username text) language sql stable security definer set search_path = '' as $$
  select p.username from public.profiles as p
  where candidate is not null and char_length(candidate) between 3 and 24
    and lower(trim(candidate)) ~ '^[a-z][a-z0-9_]{2,23}$'
    and p.username = lower(trim(candidate))
  limit 1;
$$;
revoke all on function filemate_private.lookup_username(text) from public, anon, authenticated;
grant execute on function filemate_private.lookup_username(text) to anon, authenticated;

-- The callable API function is unprivileged. Its private helper exposes precisely one username.
-- Anonymous exact-name lookup is intentional; it never returns private profile fields or lists users.
create or replace function public.lookup_username(candidate text)
returns table (username text) language sql stable security invoker set search_path = '' as $$
  select name.username from filemate_private.lookup_username(candidate) as name;
$$;
revoke all on function public.lookup_username(text) from public, anon, authenticated;
grant execute on function public.lookup_username(text) to anon, authenticated;
comment on function public.lookup_username(text) is 'Unprivileged API wrapper for an exact username-only lookup; does not authorize sharing.';
comment on schema filemate_private is 'Internal helpers. Never expose this schema in the Supabase Data API.';
commit;
