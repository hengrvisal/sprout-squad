-- Sprout Squad · phase 3: kudos
-- One of four reactions from one squadmate to another, for a given day. Toggling is
-- insert/delete of a row; the primary key stops double-sending the same emoji.

create table public.kudos (
  from_user  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  to_user    uuid not null references public.profiles (id) on delete cascade,
  done_on    date not null,
  emoji      text not null check (emoji in ('🔥', '👏', '💪', '🌱')),
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, done_on, emoji),
  check (from_user <> to_user)
);

create index kudos_to_day on public.kudos (to_user, done_on);

alter table public.kudos enable row level security;

-- You see kudos you got, and kudos on any squadmate (so counts show on their card).
create policy "kudos: read mine and squadmates'" on public.kudos
  for select using (to_user = auth.uid() or from_user = auth.uid() or public.is_squadmate(to_user));

-- You can only send as yourself, only to people you share a squad with.
create policy "kudos: send to squadmates" on public.kudos
  for insert with check (from_user = auth.uid() and public.is_squadmate(to_user));

-- You can take back your own.
create policy "kudos: remove own" on public.kudos
  for delete using (from_user = auth.uid());
