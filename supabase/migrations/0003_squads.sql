-- Sprout Squad · phase 2: squads
-- A person can be in several squads (max 10 members each). Squadmates can see each
-- other's profile, grid and entries. Creating, joining and leaving go through RPCs so
-- the membership rules (code lookup, size cap) are enforced on the server.

-- ---------- tables ----------
create table public.squads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 30),
  invite_code text not null unique check (invite_code ~ '^[A-Z2-9]{6}$'),
  created_by  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.squad_members (
  squad_id  uuid not null references public.squads (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id)
);

create index squad_members_user on public.squad_members (user_id);

alter table public.squads enable row level security;
alter table public.squad_members enable row level security;

-- ---------- helpers ----------
-- SECURITY DEFINER so policies can ask "am I in this squad?" without the
-- squad_members policy recursively checking itself.
create function public.my_squad_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select squad_id from public.squad_members where user_id = auth.uid()
$$;

create function public.is_squadmate(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.squad_members mine
    join public.squad_members theirs on theirs.squad_id = mine.squad_id
    where mine.user_id = auth.uid() and theirs.user_id = other
  )
$$;

-- ---------- policies ----------
create policy "squads: read my squads" on public.squads
  for select using (id in (select public.my_squad_ids()));

create policy "squad_members: read my squads' members" on public.squad_members
  for select using (squad_id in (select public.my_squad_ids()));

-- Squadmates can see each other's profile and entries (read-only).
create policy "profiles: read squadmates" on public.profiles
  for select using (public.is_squadmate(id));

create policy "entries: read squadmates" on public.entries
  for select using (public.is_squadmate(user_id));

-- ---------- invite codes ----------
-- 6 chars, no look-alikes (no 0/O, 1/I/L).
create function public.new_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.squads where invite_code = code);
  end loop;
  return code;
end;
$$;

-- ---------- RPCs ----------
create function public.create_squad(p_name text)
returns public.squads
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.squads;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if (select count(*) from public.squad_members where user_id = auth.uid()) >= 10 then
    raise exception 'too_many_squads';
  end if;
  insert into public.squads (name, invite_code, created_by)
  values (btrim(p_name), public.new_invite_code(), auth.uid())
  returning * into s;
  insert into public.squad_members (squad_id, user_id) values (s.id, auth.uid());
  return s;
end;
$$;

create function public.join_squad(p_code text)
returns public.squads
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.squads;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select * into s from public.squads where invite_code = upper(btrim(p_code)) for update;
  if not found then
    raise exception 'squad_not_found';
  end if;
  if exists (select 1 from public.squad_members where squad_id = s.id and user_id = auth.uid()) then
    return s; -- already in it: joining again is a no-op
  end if;
  if (select count(*) from public.squad_members where squad_id = s.id) >= 10 then
    raise exception 'squad_full';
  end if;
  if (select count(*) from public.squad_members where user_id = auth.uid()) >= 10 then
    raise exception 'too_many_squads';
  end if;
  insert into public.squad_members (squad_id, user_id) values (s.id, auth.uid());
  return s;
end;
$$;

create function public.leave_squad(p_squad uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.squad_members where squad_id = p_squad and user_id = auth.uid();
  -- last one out turns off the lights
  delete from public.squads s
  where s.id = p_squad
    and not exists (select 1 from public.squad_members m where m.squad_id = p_squad);
end;
$$;

-- Per-member daily totals for one squad. SECURITY INVOKER: RLS on squad_members and
-- entries already limits this to squads the caller is in.
create function public.squad_day_counts(p_squad uuid, p_from date, p_to date)
returns table (user_id uuid, done_on date, n int)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.user_id, e.done_on, count(*)::int
  from public.entries e
  join public.squad_members m on m.user_id = e.user_id and m.squad_id = p_squad
  where e.done_on between p_from and p_to
  group by e.user_id, e.done_on
$$;

revoke execute on function public.new_invite_code() from public, anon, authenticated;
