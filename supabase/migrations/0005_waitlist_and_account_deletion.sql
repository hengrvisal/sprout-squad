-- Sprout Squad · beta waitlist (landing page) + self-service account deletion

-- ---------- waitlist ----------
-- Written only through join_waitlist(); nobody (anon or signed in) can read it via the API.
-- You see sign-ups in the Supabase dashboard (Table Editor → waitlist).
create table public.waitlist (
  email      text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone      text check (phone in ('iphone', 'android', 'other')),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- (no policies: direct table access is denied for every API role)

create function public.join_waitlist(p_email text, p_phone text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.waitlist (email, phone)
  values (lower(btrim(p_email)), nullif(p_phone, ''))
  on conflict (email) do update set phone = coalesce(excluded.phone, public.waitlist.phone);
  -- same response whether new or repeat, so the form can't be used to probe who signed up
end;
$$;

grant execute on function public.join_waitlist(text, text) to anon, authenticated;

-- ---------- squads outlive their creator ----------
-- 0003 cascaded squads.created_by, so deleting the creator would delete the squad for
-- everyone. Keep the squad and just forget who made it.
alter table public.squads drop constraint squads_created_by_fkey;
alter table public.squads alter column created_by drop not null;
alter table public.squads
  add constraint squads_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

-- ---------- delete my account ----------
-- Deletes the auth user; the profile cascades to entries, squad memberships and kudos.
-- Squads you were in keep going for everyone else; any left empty are removed.
-- Required by the App Store.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  my_squads uuid[];
begin
  if uid is null then
    raise exception 'not_signed_in';
  end if;
  select coalesce(array_agg(squad_id), '{}') into my_squads from public.squad_members where user_id = uid;
  delete from auth.users where id = uid;
  delete from public.squads s
  where s.id = any (my_squads)
    and not exists (select 1 from public.squad_members m where m.squad_id = s.id);
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
