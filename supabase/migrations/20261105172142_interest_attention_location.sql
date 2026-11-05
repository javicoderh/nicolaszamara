-- Additive: historical records and chatbot contact submissions remain valid.
alter table public.interest_registrations add column attention_location text
  constraint interest_attention_location_check check (
    attention_location is null or (source='form' and interest='consultation'
      and attention_location in ('villa_vida_natural','evaluz','guidance')));

alter function private.interest_email_payload(jsonb) rename to interest_email_payload_before_locations;
create function private.interest_email_payload(record jsonb) returns jsonb
language sql immutable security invoker set search_path='' as $$
  select private.interest_email_payload_before_locations(record) || jsonb_strip_nulls(
    jsonb_build_object('Lugar de atención', case record->>'attention_location'
      when 'villa_vida_natural' then 'Villa Vida Natural · Las Condes'
      when 'evaluz' then 'Centro Médico Evaluz · Providencia'
      when 'guidance' then 'Necesito orientación para elegir' end));
$$;
revoke all on function private.interest_email_payload(jsonb) from public,anon,authenticated;

alter function public.admin_access(text,jsonb) rename to admin_access_before_locations;
create function public.admin_access(p_operation text,p_values jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; location text;
begin
  result:=public.admin_access_before_locations(p_operation,p_values);
  if p_operation='detail' and result->>'status'='ready' then
    select attention_location into location from public.interest_registrations
      where id=(p_values->>'id')::uuid;
    result:=jsonb_set(result,'{record,attention_location}',coalesce(to_jsonb(location),'null'::jsonb));
  end if;
  return result;
end $$;
revoke all on function public.admin_access(text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_access(text,jsonb) to service_role;
