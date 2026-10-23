-- Preserve historic preferences and consents; enforce the new contract on INSERT.
alter table public.interest_registrations drop constraint interest_contact_preference;
alter table public.interest_registrations add constraint interest_contact_preference
  check (contact_preference in ('video_call','phone','whatsapp','email'));

alter table public.interest_registrations drop constraint interest_privacy_version_matches_source;
alter table public.interest_registrations add constraint interest_privacy_version_matches_source check (
  (source='form' and privacy_version in ('2026-10-21','2026-10-23-contact-v2','2026-10-23-contact-v3'))
  or (source='chatbot' and privacy_version in ('2026-10-23','2026-10-23-contact-v2','2026-10-23-contact-v3'))
);

create or replace function private.require_interest_contact_details() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.phone is null or new.phone !~ '^[+][1-9][0-9]{6,14}$'
    or new.contact_preference is null or new.contact_preference not in ('video_call','phone','whatsapp')
    or new.email is null or char_length(btrim(new.email))=0
    or new.privacy_version is distinct from '2026-10-23-contact-v3' then
    raise exception 'interest_contact_details_required' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function private.require_interest_contact_details() from public, anon, authenticated;

alter policy "Public forms may only insert consented interests" on public.interest_registrations
  with check (source='form' and privacy_consent and privacy_version='2026-10-23-contact-v3');
