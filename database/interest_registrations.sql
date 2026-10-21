-- Canonical schema for Supabase project vsbolndzzkrhadprdlto.
-- Applied remotely as create_interest_registrations (migration history in Supabase).
create table public.interest_registrations (
  id uuid primary key default gen_random_uuid(),
  interest text not null check (interest in ('online', 'nature')),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  email text not null check (
    char_length(email) <= 254 and email = lower(btrim(email))
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  ),
  country text,
  city text,
  experience text check (experience is null or char_length(experience) <= 500),
  updates_consent boolean not null default false,
  privacy_consent boolean not null check (privacy_consent),
  privacy_version text not null check (privacy_version = '2026-10-21'),
  privacy_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint interest_fields_match check (
    (interest = 'online' and country is not null and char_length(btrim(country)) between 1 and 100 and city is null)
    or (interest = 'nature' and city is not null and char_length(btrim(city)) between 1 and 100 and country is null and experience is null)
  )
);

create index interest_registrations_created_at_idx on public.interest_registrations (created_at desc);
create index interest_registrations_email_created_at_idx on public.interest_registrations (email, created_at desc);
alter table public.interest_registrations enable row level security;
revoke all on public.interest_registrations from public, anon, authenticated;
grant insert (interest, full_name, email, country, city, experience, updates_consent, privacy_consent, privacy_version)
  on public.interest_registrations to anon;
create policy "Public forms may only insert consented interests"
  on public.interest_registrations for insert to anon
  with check (privacy_consent and privacy_version = '2026-10-21');

-- A private trigger enforces limits even if the public write endpoint is called directly.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.limit_interest_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(874291);
  if (select count(*) from public.interest_registrations where created_at > pg_catalog.now() - interval '1 minute') >= 200
    or (select count(*) from public.interest_registrations where email = new.email and created_at > pg_catalog.now() - interval '1 minute') >= 5 then
    raise exception 'interest_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.limit_interest_submissions() from public, anon, authenticated;
create trigger limit_interest_submissions before insert on public.interest_registrations
for each row execute function private.limit_interest_submissions();
