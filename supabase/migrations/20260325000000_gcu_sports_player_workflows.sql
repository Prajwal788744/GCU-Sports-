begin;

alter table public.users
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamp with time zone,
  add column if not exists preferred_sport_id integer references public.sports(id),
  add column if not exists preferred_role text,
  add column if not exists registration_year integer,
  add column if not exists course_code text;

alter table public.players
  add column if not exists role text;

alter table public.teams
  add column if not exists sport_id integer references public.sports(id);

update public.teams
set sport_id = 1
where sport_id is null;

alter table public.teams
  alter column sport_id set default 1;

alter table public.teams
  alter column sport_id set not null;

create table if not exists public.notifications (
  id bigserial primary key,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  booking_id integer references public.bookings(id) on delete cascade,
  team_id bigint references public.teams(id) on delete cascade,
  match_id integer references public.matches(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.booking_player_requests (
  id bigserial primary key,
  booking_id integer not null references public.bookings(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  source_team_id bigint references public.teams(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null default 'team_switch',
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  responded_at timestamp with time zone,
  constraint booking_player_requests_type_check check (request_type = any (array['invite'::text, 'team_switch'::text])),
  constraint booking_player_requests_status_check check (status = any (array['pending'::text, 'accepted'::text, 'rejected'::text]))
);

create index if not exists users_department_registration_year_idx
  on public.users (department, registration_year);

create index if not exists users_preferred_sport_idx
  on public.users (preferred_sport_id);

create index if not exists teams_owner_sport_name_idx
  on public.teams (owner_user_id, sport_id, name);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_user_id, is_read, created_at desc);

create index if not exists notifications_actor_user_id_idx
  on public.notifications (actor_user_id);

create index if not exists notifications_booking_id_idx
  on public.notifications (booking_id);

create index if not exists notifications_team_id_idx
  on public.notifications (team_id);

create index if not exists notifications_match_id_idx
  on public.notifications (match_id);

create index if not exists booking_player_requests_user_status_idx
  on public.booking_player_requests (user_id, status, created_at desc);

create index if not exists booking_player_requests_booking_idx
  on public.booking_player_requests (booking_id, team_id, source_team_id);

create index if not exists booking_player_requests_requested_by_idx
  on public.booking_player_requests (requested_by);

create index if not exists booking_player_requests_team_id_idx
  on public.booking_player_requests (team_id);

create index if not exists booking_player_requests_source_team_id_idx
  on public.booking_player_requests (source_team_id);

create unique index if not exists players_user_id_key
  on public.players (user_id);

create unique index if not exists team_players_team_id_user_id_key
  on public.team_players (team_id, user_id);

update public.users
set registration_year = case
      when reg_no ~ '^[0-9]{2}[A-Za-z]+[0-9]+$' then substring(reg_no from 1 for 2)::integer
      else registration_year
    end,
    course_code = case
      when reg_no ~ '^[0-9]{2}[A-Za-z]+[0-9]+$' then regexp_replace(upper(reg_no), '^[0-9]{2}([A-Z]+)[0-9]+$', '\1')
      else course_code
    end
where reg_no is not null
  and (registration_year is null or course_code is null);

insert into public.players (user_id, name, photo_url, role)
select u.id, coalesce(u.name, 'Player'), u.avatar_url, u.preferred_role
from public.users u
on conflict (user_id)
do update set
  name = excluded.name,
  photo_url = coalesce(excluded.photo_url, public.players.photo_url),
  role = coalesce(excluded.role, public.players.role);

alter table public.notifications enable row level security;
alter table public.booking_player_requests enable row level security;

create or replace function public.sync_player_profile_from_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (user_id, name, photo_url, role)
  values (new.id, coalesce(new.name, 'Player'), new.avatar_url, new.preferred_role)
  on conflict (user_id)
  do update set
    name = excluded.name,
    photo_url = coalesce(excluded.photo_url, public.players.photo_url),
    role = coalesce(excluded.role, public.players.role);

  return new;
end;
$$;

drop trigger if exists sync_player_profile_from_user_trigger on public.users;
create trigger sync_player_profile_from_user_trigger
after insert or update of name, avatar_url, preferred_role
on public.users
for each row
execute function public.sync_player_profile_from_user();

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'users' and policyname = 'Authenticated can read public player directory'
  ) then
    create policy "Authenticated can read public player directory"
      on public.users
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_select_involved'
  ) then
    create policy notifications_select_involved
      on public.notifications
      for select
      to authenticated
      using ((select auth.uid()) = recipient_user_id or (select auth.uid()) = actor_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_insert_actor'
  ) then
    create policy notifications_insert_actor
      on public.notifications
      for insert
      to authenticated
      with check (actor_user_id is null or (select auth.uid()) = actor_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'notifications' and policyname = 'notifications_update_recipient'
  ) then
    create policy notifications_update_recipient
      on public.notifications
      for update
      to authenticated
      using ((select auth.uid()) = recipient_user_id)
      with check ((select auth.uid()) = recipient_user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_player_requests' and policyname = 'booking_player_requests_select_involved'
  ) then
    create policy booking_player_requests_select_involved
      on public.booking_player_requests
      for select
      to authenticated
      using (
        (select auth.uid()) = user_id
        or (select auth.uid()) = requested_by
        or exists (
          select 1
          from public.teams t
          where t.id = booking_player_requests.team_id
            and t.owner_user_id = (select auth.uid())
        )
        or exists (
          select 1
          from public.teams t
          where t.id = booking_player_requests.source_team_id
            and t.owner_user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_player_requests' and policyname = 'booking_player_requests_insert_team_owner'
  ) then
    create policy booking_player_requests_insert_team_owner
      on public.booking_player_requests
      for insert
      to authenticated
      with check (
        (select auth.uid()) = requested_by
        and exists (
          select 1
          from public.teams t
          where t.id = booking_player_requests.team_id
            and t.owner_user_id = (select auth.uid())
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'booking_player_requests' and policyname = 'booking_player_requests_update_target_user'
  ) then
    create policy booking_player_requests_update_target_user
      on public.booking_player_requests
      for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_players' and policyname = 'team_players_insert_self_via_booking_request'
  ) then
    create policy team_players_insert_self_via_booking_request
      on public.team_players
      for insert
      to authenticated
      with check (
        (select auth.uid()) = user_id
        and exists (
          select 1
          from public.booking_player_requests bpr
          where bpr.user_id = (select auth.uid())
            and bpr.team_id = team_players.team_id
            and bpr.status = 'pending'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'team_players' and policyname = 'team_players_delete_self_via_booking_request'
  ) then
    create policy team_players_delete_self_via_booking_request
      on public.team_players
      for delete
      to authenticated
      using (
        (select auth.uid()) = user_id
        and exists (
          select 1
          from public.booking_player_requests bpr
          where bpr.user_id = (select auth.uid())
            and bpr.source_team_id = team_players.team_id
            and bpr.status = 'pending'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'match_players' and policyname = 'match_players_update_self_via_join_request'
  ) then
    create policy match_players_update_self_via_join_request
      on public.match_players
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.players p
          join public.team_join_requests tjr
            on tjr.player_id = p.id
           and tjr.match_id = match_players.match_id
           and tjr.status = 'pending'
          where p.id = match_players.player_id
            and p.user_id = (select auth.uid())
        )
      )
      with check (
        exists (
          select 1
          from public.players p
          join public.team_join_requests tjr
            on tjr.player_id = p.id
           and tjr.match_id = match_players.match_id
           and tjr.status = 'pending'
          where p.id = match_players.player_id
            and p.user_id = (select auth.uid())
        )
      );
  end if;
end $$;

commit;
