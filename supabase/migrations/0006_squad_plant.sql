-- Sprout Squad · the squad plant
--
-- Growth (all-time, only goes up) and health (last 7 days) are computed on the server
-- from entries + kudos, so nothing about the plant can be faked from the app.
--
-- Per member per day:     1st valid entry 1.0, 2nd 0.5, 3rd 0.25, more 0
--                         + 0.25 per kudo received from a squadmate (max 1.0)
-- Per squad per day:      sum × (1 + 0.5 × share of members active)
--                         + 2 on a full squad day (everyone logged, 2+ members)
-- Per week (Mon–Sun):     +20% of that week's growth if the weekly goal was met
-- A valid entry:          3+ characters, not a same-day repeat of the same text,
--                         logged on or after the day the member joined the squad.

-- ---------- no backdating ----------
-- The app writes the user's local date. Allow today and yesterday in any timezone
-- (hence the slack around the server's UTC date), nothing older, nothing in the future.
create function public.entries_check_day()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done_on < (now() at time zone 'utc')::date - 2
     or new.done_on > (now() at time zone 'utc')::date + 1 then
    raise exception 'entry_date_out_of_range';
  end if;
  return new;
end;
$$;

create trigger entries_check_day
  before insert or update of done_on on public.entries
  for each row execute function public.entries_check_day();

-- ---------- daily growth ----------
create function public.squad_day_growth(p_squad uuid, p_from date, p_to date)
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
  days as (
    select d::date as day
    from generate_series(greatest(p_from, (select min(joined) from m)), p_to, interval '1 day') d
  ),
  stats as (
    select d.day,
           (select count(*) from m where m.joined <= d.day)::int as members,
           (select count(*) from member_day md where md.done_on = d.day)::int as active,
           coalesce((select sum(pts) from member_day md where md.done_on = d.day), 0)
             + coalesce((select sum(pts) from kudos_day kd where kd.done_on = d.day), 0) as raw
    from days d
  )
  select day, members, active, raw,
         round(raw * (1 + 0.5 * active::numeric / greatest(members, 1))
               + case when members >= 2 and active = members then 2 else 0 end, 2) as growth,
         (members >= 2 and active = members) as full_day
  from stats
$$;

-- ---------- weekly goal ----------
-- Rotates by week so every squad gets variety; the squad id offsets it so squads differ.
create function public.squad_week_goal(p_squad uuid, p_week date, p_today date)
returns table (kind text, label text, target int, progress int)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  n int;
  pick int;
  week_end date := least(p_week + 6, p_today);
  cats text[] := array['study','work','build','move','home','create'];
  cat_labels text[] := array['Study','Work','Build','Move','Home','Create'];
  cat int;
begin
  select count(*) into n from public.squad_members where squad_id = p_squad and joined_at::date <= p_week + 6;
  n := greatest(n, 1);
  pick := (extract(week from p_week)::int + abs(hashtext(p_squad::text))) % 4;
  if pick = 1 and n < 2 then pick := 0; end if;  -- full squad days need a squad

  if pick = 0 then
    kind := 'days'; target := 4 * n;
    label := case when n = 1 then 'Log something on 4 days this week'
                  else 'Everyone logs something on 4 days this week' end;
    select coalesce(sum(least(d, 4)), 0) into progress from (
      select count(distinct e.done_on) as d
      from public.entries e join public.squad_members sm on sm.user_id = e.user_id and sm.squad_id = p_squad
      where e.done_on between p_week and week_end and char_length(btrim(e.text)) >= 3
      group by e.user_id) x;
  elsif pick = 1 then
    kind := 'full_days'; target := 2; label := '2 full squad days this week';
    select count(*) into progress from public.squad_day_growth(p_squad, p_week, week_end) g where g.full_day;
  elsif pick = 2 then
    cat := 1 + (extract(week from p_week)::int + abs(hashtext(p_squad::text || 'c'))) % 6;
    kind := 'category'; target := greatest(3, 2 * n);
    label := target || ' ' || cat_labels[cat] || ' wins between you';
    select count(*) into progress
    from public.entries e join public.squad_members sm on sm.user_id = e.user_id and sm.squad_id = p_squad
    where e.done_on between p_week and week_end and e.category = cats[cat] and char_length(btrim(e.text)) >= 3;
  else
    kind := 'kudos'; target := greatest(3, 3 * n);
    label := 'Send ' || target || ' kudos around the squad';
    select count(*) into progress
    from public.kudos k
    join public.squad_members a on a.user_id = k.from_user and a.squad_id = p_squad
    join public.squad_members b on b.user_id = k.to_user and b.squad_id = p_squad
    where k.done_on between p_week and week_end;
  end if;
  progress := least(progress, target);
  return next;
end;
$$;

-- ---------- the plant ----------
-- p_today is the caller's local date (so "today" and "this week" match their clock).
create function public.squad_plant(p_squad uuid, p_today date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  start_day date;
  today date := least(greatest(p_today, (now() at time zone 'utc')::date - 1), (now() at time zone 'utc')::date + 1);
  wk date;
  total numeric := 0;
  week_total numeric;
  g record;
  bonus numeric;
  cur_goal record;
  cur_bonus numeric := 0;
  health numeric;
  n int;
  t record;
begin
  -- RLS hides squads you're not in, so this also checks membership.
  select min(joined_at)::date into start_day from public.squad_members where squad_id = p_squad;
  if start_day is null then return null; end if;
  select count(*) into n from public.squad_members where squad_id = p_squad;

  -- walk the weeks: daily growth, plus the goal spurt for weeks that hit their goal
  wk := date_trunc('week', start_day)::date;
  while wk <= today loop
    select coalesce(sum(growth), 0) into week_total
    from public.squad_day_growth(p_squad, greatest(wk, start_day), least(wk + 6, today));
    select * into g from public.squad_week_goal(p_squad, wk, today);
    bonus := case when g.progress >= g.target then round(week_total * 0.2, 2) else 0 end;
    total := total + week_total + bonus;
    if wk = date_trunc('week', today)::date then cur_goal := g; cur_bonus := bonus; end if;
    wk := wk + 7;
  end loop;

  select * into t from public.squad_day_growth(p_squad, today, today);

  -- health: share of member-days active over the last 7 days
  select coalesce(sum(active)::numeric / nullif(sum(members), 0), 0) into health
  from public.squad_day_growth(p_squad, today - 6, today);

  return jsonb_build_object(
    'growth', round(total, 1),
    'health', round(health, 2),
    'drooping', not exists (select 1 from public.squad_day_growth(p_squad, today - 2, today) x where x.active > 0),
    'today', jsonb_build_object('active', coalesce(t.active, 0), 'members', n,
                                'points', coalesce(t.growth, 0), 'full', coalesce(t.full_day, false)),
    'week', jsonb_build_object('kind', cur_goal.kind, 'label', cur_goal.label, 'target', cur_goal.target,
                               'progress', cur_goal.progress, 'met', cur_goal.progress >= cur_goal.target,
                               'bonus', cur_bonus),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object('id', sm.user_id, 'recent_days', coalesce(r.d, 0)) order by sm.joined_at)
      from public.squad_members sm
      left join lateral (
        select count(distinct e.done_on) as d from public.entries e
        where e.user_id = sm.user_id and e.done_on between greatest(today - 13, sm.joined_at::date) and today
          and char_length(btrim(e.text)) >= 3
      ) r on true
      where sm.squad_id = p_squad), '[]'::jsonb)
  );
end;
$$;
