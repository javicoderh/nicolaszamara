-- Unit fixtures only. Rollback prevents notification delivery.
begin;
set local role anon;
insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,
 source_path,privacy_consent,privacy_version,attention_location)
values('consultation','Location unit fixture','location-unit@example.invalid','+56912345678',
 'whatsapp','/consulta',true,'2026-10-23-contact-v3','evaluz');
reset role;
do $$
begin
 assert exists(select 1 from public.interest_registrations where email='location-unit@example.invalid' and attention_location='evaluz');
 assert exists(select 1 from private.interest_email_dispatches d join public.interest_registrations i on i.id=d.interest_id
   join net.http_request_queue q on q.id=d.request_id where i.email='location-unit@example.invalid'
   and convert_from(q.body,'UTF8')::jsonb->>'Lugar de atención'='Centro Médico Evaluz · Providencia');
 assert private.interest_email_payload('{"attention_location":"villa_vida_natural"}')->>'Lugar de atención'='Villa Vida Natural · Las Condes';
 assert private.interest_email_payload('{"attention_location":"guidance"}')->>'Lugar de atención'='Necesito orientación para elegir';
 assert not private.interest_email_payload('{"source":"chatbot"}') ? 'Lugar de atención';
 assert public.admin_access('detail','{"id":"00000000-0000-0000-0000-000000000000"}')->>'status'='unauthorized';
 assert not has_function_privilege('anon','public.admin_access(text,jsonb)','execute');
end $$;
rollback;
