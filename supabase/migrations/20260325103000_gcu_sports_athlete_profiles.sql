begin;

alter table public.users
  add column if not exists sport_profile jsonb not null default '{}'::jsonb;

alter table public.players
  add column if not exists sport_profile jsonb not null default '{}'::jsonb;

insert into public.players (user_id, name, photo_url, role, sport_profile)
select
  u.id,
  coalesce(u.name, 'Player'),
  u.avatar_url,
  u.preferred_role,
  coalesce(u.sport_profile, '{}'::jsonb)
from public.users u
on conflict (user_id)
do update set
  name = excluded.name,
  photo_url = coalesce(excluded.photo_url, public.players.photo_url),
  role = coalesce(excluded.role, public.players.role),
  sport_profile = excluded.sport_profile;

create or replace function public.sync_player_profile_from_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (user_id, name, photo_url, role, sport_profile)
  values (
    new.id,
    coalesce(new.name, 'Player'),
    new.avatar_url,
    new.preferred_role,
    coalesce(new.sport_profile, '{}'::jsonb)
  )
  on conflict (user_id)
  do update set
    name = excluded.name,
    photo_url = coalesce(excluded.photo_url, public.players.photo_url),
    role = coalesce(excluded.role, public.players.role),
    sport_profile = excluded.sport_profile;

  return new;
end;
$$;

drop trigger if exists sync_player_profile_from_user_trigger on public.users;
create trigger sync_player_profile_from_user_trigger
after insert or update of name, avatar_url, preferred_role, sport_profile
on public.users
for each row
execute function public.sync_player_profile_from_user();

commit;
