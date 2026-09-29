-- Sprout Squad · notifications
--
-- Push goes out from two edge functions (supabase/functions):
--   notify   called by the app right after you send a kudo, a note or start a session.
--            It checks the row really exists, then pushes to the other person/people.
--   nudges   called hourly by pg_cron. At 6pm in each person's own time zone, it tells
--            them about squadmates who have gone quiet for 3+ days (once per quiet stretch).
-- The evening "what did you get done?" reminder is scheduled on the phone, not here.
-- Setup steps: docs/NOTIFICATIONS.md.

-- ---------- preferences (on the profile, so the server can respect them) ----------
alter table public.profiles
  add column tz              text check (tz is null or char_length(tz) <= 64),
  add column notify_kudos    boolean not null default true,
  add column notify_nudges   boolean not null default true,
  add column notify_sessions boolean not null default true;

-- ---------- push tokens (one row per device) ----------
create table public.push_tokens (
  token      text primary key check (char_length(token) <= 200),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  platform   text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
-- No policies: the app goes through the two functions below; only the server reads tokens.

-- A device can change hands (sign out, sign in as someone else), so registering
-- moves the token to whoever is signed in now.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
end;
$$;

create function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;

-- ---------- de-duplication for instant pushes (kudo/note/session) ----------
create table public.push_log (
  key     text primary key,
  sent_at timestamptz not null default now()
);
alter table public.push_log enable row level security; -- server only

-- ---------- quiet-friend nudges ----------
create table public.nudge_log (
  recipient  uuid not null references public.profiles (id) on delete cascade,
  about_user uuid not null references public.profiles (id) on delete cascade,
  sent_on    date not null,
  primary key (recipient, about_user, sent_on)
);
alter table public.nudge_log enable row level security; -- server only

-- Who should hear about which quiet squadmate right now: recipients whose local time is
-- 6pm, about squadmates whose last entry is 3+ days before the recipient's today, and
-- only if we haven't nudged about that person since their last entry.
create function public.nudge_candidates()
returns table (recipient uuid, friend uuid, friend_name text, last_day date)
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select p.id, (now() at time zone p.tz)::date as local_day
    from public.profiles p
    where p.notify_nudges
      and p.tz in (select name from pg_catalog.pg_timezone_names)
      and extract(hour from now() at time zone p.tz) = 18
  ),
  pairs as (
    select distinct r.id as recipient, r.local_day, theirs.user_id as friend
    from r
    join public.squad_members mine on mine.user_id = r.id
    join public.squad_members theirs on theirs.squad_id = mine.squad_id and theirs.user_id <> r.id
  ),
  last as (
    select user_id, max(done_on) as d from public.entries group by user_id
  )
  select pr.recipient, pr.friend, coalesce(nullif(fp.display_name, ''), 'A squadmate'), l.d
  from pairs pr
  join last l on l.user_id = pr.friend           -- people who've never logged aren't "quiet"
  join public.profiles fp on fp.id = pr.friend
  where l.d <= pr.local_day - 3
    and not exists (
      select 1 from public.nudge_log n
      where n.recipient = pr.recipient and n.about_user = pr.friend and n.sent_on > l.d
    )
$$;

revoke execute on function public.nudge_candidates() from public, anon, authenticated;
grant execute on function public.nudge_candidates() to service_role;
