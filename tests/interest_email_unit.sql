-- Unit checks only. Transaction rollback prevents pg_net from sending requests.
begin;
do $$
declare payload jsonb; kind text;
begin
  foreach kind in array array['consultation','course','online','nature'] loop
    payload := private.interest_email_payload(jsonb_build_object(
      'interest',kind,'full_name','Persona ficticia','email','fixture@example.invalid',
      'phone','+56912345678','contact_preference','whatsapp','source','chatbot',
      'source_path','/chatbot','created_at','2026-11-01T12:00:00Z',
      'lead_fingerprint','must not be sent','privacy_consent',true));
    assert payload->>'Nombre' = 'Persona ficticia';
    assert payload->>'email' = 'fixture@example.invalid';
    assert payload->>'_replyto' = 'fixture@example.invalid';
    assert payload->>'Teléfono' = '+56912345678';
    assert payload->>'WhatsApp' = 'https://wa.me/56912345678';
    assert payload->>'Preferencia de contacto' = 'WhatsApp';
    assert payload->>'Motivo' is not null;
    assert payload->>'_subject' like 'Nuevo interés:%';
    assert not payload ? 'lead_fingerprint' and not payload ? 'privacy_consent';
  end loop;
  payload := private.interest_email_payload('{"interest":"nature","contact_preference":"phone"}');
  assert payload->>'Preferencia de contacto' = 'Teléfono';
  assert not payload ? 'WhatsApp' and not payload ? 'email';
  payload := private.interest_email_payload('{"interest":"online","contact_preference":"video_call","country":"Chile"}');
  assert payload->>'Preferencia de contacto' = 'Videollamada';
  assert payload->>'País' = 'Chile';
  assert not has_function_privilege('anon','private.notify_interest_email()','EXECUTE');
  assert not has_function_privilege('authenticated','private.interest_email_payload(jsonb)','EXECUTE');
  assert not has_table_privilege('anon','private.interest_email_dispatches','SELECT');
end;
$$;
-- Exercise the trigger under the public insert-only role using fictitious data.
set local role anon;
insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,
  source_path,city,privacy_consent,privacy_version)
values('nature','Email notification unit fixture','email-unit@example.invalid','+56912345678',
  'whatsapp','/naturaleza','Santiago',true,'2026-10-23-contact-v3');
reset role;
do $$
begin
  assert exists(select 1 from private.interest_email_dispatches d
    join public.interest_registrations i on i.id=d.interest_id
    join net.http_request_queue q on q.id=d.request_id
    where i.email='email-unit@example.invalid' and not d.enqueue_failed
      and q.url='https://formsubmit.co/ajax/hola@nicolaszamara.com'
      and q.body is not null), 'public insertion must queue a notification';
end;
$$;
rollback;
