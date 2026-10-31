-- Hosted verification only. All synthetic users/profile changes are rolled back.
begin;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
set local role authenticated;
do $$
declare n integer;
begin
 select count(*) into n from public.profiles;
 if n <> 1 then raise exception 'RLS failed: expected one own profile'; end if;
 update public.profiles set username='fm_check_alice',display_name='Synthetic test' where id=auth.uid();
 update public.profiles set display_name='Unauthorized test' where id='22222222-2222-4222-8222-222222222222';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'RLS failed: cross-user update allowed'; end if;
 begin
   update public.profiles set id='22222222-2222-4222-8222-222222222222' where id=auth.uid();
   raise exception 'Grant failed: client could change identity';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
set local role authenticated;
do $$
begin
 begin
   update public.profiles set username='fm_check_alice' where id=auth.uid();
   raise exception 'Uniqueness failed: duplicate username allowed';
 exception when unique_violation then null;
 end;
 begin
   update public.profiles set username='admin' where id=auth.uid();
   raise exception 'Constraint failed: reserved username allowed';
 exception when check_violation then null;
 end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$
declare n integer;
begin
 begin
   perform 1 from public.profiles;
   raise exception 'Grant failed: anon can read private profiles';
 exception when insufficient_privilege then null;
 end;
 select count(*) into n from public.lookup_username(' FM_CHECK_ALICE ');
 if n <> 1 then raise exception 'Public username lookup failed'; end if;
end $$;
reset role;
rollback;
select 'PASS: hosted RLS, ownership, column grants, unique/reserved names and public lookup' as verification,
 (select count(*) from auth.users) as remaining_auth_users,
 (select count(*) from public.profiles) as remaining_profiles;
