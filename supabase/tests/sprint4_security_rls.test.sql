begin;

create extension if not exists pgtap with schema extensions;
select plan(40);

-- Fixtures are transaction-local and are rolled back by this test file.
insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'sprint4-athlete@example.test'),
  ('20000000-0000-4000-8000-000000000001', 'sprint4-guardian@example.test'),
  ('30000000-0000-4000-8000-000000000001', 'sprint4-scout-pending@example.test'),
  ('30000000-0000-4000-8000-000000000002', 'sprint4-scout-vetted@example.test'),
  ('40000000-0000-4000-8000-000000000001', 'sprint4-admin@example.test'),
  ('50000000-0000-4000-8000-000000000001', 'sprint4-outsider@example.test');

insert into public.profiles (user_id, role, status, first_name, last_name)
values
  ('10000000-0000-4000-8000-000000000001', 'player', 'active', 'Ama', 'Mensah'),
  ('20000000-0000-4000-8000-000000000001', 'guardian', 'active', 'Kofi', 'Mensah'),
  ('30000000-0000-4000-8000-000000000001', 'scout', 'active', 'Pending', 'Scout'),
  ('30000000-0000-4000-8000-000000000002', 'scout', 'active', 'Vetted', 'Scout'),
  ('40000000-0000-4000-8000-000000000001', 'admin', 'active', 'Test', 'Admin'),
  ('50000000-0000-4000-8000-000000000001', 'scout', 'active', 'Outside', 'Scout');

insert into public.player_profiles (
  user_id, sport, region, primary_position, secondary_position,
  dominant_side, experience_level, years_playing, bio, goals
) values (
  '10000000-0000-4000-8000-000000000001', 'football', 'Greater Accra',
  'forward', 'winger', 'right', 'academy', 4, 'Quick forward', 'Earn a scholarship'
);

insert into public.player_private_details (
  user_id, date_of_birth, gender, district, community, school,
  jersey_number, height_cm, weight_kg
) values (
  '10000000-0000-4000-8000-000000000001', '2009-05-14', 'female',
  'Ayawaso North', 'Nima', 'Demo Academy', 9, 165, 55
);

insert into public.guardian_profiles (
  user_id, relationship, phone, region, address,
  emergency_contact_name, emergency_contact_phone
) values (
  '20000000-0000-4000-8000-000000000001', 'parent', '+233 24 000 0000',
  'Greater Accra', 'Private address', 'Emergency Contact', '+233 20 000 0000'
);

insert into public.scout_profiles (
  user_id, date_of_birth, phone, organisation, scout_role, affiliation_type,
  reference_name, reference_contact, vetting_status
) values
  ('30000000-0000-4000-8000-000000000001', '1985-01-01', '+233 24 000 0001',
   'Pending FC', 'scout', 'club-academy', 'Reference One', 'ref1@example.test', 'pending'),
  ('30000000-0000-4000-8000-000000000002', '1980-01-01', '+233 24 000 0002',
   'Vetted FC', 'scout', 'club-academy', 'Reference Two', 'ref2@example.test', 'approved'),
  ('50000000-0000-4000-8000-000000000001', '1988-01-01', '+233 24 000 0003',
   'Outside FC', 'scout', 'independent', 'Reference Three', 'ref3@example.test', 'pending');

insert into public.consent_records (
  actor_user_id, subject_user_id, consent_type, decision, consent_version
) values (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'profile_discovery', 'granted', 'v1'
);

