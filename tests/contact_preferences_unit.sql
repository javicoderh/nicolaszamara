-- Run after the current schema inside BEGIN / ROLLBACK. No retained contacts.
set local role anon;
do $$
declare
  chosen text;
  kind text;
begin
  foreach kind in array array['online','nature'] loop
    foreach chosen in array array['video_call','phone','whatsapp'] loop
      insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,source_path,country,city,privacy_consent,privacy_version)
      values(kind,'Contact preference fixture',kind||'-'||chosen||'@example.invalid',
        case chosen when 'video_call' then '+56911111111' when 'phone' then '+56922222222' else '+56933333333' end,
        chosen,case when kind='online' then '/cursos' else '/' end,
        case when kind='online' then 'Chile' end,case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
    end loop;
    foreach chosen in array array['video_call','phone','whatsapp'] loop
      begin
        insert into public.interest_registrations(interest,full_name,phone,contact_preference,country,city,privacy_consent,privacy_version)
        values(kind,'Missing email fixture','+56955555555',chosen,
          case when kind='online' then 'Chile' end,case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
        raise exception 'Expected missing email to be rejected';
      exception when check_violation then null; end;
    end loop;
    begin
      insert into public.interest_registrations(interest,full_name,email,country,city,privacy_consent,privacy_version)
      values(kind,'Contact preference fixture','missing@example.invalid',case when kind='online' then 'Chile' end,
        case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
      raise exception 'Expected missing contact details to be rejected';
    exception when check_violation then null; end;
    begin
      insert into public.interest_registrations(interest,full_name,email,phone,country,city,privacy_consent,privacy_version)
      values(kind,'Contact preference fixture','missing-preference@example.invalid','+56944444444',
        case when kind='online' then 'Chile' end,case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
      raise exception 'Expected missing preference to be rejected';
    exception when check_violation then null; end;
    begin
      insert into public.interest_registrations(interest,full_name,email,contact_preference,country,city,privacy_consent,privacy_version)
      values(kind,'Contact preference fixture','missing-phone@example.invalid','whatsapp',
        case when kind='online' then 'Chile' end,case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
      raise exception 'Expected missing phone to be rejected';
    exception when check_violation then null; end;
    begin
      insert into public.interest_registrations(interest,full_name,email,phone,contact_preference,country,city,privacy_consent,privacy_version)
      values(kind,'Contact preference fixture','invalid@example.invalid','912345678','whatsapp',
        case when kind='online' then 'Chile' end,case when kind='nature' then 'Santiago' end,true,'2026-10-23-contact-v3');
      raise exception 'Expected invalid contact details to be rejected';
    exception when check_violation then null; end;
  end loop;
  assert not has_column_privilege('anon','public.interest_registrations','created_at','INSERT'), 'cannot forge creation dates';
  assert not has_table_privilege('anon','public.interest_registrations','SELECT'), 'no public read access';
end;
$$;
reset role;
