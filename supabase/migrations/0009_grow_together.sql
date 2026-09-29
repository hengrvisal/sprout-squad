-- Sprout Squad · grow together
--
-- A focus session anyone in a squad can start (25, 50 or 90 min). The squad gets a push
-- (notify edge function) and can join. One session at a time per squad: starting while one
-- is running just joins it. Everything goes through RPCs; the tables are read-only to the app.
--
-- Plant bonus: on a day a member logs a valid win while in a session that 2+ people joined,
-- they add +0.5 to the squad's raw growth (once per member per day). squad_day_growth is
-- replaced below with that one extra term; everything else is unchanged from 0006.

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  squad_id   uuid not null references public.squads (id) on delete cascade,
  host       uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title      text check (title is null or char_length(btrim(title)) between 1 and 60),
  started_at timestamptz not null default now(),
  ends_at    timestamptz not null,
  check (ends_at >= started_at and ends_at <= started_at + interval '3 hours')
);

create index sessions_squad_live on public.sessions (squad_id, ends_at desc);

create table public.session_members (
  session_id uuid not null references public.sessions (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  left_at    timestamptz,
  primary key (session_id, user_id)
);

create index session_members_user on public.session_members (user_id);

alter table public.sessions enable row level security;
alter table public.session_members enable row level security;

create policy "sessions: read my squads'" on public.sessions
  for select using (squad_id in (select public.my_squad_ids()));

create policy "session_members: read my squads'" on public.session_members
  for select using (session_id in (select s.id from public.sessions s where s.squad_id in (select public.my_squad_ids())));

-- live updates for the Squad tab and the session screen (RLS still applies)
alter publication supabase_realtime add table public.sessions, public.session_members;

-- ---------- RPCs ----------
create function public.start_session(p_squad uuid, p_minutes int, p_title text default null)
returns public.sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.sessions;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not exists (select 1 from public.squad_members where squad_id = p_squad and user_id = auth.uid()) then
    raise exception 'not_in_squad';
  end if;
  if p_minutes not in (25, 50, 90) then raise exception 'bad_length'; end if;

  select * into s from public.sessions
  where squad_id = p_squad and ends_at > now()
  order by started_at desc limit 1
  for update;
  if not found then
    insert into public.sessions (squad_id, host, title, ends_at)
    values (p_squad, auth.uid(), nullif(btrim(coalesce(p_title, '')), ''), now() + make_interval(mins => p_minutes))
    returning * into s;
  end if;
  insert into public.session_members (session_id, user_id) values (s.id, auth.uid())
  on conflict (session_id, user_id) do update set left_at = null;
  return s;
end;
$$;

create function public.join_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.sessions s
    join public.squad_members m on m.squad_id = s.squad_id and m.user_id = auth.uid()
    where s.id = p_session and s.ends_at > now()
  ) then
    raise exception 'session_not_found';
  end if;
  insert into public.session_members (session_id, user_id) values (p_session, auth.uid())
  on conflict (session_id, user_id) do update set left_at = null;
end;
$$;

-- Leaving; if nobody is left, the session ends.
create function public.leave_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.session_members set left_at = now()
  where session_id = p_session and user_id = auth.uid() and left_at is null;
  if not exists (select 1 from public.session_members where session_id = p_session and left_at is null) then
    update public.sessions set ends_at = now()
    where id = p_session and ends_at > now();
  end if;
end;
$$;

-- The host can end it for everyone.
create function public.end_session(p_session uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.sessions set ends_at = now()
  where id = p_session and host = auth.uid() and ends_at > now();
$$;

revoke execute on function public.start_session(uuid, int, text) from public, anon;
revoke execute on function public.join_session(uuid) from public, anon;
revoke execute on function public.leave_session(uuid) from public, anon;
revoke execute on function public.end_session(uuid) from public, anon;

-- ---------- plant: the together bonus ----------
create or replace function public.squad_day_growth(p_squad uuid, p_from date, p_to date)
returns table (day date, members int, active int, raw numeric, growth numeric, full_day boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (
    select user_id, joined_at::date as joined
    from public.squad_members where squad_id = p_squad
  ),
  valid as (
    -- one row per distinct (member, day, text); ranked in the order they were logged
    select e.user_id, e.done_on,
           row_number() over (partition by e.user_id, e.done_on order by min(e.created_at)) as rn
    from public.entries e
    join m on m.user_id = e.user_id
    where e.done_on between greatest(p_from, m.joined) and p_to
      and char_length(btrim(e.text)) >= 3
    group by e.user_id, e.done_on, lower(btrim(e.text))
  ),
  member_day as (
    select user_id, done_on,
           sum(case rn when 1 then 1.0 when 2 then 0.5 when 3 then 0.25 else 0 end) as pts
    from valid group by user_id, done_on
  ),
  kudos_day as (
    select k.to_user as user_id, k.done_on, least(count(*) * 0.25, 1.0) as pts
    from public.kudos k
    join m rcv on rcv.user_id = k.to_user
    join m snd on snd.user_id = k.from_user
    where k.done_on between greatest(p_from, rcv.joined) and p_to
    group by k.to_user, k.done_on
  ),
  shared as (
    select s.id, s.ends_at from public.sessions s
    where s.squad_id = p_squad
      and (select count(*) from public.session_members x where x.session_id = s.id) >= 2
  ),
  together_day as (
    -- a win logged while in a shared session (10 min grace after it ends): +0.5, once a day
    select distinct e.user_id, e.done_on, 0.5::numeric as pts
    from public.entries e
    join m on m.user_id = e.user_id
    join public.session_members sm on sm.user_id = e.user_id
    join shared s on s.id = sm.session_id
    where e.done_on between greatest(p_from, m.joined) and p_to
      and char_length(btrim(e.text)) >= 3
      and e.created_at >= sm.joined_at
      and e.created_at <= least(coalesce(sm.left_at, s.ends_at), s.ends_at) + interval '10 minutes'
  ),
  days as (
    select d::date as day
    from generate_series(greatest(p_from, (select min(joined) from m)), p_to, interval '1 day') d
  ),
  stats as (
    select d.day,
           (select count(*) from m where m.joined <= d.day)::int as members,
           (select count(*) from member_day md where md.done_on = d.day)::int as active,
           coalesce((select sum(pts) from member_day md where md.done_on = d.day), 0)
             + coalesce((select sum(pts) from kudos_day kd where kd.done_on = d.day), 0)
             + coalesce((select sum(pts) from together_day td where td.done_on = d.day), 0) as raw
    from days d
  )
  select day, members, active, raw,
         round(raw * (1 + 0.5 * active::numeric / greatest(members, 1))
               + case when members >= 2 and active = members then 2 else 0 end, 2) as growth,
         (members >= 2 and active = members) as full_day
  from stats
$$;
