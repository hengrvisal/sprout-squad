-- Sprout Squad · phase 1 schema
-- Solo loop: profiles + entries. Friends/squads/kudos arrive in phase 2.

-- ---------- profiles ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 24),
  emoji        text not null default '🦊',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Phase 1: you only see yourself. Phase 2 widens select to squad members.
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile row for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- entries ----------
-- One row per logged "thing done". done_on is the user's LOCAL calendar date,
-- set by the client, so a 11pm Melbourne entry lands on the right square.
create table public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 90),
  category   text not null check (category in ('study','work','build','move','home','create')),
  done_on    date not null,
  created_at timestamptz not null default now()
);

create index entries_user_day on public.entries (user_id, done_on);

alter table public.entries enable row level security;

create policy "entries: read own" on public.entries
  for select using (auth.uid() = user_id);

create policy "entries: insert own" on public.entries
  for insert with check (auth.uid() = user_id);

create policy "entries: delete own" on public.entries
  for delete using (auth.uid() = user_id);

-- ---------- day_counts ----------
-- Per-day totals for the grid. Aggregated server-side so a full year is ~365
-- small rows instead of thousands of entries (also the basis for Rewind later).
create function public.day_counts(p_from date, p_to date)
returns table (done_on date, n int)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.done_on, count(*)::int
  from public.entries e
  where e.user_id = auth.uid()
    and e.done_on between p_from and p_to
  group by e.done_on
$$;
