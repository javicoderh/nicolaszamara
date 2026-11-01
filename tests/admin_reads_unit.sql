-- Synthetic fixture and all marker changes are rolled back, including email queue.
begin;
set local role service_role;
do $$
declare
  u uuid;
  i uuid;
  h text := 'pbkdf2_sha256$600000$' || repeat('a',32) || '$' || repeat('b',64);
  result jsonb;
  first_read text;
begin
  insert into private.admin_users(username,password_hash) values('__reads_unit__',h) returning id into u;
  insert into private.admin_sessions(token_hash,user_id,user_version) values(repeat('e',64),u,1);
  insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,source_path,city,privacy_consent,privacy_version,created_at)
    values('nature','Read state unit fixture','read-unit@example.invalid','+56912345678','whatsapp','/naturaleza','Santiago',true,'2026-10-23-contact-v3','2097-01-01T12:00:00Z') returning id into i;
  result := public.admin_access('mark_read',jsonb_build_object('token_hash',repeat('f',64),'id',i));
  assert result->>'status'='unauthorized';
  assert not exists(select 1 from private.admin_interest_reads where interest_id=i);
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('e',64),'reading','unread','start','2097-01-01T00:00:00Z','end','2097-01-02T00:00:00Z'));
  assert (result->'summary'->>'new')::integer=1;
  result := public.admin_access('mark_read',jsonb_build_object('token_hash',repeat('e',64),'id',i));
  assert result->>'status'='ready';
  first_read := result->>'read_at';
  assert first_read is not null;
  assert exists(select 1 from private.admin_interest_reads where interest_id=i and read_by=u);
  assert (select management_status='new' from public.interest_registrations where id=i);
  result := public.admin_access('mark_read',jsonb_build_object('token_hash',repeat('e',64),'id',i));
  assert result->>'read_at'=first_read, 'retries preserve the first read date';
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('e',64),'reading','unread','start','2097-01-01T00:00:00Z','end','2097-01-02T00:00:00Z'));
  assert (result->'summary'->>'new')::integer=0;
  assert jsonb_array_length(result->'items')=0;
  result := public.admin_access('interests',jsonb_build_object('token_hash',repeat('e',64),'reading','read','start','2097-01-01T00:00:00Z','end','2097-01-02T00:00:00Z'));
  assert (result->'summary'->>'read')::integer=1;
  assert result->'items'->0->>'id'=i::text;
  result := public.admin_access('detail',jsonb_build_object('token_hash',repeat('e',64),'id',i));
  assert result->'record'->>'read_at'=first_read;
  result := public.admin_access('mark_read',jsonb_build_object('token_hash',repeat('e',64),'id',gen_random_uuid()));
  assert result->>'status'='not_found';
  assert not has_table_privilege('anon','private.admin_interest_reads','insert');
  assert not has_table_privilege('authenticated','private.admin_interest_reads','select');
end $$;
select 'admin_reads_unit_passed' as result;
rollback;
