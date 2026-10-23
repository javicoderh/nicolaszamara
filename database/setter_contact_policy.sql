-- Follow-up to setter_conversations_and_contact_capture: contact policy version
-- and management transitions, keeping historic form consents unchanged.
alter table public.interest_registrations drop constraint interest_registrations_privacy_version_check;
alter table public.interest_registrations add constraint interest_privacy_version_matches_source
  check ((source='form' and privacy_version='2026-10-21') or (source='chatbot' and privacy_version='2026-10-23'));
alter table public.interest_registrations drop constraint interest_fields_match;
alter table public.interest_registrations add constraint interest_fields_match check ((
  (source='form' and email is not null and contact_channel is null and phone is null
    and contact_consent is null and contact_accepted_at is null and lead_request_id is null and lead_fingerprint is null
    and ((interest='online' and country is not null and char_length(btrim(country)) between 1 and 100 and city is null)
      or (interest='nature' and city is not null and char_length(btrim(city)) between 1 and 100 and country is null and experience is null)))
  or (source='chatbot' and country is null and city is null and experience is null
    and contact_consent is true and contact_accepted_at is not null and lead_request_id is not null and lead_fingerprint is not null
    and ((contact_channel='email' and email is not null and phone is null)
      or (contact_channel in ('phone','whatsapp') and email is null and phone ~ '^\+[1-9][0-9]{6,14}$')))
) is true);
alter table public.interest_registrations add constraint interest_management_status
  check (management_status in ('new','contacted','closed'));
