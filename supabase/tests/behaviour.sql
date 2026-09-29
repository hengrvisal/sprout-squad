\set ON_ERROR_STOP 1
\pset tuples_only on
\pset format unaligned
-- helper: run SQL as a user, return 'ok' or the error text
create or replace function t_as(uid uuid, q text) returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  execute 'set local role authenticated';
  begin execute q; exception when others then execute 'reset role'; return 'ERR ' || sqlerrm; end;
  execute 'reset role';
  return 'ok';
end $$;
create or replace function t_val(uid uuid, q text) returns text language plpgsql as $$
declare v text;
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  execute 'set local role authenticated';
  begin execute q into v; exception when others then execute 'reset role'; return 'ERR ' || sqlerrm; end;
  execute 'reset role';
  return v;
end $$;
create or replace function t_check(name text, got text, want text) returns text language sql as $$
  select case when got is not distinct from want then 'PASS ' else 'FAIL ' end || name || case when got is distinct from want then '  (got: ' || coalesce(got,'null') || ', want: ' || want || ')' else '' end
$$;

insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-00000000000a','a@x'),('00000000-0000-0000-0000-00000000000b','b@x'),
 ('00000000-0000-0000-0000-00000000000c','c@x'),('00000000-0000-0000-0000-00000000000d','d@x');
update profiles set display_name = upper(right(id::text,1));
\set A '''00000000-0000-0000-0000-00000000000a'''
\set B '''00000000-0000-0000-0000-00000000000b'''
\set C '''00000000-0000-0000-0000-00000000000c'''
\set D '''00000000-0000-0000-0000-00000000000d'''

-- squad: A creates, B and D join, C is an outsider
select t_as(:A, $$select create_squad('Uni crew')$$);
select t_as(:B, format('select join_squad(%L)', (select invite_code from squads limit 1)));
select t_as(:D, format('select join_squad(%L)', (select invite_code from squads limit 1)));

\echo '--- plans'
select t_check('A adds 3 plans', t_as(:A, $$insert into plans (text, done_on) values ('one', current_date), ('two', current_date), ('three', current_date)$$), 'ok');
select t_check('4th plan refused', t_as(:A, $$insert into plans (text, done_on) values ('four', current_date)$$), 'ERR too_many_plans');
select t_check('plan dated last week refused', t_as(:A, $$insert into plans (text, done_on) values ('old', current_date - 7)$$), 'ERR entry_date_out_of_range');
select t_check('squadmate B sees A''s plans', t_val(:B, $$select count(*)::text from plans$$), '3');
select t_check('outsider C sees none', t_val(:C, $$select count(*)::text from plans$$), '0');
select t_as(:B, $$insert into entries (text, category, done_on) values ('B stuff', 'study', current_date)$$);
select t_check('A can''t tick off with B''s entry', t_as(:A, $$update plans set entry_id = (select id from entries where text = 'B stuff') where text = 'one'$$), 'ERR plan_entry_not_yours');
select t_as(:A, $$insert into entries (text, category, done_on) values ('one', 'study', current_date)$$);
select t_check('A ticks off with own entry', t_as(:A, $$update plans set entry_id = (select id from entries where text = 'one' and user_id = auth.uid()) where text = 'one'$$), 'ok');
select t_check('A can''t move a plan to another day', t_as(:A, $$update plans set done_on = current_date - 1$$), 'ERR permission denied for table plans');
select t_check('B can''t edit A''s plan', t_val(:B, $$with u as (update plans set text = 'hacked' returning 1) select count(*)::text from u$$), '0');
select t_as(:A, $$delete from entries where text = 'one'$$);
select t_check('deleting the entry unticks the plan', (select coalesce(entry_id::text,'null') from plans where text = 'one'), 'null');

\echo '--- kudo notes'
select t_check('A notes B', t_as(:A, format($$insert into kudo_notes (to_user, done_on, note) values (%L, current_date, 'proud of you')$$, :B)), 'ok');
select t_check('upsert edits it (app path)', t_as(:A, format($$insert into kudo_notes (from_user, to_user, done_on, note) values (%L, %L, current_date, 'so proud') on conflict (from_user, to_user, done_on) do update set from_user = excluded.from_user, to_user = excluded.to_user, done_on = excluded.done_on, note = excluded.note$$, :A, :B)), 'ok');
select t_check('B reads it', t_val(:B, $$select note from kudo_notes$$), 'so proud');
select t_check('D (same squad) can''t read it', t_val(:D, $$select count(*)::text from kudo_notes$$), '0');
select t_check('outsider C can''t send', t_as(:C, format($$insert into kudo_notes (to_user, done_on, note) values (%L, current_date, 'hi')$$, :A)), 'ERR new row violates row-level security policy for table "kudo_notes"');
select t_check('can''t note yourself', (t_as(:A, format($$insert into kudo_notes (to_user, done_on, note) values (%L, current_date, 'me')$$, :A)) like 'ERR%')::text, 'true');

