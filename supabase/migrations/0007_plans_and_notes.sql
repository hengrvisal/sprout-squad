-- Sprout Squad · plans and kudos notes
--
-- plans:       "today I'm going to…". Optional, up to 3 a day, visible to squadmates.
--              Ticking one off logs it as an entry; entry_id links the two. A plan is
--              never a target: nothing reads unfinished plans from past days.
-- kudo_notes:  a few words to a squadmate, one per person per day. Private: only the
--              sender and the recipient can read it (unlike kudos, which the squad sees).

-- ---------- plans ----------
create table public.plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  done_on    date not null,
  text       text not null check (char_length(btrim(text)) between 1 and 90),
  entry_id   uuid references public.entries (id) on delete set null,
  created_at timestamptz not null default now()
);

create index plans_user_day on public.plans (user_id, done_on);

alter table public.plans enable row level security;

create policy "plans: read own and squadmates'" on public.plans
  for select using (user_id = auth.uid() or public.is_squadmate(user_id));

create policy "plans: insert own" on public.plans
  for insert with check (user_id = auth.uid());

create policy "plans: update own" on public.plans
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "plans: delete own" on public.plans
  for delete using (user_id = auth.uid());

-- Only the text and the entry link can change after creation.
revoke update on public.plans from anon, authenticated;
grant update (text, entry_id) on public.plans to authenticated;

-- Same today-or-yesterday window as entries (reuses the function from 0006).
create trigger plans_check_day
  before insert or update of done_on on public.plans
  for each row execute function public.entries_check_day();

create function public.plans_check()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     and (select count(*) from public.plans where user_id = new.user_id and done_on = new.done_on) >= 3 then
    raise exception 'too_many_plans';
  end if;
  -- a plan can only be ticked off by one of your own entries
  if new.entry_id is not null
     and not exists (select 1 from public.entries e where e.id = new.entry_id and e.user_id = new.user_id) then
    raise exception 'plan_entry_not_yours';
  end if;
  return new;
end;
$$;

create trigger plans_check
  before insert or update on public.plans
  for each row execute function public.plans_check();

-- ---------- kudo notes ----------
create table public.kudo_notes (
  from_user  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  to_user    uuid not null references public.profiles (id) on delete cascade,
  done_on    date not null,
  note       text not null check (char_length(btrim(note)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (from_user, to_user, done_on),
  check (from_user <> to_user)
);

create index kudo_notes_to_day on public.kudo_notes (to_user, done_on);

alter table public.kudo_notes enable row level security;

create policy "kudo_notes: sender and recipient read" on public.kudo_notes
  for select using (from_user = auth.uid() or to_user = auth.uid());

create policy "kudo_notes: send to squadmates" on public.kudo_notes
  for insert with check (from_user = auth.uid() and public.is_squadmate(to_user));

create policy "kudo_notes: edit own" on public.kudo_notes
  for update using (from_user = auth.uid()) with check (from_user = auth.uid() and public.is_squadmate(to_user));

create policy "kudo_notes: remove own" on public.kudo_notes
  for delete using (from_user = auth.uid());

create trigger kudo_notes_check_day
  before insert or update of done_on on public.kudo_notes
  for each row execute function public.entries_check_day();