-- The athlete can read their own sensitive details but cannot self-approve status.
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.profiles where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'a user can read their own account profile'
);
select is(
  (select count(*) from public.player_private_details where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an athlete can read their own private details'
);
select throws_ok(
  $$update public.profiles set status = 'rejected' where user_id = '10000000-0000-4000-8000-000000000001'$$,
  '42501', null,
  'an athlete cannot update their own lifecycle status'
);

-- An unvetted scout cannot query athlete rows, even if discovery consent exists.
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000001';
select is_empty(
  $$select * from public.scout_discoverable_players$$,
  'an unvetted scout cannot see the discoverable-player view'
);
select is_empty(
  $$select * from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'an unvetted scout cannot query player profile rows directly'
);
select is_empty(
  $$select * from public.player_private_details where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'a scout cannot read private athlete details'
);

-- A vetted scout sees only the allowlisted discovery data, never the private table.
set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000002';
select is(
  (select count(*) from public.scout_discoverable_players where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'a vetted scout can read a player who granted discovery consent'
);
select is(
  (select count(*) from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'a vetted scout can read only the minimized player-profile row'
);

-- The guardian can request a link, but private athlete data stays hidden until
-- the athlete approves the request.
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
select lives_ok(
  $$insert into public.guardian_player_links (player_user_id)
    values ('10000000-0000-4000-8000-000000000001')$$,
  'a guardian can create a pending link request'
);
select is(
  (select count(*) from public.guardian_player_links
   where guardian_user_id = '20000000-0000-4000-8000-000000000001'
     and player_user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'a guardian can read their own link request'
);
select is_empty(
  $$select * from public.player_private_details where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'a guardian cannot read athlete private data before approval'
);
select is_empty(
  $$select * from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'a guardian cannot read athlete profile data before approval'
);
select is_empty(
  $$select * from public.profiles where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'a guardian cannot read athlete identity before approval'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.guardian_player_links
   where player_user_id = '10000000-0000-4000-8000-000000000001'
     and status = 'pending'),
  1::bigint,
  'an athlete can see incoming guardian requests'
);
select lives_ok(
  $$update public.guardian_player_links set status = 'approved'
    where player_user_id = '10000000-0000-4000-8000-000000000001'
      and guardian_user_id = '20000000-0000-4000-8000-000000000001'$$,
  'the athlete can approve a pending link request'
);

set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.player_private_details where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an approved guardian can read linked athlete private details'
);
select is(
  (select count(*) from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an approved guardian can read the linked athlete profile'
);
select is(
  (select count(*) from public.profiles where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an approved guardian can read the linked athlete identity'
);
select lives_ok(
  $$insert into public.consent_records (
      actor_user_id, subject_user_id, consent_type, decision, consent_version
    ) values (
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'profile_discovery', 'withdrawn', 'v2'
    )$$,
  'an approved guardian can withdraw delegated discovery consent'
);

set local request.jwt.claim.sub = '30000000-0000-4000-8000-000000000002';
select is_empty(
  $$select * from public.scout_discoverable_players where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'a later consent withdrawal immediately removes the scout-visible profile'
);

set local request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';
select lives_ok(
  $$update public.guardian_player_links set status = 'revoked'
    where player_user_id = '10000000-0000-4000-8000-000000000001'
      and guardian_user_id = '20000000-0000-4000-8000-000000000001'$$,
  'an athlete can revoke an approved guardian link'
);
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
select is_empty(
  $$select * from public.player_private_details where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'revoking a guardian link removes private-data access'
);
select is_empty(
  $$select * from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'$$,
  'revoking a guardian link removes athlete-profile access'
);

-- Active admins have cross-role read access, but status changes go through
-- guarded RPCs and produce immutable audit entries.
set local request.jwt.claim.sub = '40000000-0000-4000-8000-000000000001';
select is(
  (select count(*) from public.player_profiles where user_id = '10000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an active admin can read player profiles'
);
select lives_ok(
  $$select public.admin_set_profile_status(
      '10000000-0000-4000-8000-000000000001', 'reviewed'
    )$$,
  'an active admin can change profile lifecycle status through the guarded RPC'
);
select is(
  (select count(*) from public.audit_logs
   where entity_type = 'profile'
     and entity_id = '10000000-0000-4000-8000-000000000001'
     and action = 'profile_status_changed'),
  1::bigint,
  'profile status changes are audited'
);
select lives_ok(
  $$select public.admin_set_scout_vetting_status(
      '30000000-0000-4000-8000-000000000001', 'approved'
    )$$,
  'an active admin can approve a scout through the guarded RPC'
);
select is(
  (select count(*) from public.audit_logs
   where entity_type = 'scout_profile'
     and entity_id = '30000000-0000-4000-8000-000000000001'
     and action = 'scout_vetting_changed'),
  1::bigint,
  'scout vetting decisions are audited'
);
select is(
  (select count(*) from public.audit_logs
   where entity_type = 'guardian_player_link'
     and action = 'guardian_link_status_changed'),
  2::bigint,
  'guardian link approval and revocation are audited'
);
select is(
  (select count(*) from public.audit_logs
   where entity_type = 'consent_record'
     and action = 'consent_recorded'),
  2::bigint,
  'self and delegated consent decisions are audited'
);
select lives_ok(
  $$insert into public.events (title, category, location, starts_at, status)
    values ('Sprint 4 Published Event', 'camp', 'Accra', now() + interval '7 days', 'published')$$,
  'an active admin can publish an event'
);
select lives_ok(
  $$insert into public.events (title, category, location, starts_at, status)
    values ('Sprint 4 Draft Event', 'camp', 'Accra', now() + interval '14 days', 'draft')$$,
  'an active admin can create a draft event'
);
select lives_ok(
  $$update public.events set status = 'cancelled' where title = 'Sprint 4 Draft Event'$$,
  'an active admin can change event status'
);
select is(
  (select count(*) from public.audit_logs
   where entity_type = 'event' and action = 'event_status_changed'),
  1::bigint,
  'event status changes are audited'
);
select is(
  (select count(*) from public.events),
  2::bigint,
  'an active admin can read published and draft events'
);

set local role anon;
select is(
  (select count(*) from public.events),
  1::bigint,
  'anonymous users can read published events but not drafts'
);
select throws_ok(
  $$select * from public.audit_logs$$,
  '42501', null,
  'anonymous users cannot read audit logs'
);

set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-4000-8000-000000000001';
select throws_ok(
  $$insert into public.events (title, category, location, starts_at)
    values ('Unauthorized Event', 'camp', 'Accra', now() + interval '21 days')$$,
  '42501', null,
  'a non-admin cannot create events'
);
select throws_ok(
  $$select public.admin_set_profile_status(
      '10000000-0000-4000-8000-000000000001', 'rejected'
    )$$,
  '42501', null,
  'a non-admin cannot change another account status through the RPC'
);
select is_empty(
  $$select * from public.audit_logs$$,
  'a non-admin cannot read audit logs'
);

select * from finish();
rollback;