\echo '--- push tokens'
select t_as(:A, $$select register_push_token('ExponentPushToken[1]', 'ios')$$);
select t_check('token belongs to A', (select user_id::text from push_tokens), '00000000-0000-0000-0000-00000000000a');
select t_as(:B, $$select register_push_token('ExponentPushToken[1]', 'ios')$$);
select t_check('same phone, B signs in: token moves', (select user_id::text from push_tokens), '00000000-0000-0000-0000-00000000000b');
select t_check('app can''t read tokens directly', t_val(:B, $$select count(*)::text from push_tokens$$), '0');
select t_as(:A, $$select unregister_push_token('ExponentPushToken[1]')$$);
select t_check('A can''t unregister B''s token', (select count(*)::text from push_tokens), '1');
select t_check('app can''t call nudge_candidates', (t_val(:A, $$select count(*)::text from nudge_candidates()$$) like 'ERR permission denied%')::text, 'true');

\echo '--- nudges'
-- make it 6pm for A, and B quiet for 4 days (bypass the no-backdating trigger as admin)
update profiles set tz = (select name from pg_timezone_names where extract(hour from now() at time zone name) = 18 and name like '%/%' limit 1) where id = :A;
delete from entries where user_id = :B;
alter table entries disable trigger entries_check_day;
insert into entries (user_id, text, category, done_on) values (:B, 'old win', 'study', (now() at time zone (select tz from profiles where id = :A))::date - 4);
insert into entries (user_id, text, category, done_on) values (:D, 'recent', 'study', (now() at time zone (select tz from profiles where id = :A))::date - 1);
alter table entries enable trigger entries_check_day;
select t_check('A hears about quiet B only (D logged yesterday, C not in squad)', (select string_agg(friend_name, ',') from nudge_candidates() where recipient = :A), 'B');
insert into nudge_log select recipient, friend, current_date from nudge_candidates();
select t_check('only once per quiet stretch', (select count(*)::text from nudge_candidates() where recipient = :A), '0');
update profiles set notify_nudges = false where id = :A;
delete from nudge_log;
select t_check('respects the nudges switch', (select count(*)::text from nudge_candidates() where recipient = :A), '0');

\echo '--- grow together'
delete from entries; delete from kudos;
select t_check('bad length refused', t_as(:A, format('select start_session(%L, 30)', (select id from squads))), 'ERR bad_length');
select t_check('outsider can''t start', t_as(:C, format('select start_session(%L, 25)', (select id from squads))), 'ERR not_in_squad');
select t_as(:A, format($$select start_session(%L, 25, 'Assignment 2')$$, (select id from squads)));
select t_as(:B, format('select start_session(%L, 50)', (select id from squads)));
select t_check('second start joins the running session', (select count(*)::text from sessions) || '/' || (select count(*)::text from session_members), '1/2');
select t_check('outsider C can''t see it', t_val(:C, $$select count(*)::text from sessions$$), '0');
select t_check('outsider C can''t join', t_as(:C, format('select join_session(%L)', (select id from sessions))), 'ERR session_not_found');
select t_as(:A, $$insert into entries (text, category, done_on) values ('lab report', 'study', current_date)$$);
select t_as(:B, $$insert into entries (text, category, done_on) values ('gym', 'move', current_date)$$);
-- two members active (1.0 each) + together bonus (0.5 each) = 3.0 raw; D inactive
select t_check('plant raw today includes together bonus', t_val(:A, format('select raw::text from squad_day_growth(%L, current_date, current_date)', (select id from squads))), '3.0');
select t_check('D (same squad) sees the same growth', t_val(:D, format('select raw::text from squad_day_growth(%L, current_date, current_date)', (select id from squads))), '3.0');
select t_as(:B, format('select end_session(%L)', (select id from sessions)));
select t_check('non-host can''t end it', (select (ends_at > now())::text from sessions), 'true');
select t_as(:A, format('select leave_session(%L)', (select id from sessions)));
select t_check('still running while B is in', (select (ends_at > now())::text from sessions), 'true');
select t_as(:B, format('select leave_session(%L)', (select id from sessions)));
select t_check('ends when the last person leaves', (select (ends_at <= now())::text from sessions), 'true');
select t_check('squad_plant still runs end to end', t_val(:A, format('select (squad_plant(%L, current_date)->>''growth'') is not null', (select id from squads))), 'true');
select t_check('tables in realtime publication', (select string_agg(tablename, ',' order by tablename) from pg_publication_tables where pubname = 'supabase_realtime'), 'session_members,sessions');
