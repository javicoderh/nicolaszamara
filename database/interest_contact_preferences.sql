-- Applied after setter_contact_policy_and_management. Preserve historical values;
-- require the new contact contract on every INSERT, including direct public writes.
alter table public.interest_registrations add column contact_preference text;
alter table public.interest_registrations
  add constraint interest_contact_preference check (contact_preference in ('video_call','phone','email')),
  add constraint interest_phone_format check (phone is null or phone ~ '^[+][1-9][0-9]{6,14}$');

alter table public.interest_registrations drop constraint interest_privacy_version_matches_source;
alter table public.interest_registrations add constraint interest_privacy_version_matches_source check (
  (source='form' and privacy_version in ('2026-10-21','2026-10-23-contact-v2'))
  or (source='chatbot' and privacy_version in ('2026-10-23','2026-10-23-contact-v2'))
);
alter table public.interest_registrations drop constraint interest_fields_match;
alter table public.interest_registrations add constraint interest_fields_match check ((
  (source='form' and email is not null and contact_channel is null
    and contact_consent is null and contact_accepted_at is null and lead_request_id is null and lead_fingerprint is null
    and ((interest='online' and country is not null and char_length(btrim(country)) between 1 and 100 and city is null)
      or (interest='nature' and city is not null and char_length(btrim(city)) between 1 and 100 and country is null and experience is null)))
  or (source='chatbot' and country is null and city is null and experience is null
    and contact_consent is true and contact_accepted_at is not null and lead_request_id is not null and lead_fingerprint is not null
    and (
      (contact_preference is null and ((contact_channel='email' and email is not null and phone is null)
        or (contact_channel in ('phone','whatsapp') and email is null and phone is not null)))
      or (contact_preference is not null and contact_channel=contact_preference and phone is not null
        and (contact_preference='phone' or email is not null))
    ))
) is true);

create function private.require_interest_contact_details() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.phone is null or new.phone !~ '^[+][1-9][0-9]{6,14}$'
    or new.contact_preference is null or new.contact_preference not in ('video_call','phone','email')
    or (new.contact_preference in ('video_call','email') and new.email is null)
    or new.privacy_version != '2026-10-23-contact-v2' then
    raise exception 'interest_contact_details_required' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function private.require_interest_contact_details() from public, anon, authenticated;
create trigger check_interest_contact_details before insert on public.interest_registrations
for each row execute function private.require_interest_contact_details();
grant insert(phone,contact_preference) on public.interest_registrations to anon;
alter policy "Public forms may only insert consented interests" on public.interest_registrations
  with check (source='form' and privacy_consent and privacy_version='2026-10-23-contact-v2');

create or replace function public.setter_save_contact(p_visitor uuid,p_conversation uuid,p_request uuid,p_hash text,p_record jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  c private.setter_conversations%rowtype;
  existing public.interest_registrations%rowtype;
begin
  select * into c from private.setter_conversations where visitor=p_visitor for update;
  if not found then return jsonb_build_object('status','session_required'); end if;
  select * into existing from public.interest_registrations where lead_request_id=p_request;
  if found then
    if existing.lead_fingerprint=p_hash then return jsonb_build_object('status','saved'); end if;
    return jsonb_build_object('status','request_conflict');
  end if;
  if c.conversation_id != p_conversation or not c.capturing then
    return jsonb_build_object('status','capture_required');
  end if;
  insert into public.interest_registrations(interest,full_name,email,phone,source,contact_channel,contact_preference,
    contact_consent,contact_accepted_at,privacy_consent,privacy_version,updates_consent,lead_request_id,lead_fingerprint)
  values(p_record->>'interest',p_record->>'full_name',p_record->>'email',p_record->>'phone','chatbot',
    p_record->>'contact_preference',p_record->>'contact_preference',
    (p_record->>'contact_consent')::boolean,now(),(p_record->>'privacy_consent')::boolean,p_record->>'privacy_version',
    (p_record->>'updates_consent')::boolean,p_request,p_hash);
  update private.setter_conversations set capturing=false,action='none',updated_at=now() where visitor=p_visitor;
  return jsonb_build_object('status','saved');
exception
  when unique_violation then return jsonb_build_object('status','request_conflict');
  when raise_exception then
    if sqlerrm='interest_rate_limited' then return jsonb_build_object('status','rate_limited'); end if;
    raise;
end;
$$;
revoke all on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.setter_save_contact(uuid,uuid,uuid,text,jsonb) to service_role;
