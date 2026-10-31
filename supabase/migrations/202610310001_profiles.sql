-- Phase 1 only: profile metadata, never document contents or OAuth tokens.
-- Run once through Supabase migrations / SQL Editor on the intended project.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username is null or (
      username ~ '^[a-z][a-z0-9_]{2,23}$'
      and username not in ('admin','administrator','api','auth','account','filemate','help','support','system','www')
    )
  ),
  constraint profiles_display_name_length check (char_length(display_name) <= 80)
);

alter table public.profiles enable row level security;
grant usage on schema public to anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name) on public.profiles to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No client INSERT/DELETE policy or grant. Auth trigger owns row creation.

create function public.filemate_profile_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Do not trust signup metadata for uniqueness, roles or permissions.
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.filemate_profile_created() from public, anon, authenticated;
create trigger filemate_auth_user_created after insert on auth.users
  for each row execute function public.filemate_profile_created();

-- Cover users created before this migration without importing private auth metadata.
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

create function public.filemate_profile_updated()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.filemate_profile_updated() from public, anon, authenticated;
create trigger filemate_profile_update before update on public.profiles
  for each row execute function public.filemate_profile_updated();

-- Exact public username lookup: no email, UUID, timestamps, display name, tokens, or listing.
-- SECURITY DEFINER is limited to this one projection; all object names are schema-qualified.
create function public.lookup_username(candidate text)
returns table (username text) language sql stable security definer set search_path = '' as $$
  select p.username from public.profiles as p
  where candidate is not null and char_length(candidate) between 3 and 24
    and lower(trim(candidate)) ~ '^[a-z][a-z0-9_]{2,23}$'
    and p.username = lower(trim(candidate))
  limit 1;
$$;
revoke all on function public.lookup_username(text) from public, anon, authenticated;
grant execute on function public.lookup_username(text) to anon, authenticated;

comment on table public.profiles is 'Private account profile. Username is claimed after authentication; unique constraint resolves races.';
comment on function public.lookup_username(text) is 'Public exact-match username only. It does not reserve a name or authorize file sharing.';
commit;
