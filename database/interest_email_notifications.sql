-- Additive migration: every committed INSERT queues an asynchronous notification.
create extension if not exists pg_net with schema extensions;

create function private.interest_email_payload(record jsonb) returns jsonb
language sql immutable security invoker set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    '_subject', 'Nuevo interés: ' || case record->>'interest'
      when 'consultation' then 'Consulta' when 'course' then 'Curso Flores de Bach'
      when 'online' then 'Curso online' when 'nature' then 'Naturaleza' else 'Otro' end,
    '_template', 'table', '_captcha', 'false',
    '_replyto', record->>'email',
    'Motivo', case record->>'interest'
      when 'consultation' then 'Consulta' when 'course' then 'Curso Flores de Bach'
      when 'online' then 'Curso online' when 'nature' then 'Naturaleza' else record->>'interest' end,
    'Nombre', record->>'full_name', 'email', record->>'email',
    'Teléfono', record->>'phone',
    'Preferencia de contacto', case record->>'contact_preference'
      when 'video_call' then 'Videollamada' when 'phone' then 'Teléfono'
      when 'whatsapp' then 'WhatsApp' else record->>'contact_preference' end,
    'Escribir correo', case when record->>'email' is not null then 'mailto:' || (record->>'email') end,
    'Llamar', case when record->>'phone' is not null then 'tel:' || (record->>'phone') end,
    'WhatsApp', case when record->>'contact_preference' = 'whatsapp'
      then 'https://wa.me/' || pg_catalog.regexp_replace(record->>'phone', '[^0-9]', '', 'g') end,
    'Ciudad', record->>'city', 'País', record->>'country',
    'Experiencia indicada', record->>'experience',
    'Origen', record->>'source', 'Página', record->>'source_path',
    'Fecha de registro', record->>'created_at', 'Identificador', record->>'id'
  ));
$$;
revoke all on function private.interest_email_payload(jsonb) from public, anon, authenticated;

-- Metadata only: do not duplicate names, addresses or phone numbers here.
create table private.interest_email_dispatches (
  interest_id uuid primary key references public.interest_registrations(id) on delete cascade,
  request_id bigint,
  queued_at timestamptz not null default now(),
  enqueue_failed boolean not null default false
);
alter table private.interest_email_dispatches enable row level security;
revoke all on private.interest_email_dispatches from public, anon, authenticated;

-- Definer is required for insert-only public submissions to enqueue fixed-destination
-- requests and write private metadata. Never accepts a caller-controlled URL.
create function private.notify_interest_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare request_id bigint;
begin
  begin
    select net.http_post(
      url := 'https://formsubmit.co/ajax/hola@nicolaszamara.com',
      body := private.interest_email_payload(to_jsonb(new)),
      headers := '{"Content-Type":"application/json","Accept":"application/json","Referer":"https://www.nicolaszamara.com/"}'::jsonb,
      timeout_milliseconds := 10000
    ) into request_id;
    insert into private.interest_email_dispatches(interest_id, request_id)
      values(new.id, request_id);
  exception when others then
    -- A notification problem must never discard an otherwise valid contact.
    insert into private.interest_email_dispatches(interest_id, enqueue_failed)
      values(new.id, true);
  end;
  return new;
end;
$$;
revoke all on function private.notify_interest_email() from public, anon, authenticated;
create trigger notify_interest_email after insert on public.interest_registrations
for each row execute function private.notify_interest_email();
