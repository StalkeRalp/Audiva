-- Correct audiva_refresh_streak: avoid a PL/pgSQL record variable and SQL
-- table alias sharing the same name (`d`), which makes d.activity_day ambiguous.
create or replace function public.audiva_refresh_streak()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  latest date;
  current_count integer := 0;
  longest_count integer := 0;
  run_count integer := 0;
  previous_day date;
  activity_entry record;
  tz text;
begin
  select coalesce(p.time_zone, 'UTC')
    into tz
  from public.audiva_user_preferences as p
  where p.user_id = new.user_id;
  tz := coalesce(tz, 'UTC');

  select max(activity_day)
    into latest
  from public.audiva_activity_days
  where user_id = new.user_id
    and (qualified_listens > 0 or messages_sent > 0);

  for activity_entry in
    select activity_day
    from public.audiva_activity_days
    where user_id = new.user_id
      and (qualified_listens > 0 or messages_sent > 0)
    order by activity_day
  loop
    if previous_day is null or activity_entry.activity_day <> previous_day + 1 then
      run_count := 1;
    else
      run_count := run_count + 1;
    end if;
    longest_count := greatest(longest_count, run_count);
    previous_day := activity_entry.activity_day;
  end loop;

  if latest >= (now() at time zone tz)::date - 1 then
    with recursive consecutive_days(activity_day) as (
      select latest
      union all
      select activity_row.activity_day
      from public.audiva_activity_days as activity_row
      join consecutive_days as consecutive_row
        on activity_row.activity_day = consecutive_row.activity_day - 1
      where activity_row.user_id = new.user_id
        and (activity_row.qualified_listens > 0 or activity_row.messages_sent > 0)
    )
    select count(*) into current_count from consecutive_days;
  end if;

  insert into public.audiva_streaks(user_id, current_days, longest_days, last_activity_day, updated_at)
  values (new.user_id, current_count, longest_count, latest, now())
  on conflict (user_id) do update
    set current_days = excluded.current_days,
        longest_days = excluded.longest_days,
        last_activity_day = excluded.last_activity_day,
        updated_at = now();

  return new;
end;
$$;
