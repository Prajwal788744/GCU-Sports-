begin;

create unique index if not exists teams_sport_normalized_name_key
  on public.teams (
    sport_id,
    regexp_replace(lower(btrim(name)), '\s+', ' ', 'g')
  );

commit;
