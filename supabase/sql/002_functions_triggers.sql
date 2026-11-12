-- Audiva / Supabase — étape 2/4 : fonctions et triggers.
-- Les fonctions privilégiées fixent search_path à vide et qualifient les objets.

create or replace function public.audiva_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists audiva_profiles_touch on public.audiva_profiles;
create trigger audiva_profiles_touch before update on public.audiva_profiles for each row execute function public.audiva_touch_updated_at();
drop trigger if exists audiva_preferences_touch on public.audiva_user_preferences;
create trigger audiva_preferences_touch before update on public.audiva_user_preferences for each row execute function public.audiva_touch_updated_at();
drop trigger if exists audiva_music_items_touch on public.audiva_music_items;
create trigger audiva_music_items_touch before update on public.audiva_music_items for each row execute function public.audiva_touch_updated_at();
drop trigger if exists audiva_playlists_touch on public.audiva_playlists;
create trigger audiva_playlists_touch before update on public.audiva_playlists for each row execute function public.audiva_touch_updated_at();
drop trigger if exists audiva_conversations_touch on public.audiva_conversations;
create trigger audiva_conversations_touch before update on public.audiva_conversations for each row execute function public.audiva_touch_updated_at();

create or replace function public.audiva_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  candidate text;
begin
  candidate := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(coalesce(new.email, 'audiva'), '@', 1)), '[^a-zA-Z0-9_]', '', 'g'));
  if length(candidate) < 3 then candidate := 'audiva_' || left(replace(new.id::text, '-', ''), 12); end if;
  insert into public.audiva_profiles(id, username, display_name)
  values (new.id, candidate || '_' || left(replace(new.id::text, '-', ''), 6), coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, ''), '@', 1), ''))
  on conflict (id) do nothing;
  insert into public.audiva_user_preferences(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists audiva_auth_user_created on auth.users;
create trigger audiva_auth_user_created after insert on auth.users for each row execute function public.audiva_handle_new_user();

-- Reprise non destructive des comptes déjà présents au moment du déploiement.
insert into public.audiva_profiles(id, username, display_name)
select u.id,
       'audiva_' || left(replace(u.id::text, '-', ''), 16),
       coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(u.email, ''), '@', 1), '')
from auth.users u
on conflict (id) do nothing;
insert into public.audiva_user_preferences(user_id)
select u.id from auth.users u on conflict (user_id) do nothing;

create or replace function public.audiva_is_friend(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.audiva_friendships f
    where f.user_low = least(a,b) and f.user_high = greatest(a,b)
  ) and (a = auth.uid() or b = auth.uid())
    and not exists (select 1 from public.audiva_user_blocks x where (x.blocker_id = a and x.blocked_id = b) or (x.blocker_id = b and x.blocked_id = a));
$$;

create or replace function public.audiva_is_conversation_member(conversation uuid, member uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.audiva_conversation_members m
    where m.conversation_id = conversation and m.user_id = member
  ) and member = auth.uid();
$$;

create or replace function public.audiva_can_send_message(conversation uuid, sender uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select sender = auth.uid()
    and public.audiva_is_conversation_member(conversation, sender)
    and not exists (
      select 1 from public.audiva_conversations c
      join public.audiva_conversation_members m on m.conversation_id = c.id and m.user_id <> sender
      join public.audiva_user_blocks b on (b.blocker_id = sender and b.blocked_id = m.user_id) or (b.blocker_id = m.user_id and b.blocked_id = sender)
      where c.id = conversation and c.kind = 'direct'
    );
$$;

create or replace function public.audiva_can_view_playlist(playlist uuid, viewer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.audiva_playlists p
    where p.id = playlist and (
      p.owner_id = viewer or p.visibility = 'public'
      or (p.visibility = 'friends' and public.audiva_is_friend(p.owner_id, viewer))
      or exists (select 1 from public.audiva_playlist_collaborators c where c.playlist_id = p.id and c.user_id = viewer)
    )
  ) and viewer = auth.uid();
$$;

create or replace function public.audiva_shares_activity(target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select target_user = auth.uid() or (
    auth.uid() is not null
    and public.audiva_is_friend(target_user, auth.uid())
    and exists (select 1 from public.audiva_user_preferences p where p.user_id = target_user and p.allow_activity_sharing)
    and not exists (select 1 from public.audiva_user_blocks b where (b.blocker_id = target_user and b.blocked_id = auth.uid()) or (b.blocker_id = auth.uid() and b.blocked_id = target_user))
  );
$$;

create or replace function public.audiva_send_friend_request(target_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare request_id uuid;
begin
  if auth.uid() is null or target_user = auth.uid() then raise exception 'Invalid friend request'; end if;
  if public.audiva_is_friend(auth.uid(), target_user) then raise exception 'Already friends'; end if;
  if not exists (select 1 from public.audiva_user_preferences p where p.user_id = target_user and p.allow_friend_requests) then raise exception 'Friend requests are disabled'; end if;
  if exists (select 1 from public.audiva_user_blocks b where (b.blocker_id = auth.uid() and b.blocked_id = target_user) or (b.blocker_id = target_user and b.blocked_id = auth.uid())) then raise exception 'User unavailable'; end if;
  insert into public.audiva_friend_requests(requester_id, addressee_id)
  values (auth.uid(), target_user)
  on conflict (requester_id, addressee_id) do update set status = 'pending', created_at = now(), responded_at = null
  returning id into request_id;
  return request_id;
end;
$$;

create or replace function public.audiva_remove_friend(other_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or other_user = auth.uid() then raise exception 'Invalid friendship'; end if;
  delete from public.audiva_friendships f
  where f.user_low = least(auth.uid(), other_user) and f.user_high = greatest(auth.uid(), other_user);
  update public.audiva_friend_requests r set status = 'cancelled', responded_at = now()
  where r.status = 'pending'
    and ((r.requester_id = auth.uid() and r.addressee_id = other_user)
      or (r.requester_id = other_user and r.addressee_id = auth.uid()));
end;
$$;

create or replace function public.audiva_respond_friend_request(request_id uuid, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare req public.audiva_friend_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into req from public.audiva_friend_requests r where r.id = request_id for update;
  if not found or req.addressee_id <> auth.uid() or req.status <> 'pending' then raise exception 'Friend request unavailable'; end if;
  update public.audiva_friend_requests set status = case when accept then 'accepted' else 'declined' end, responded_at = now() where id = req.id;
  if accept then
    insert into public.audiva_friendships(user_low, user_high) values (least(req.requester_id, req.addressee_id), greatest(req.requester_id, req.addressee_id)) on conflict do nothing;
  end if;
end;
$$;

create or replace function public.audiva_create_direct_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare conversation_id uuid; a uuid; b uuid;
begin
  if auth.uid() is null or other_user = auth.uid() then raise exception 'Invalid conversation'; end if;
  if not public.audiva_is_friend(auth.uid(), other_user) then raise exception 'Conversation requires an accepted friendship'; end if;
  if exists (select 1 from public.audiva_user_blocks x where (x.blocker_id = auth.uid() and x.blocked_id = other_user) or (x.blocker_id = other_user and x.blocked_id = auth.uid())) then raise exception 'Conversation unavailable'; end if;
  a := least(auth.uid(), other_user); b := greatest(auth.uid(), other_user);
  select c.id into conversation_id from public.audiva_conversations c
  join public.audiva_conversation_members m1 on m1.conversation_id = c.id and m1.user_id = a
  join public.audiva_conversation_members m2 on m2.conversation_id = c.id and m2.user_id = b
  where c.kind = 'direct' and (select count(*) from public.audiva_conversation_members m where m.conversation_id = c.id) = 2
  limit 1;
  if conversation_id is null then
    insert into public.audiva_conversations(kind, created_by) values ('direct', auth.uid()) returning id into conversation_id;
    insert into public.audiva_conversation_members(conversation_id, user_id, role) values (conversation_id, a, 'owner'), (conversation_id, b, 'member');
  end if;
  return conversation_id;
end;
$$;

create or replace function public.audiva_after_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.audiva_conversations set updated_at = new.created_at where id = new.conversation_id;
  insert into public.audiva_activity_days(user_id, activity_day, messages_sent)
  values (new.sender_id, (new.created_at at time zone coalesce((select p.time_zone from public.audiva_user_preferences p where p.user_id = new.sender_id), 'UTC'))::date, 1)
  on conflict (user_id, activity_day) do update set messages_sent = public.audiva_activity_days.messages_sent + 1, updated_at = now();
  insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id)
  select m.user_id, new.sender_id, 'message', 'conversation', new.conversation_id
  from public.audiva_conversation_members m
  join public.audiva_user_preferences p on p.user_id = m.user_id and p.allow_notifications
  where m.conversation_id = new.conversation_id and m.user_id <> new.sender_id and not m.muted;
  return new;
end;
$$;
drop trigger if exists audiva_message_inserted on public.audiva_messages;
create trigger audiva_message_inserted after insert on public.audiva_messages for each row execute function public.audiva_after_message_insert();

create or replace function public.audiva_after_listening_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.qualified then
    insert into public.audiva_activity_days(user_id, activity_day, qualified_listens)
    values (new.user_id, new.local_day, 1)
    on conflict (user_id, activity_day) do update set qualified_listens = public.audiva_activity_days.qualified_listens + 1, updated_at = now();
  end if;
  return new;
end;
$$;
drop trigger if exists audiva_listening_inserted on public.audiva_listening_events;
create trigger audiva_listening_inserted after insert on public.audiva_listening_events for each row execute function public.audiva_after_listening_insert();

create or replace function public.audiva_refresh_streak()
returns trigger language plpgsql security definer set search_path = '' as $$
declare latest date; current_count integer := 0; longest_count integer := 0; run_count integer := 0; previous_day date; d record; tz text;
begin
  select coalesce(p.time_zone, 'UTC') into tz from public.audiva_user_preferences p where p.user_id = new.user_id;
  tz := coalesce(tz, 'UTC');
  select max(activity_day) into latest from public.audiva_activity_days where user_id = new.user_id and (qualified_listens > 0 or messages_sent > 0);
  for d in select activity_day from public.audiva_activity_days where user_id = new.user_id and (qualified_listens > 0 or messages_sent > 0) order by activity_day loop
    if previous_day is null or d.activity_day <> previous_day + 1 then run_count := 1; else run_count := run_count + 1; end if;
    longest_count := greatest(longest_count, run_count);
    previous_day := d.activity_day;
  end loop;
  if latest >= (now() at time zone tz)::date - 1 then
    with recursive consecutive_days(activity_day) as (
      select latest
      union all
      select d.activity_day from public.audiva_activity_days d
      join consecutive_days c on d.activity_day = c.activity_day - 1
      where d.user_id = new.user_id and (d.qualified_listens > 0 or d.messages_sent > 0)
    ) select count(*) into current_count from consecutive_days;
  end if;
  insert into public.audiva_streaks(user_id, current_days, longest_days, last_activity_day, updated_at)
  values (new.user_id, current_count, longest_count, latest, now())
  on conflict (user_id) do update set current_days = excluded.current_days, longest_days = excluded.longest_days, last_activity_day = excluded.last_activity_day, updated_at = now();
  return new;
end;
$$;
drop trigger if exists audiva_activity_streak_refresh on public.audiva_activity_days;
create trigger audiva_activity_streak_refresh after insert or update on public.audiva_activity_days for each row execute function public.audiva_refresh_streak();

create or replace function public.audiva_streak_milestone_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.current_days in (7, 30, 100, 365) and (tg_op = 'INSERT' or old.current_days is distinct from new.current_days) then
    insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id, payload)
    select new.user_id, new.user_id, 'streak', 'streak', new.user_id,
           jsonb_build_object('days', new.current_days)
    where exists (select 1 from public.audiva_user_preferences p where p.user_id = new.user_id and p.allow_notifications);
  end if;
  return new;
end;
$$;
drop trigger if exists audiva_streak_milestone_notification on public.audiva_streaks;
create trigger audiva_streak_milestone_notification after insert or update of current_days on public.audiva_streaks for each row execute function public.audiva_streak_milestone_notification();

create or replace function public.audiva_friend_request_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id)
    select new.addressee_id, new.requester_id, 'friend_request', 'friend_request', new.id
    where exists (select 1 from public.audiva_user_preferences p where p.user_id = new.addressee_id and p.allow_notifications);
  elsif new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id)
    select new.requester_id, new.addressee_id, 'friend_accepted', 'friend_request', new.id
    where exists (select 1 from public.audiva_user_preferences p where p.user_id = new.requester_id and p.allow_notifications);
  end if;
  return new;
end;
$$;
drop trigger if exists audiva_friend_request_notification on public.audiva_friend_requests;
create trigger audiva_friend_request_notification after insert or update of status on public.audiva_friend_requests for each row execute function public.audiva_friend_request_notification();

create or replace function public.audiva_playlist_share_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_user uuid;
begin
  select p.owner_id into owner_user from public.audiva_playlists p where p.id = new.playlist_id;
  if new.user_id <> owner_user then
    insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id)
    select new.user_id, new.added_by, 'playlist_shared', 'playlist', new.playlist_id
    where exists (select 1 from public.audiva_user_preferences p where p.user_id = new.user_id and p.allow_notifications);
  end if;
  return new;
end;
$$;
drop trigger if exists audiva_playlist_share_notification on public.audiva_playlist_collaborators;
create trigger audiva_playlist_share_notification after insert on public.audiva_playlist_collaborators for each row execute function public.audiva_playlist_share_notification();

create or replace function public.audiva_reaction_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare message_sender uuid; conversation uuid;
begin
  select m.sender_id, m.conversation_id into message_sender, conversation from public.audiva_messages m where m.id = new.message_id;
  if message_sender <> new.user_id then
    insert into public.audiva_notifications(recipient_id, actor_id, kind, entity_type, entity_id, payload)
    select message_sender, new.user_id, 'reaction', 'message', new.message_id,
           jsonb_build_object('reaction', new.reaction, 'conversation_id', conversation)
    where exists (select 1 from public.audiva_user_preferences p where p.user_id = message_sender and p.allow_notifications);
  end if;
  return new;
end;
$$;
drop trigger if exists audiva_reaction_notification on public.audiva_message_reactions;
create trigger audiva_reaction_notification after insert on public.audiva_message_reactions for each row execute function public.audiva_reaction_notification();

create or replace function public.audiva_queue_storage_path(bucket text, path text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if bucket is not null and path is not null and length(path) > 0 then
    insert into public.audiva_storage_cleanup_jobs(bucket_id, object_path) values (bucket, path) on conflict (bucket_id, object_path) do nothing;
  end if;
end;
$$;

create or replace function public.audiva_queue_avatar_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.avatar_path is not null and (tg_op = 'DELETE' or old.avatar_path is distinct from new.avatar_path) then
    perform public.audiva_queue_storage_path('audiva-avatars', old.avatar_path);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists audiva_profile_avatar_cleanup on public.audiva_profiles;
create trigger audiva_profile_avatar_cleanup after update of avatar_path or delete on public.audiva_profiles for each row execute function public.audiva_queue_avatar_cleanup();

create or replace function public.audiva_queue_playlist_cover_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.cover_path is not null and (tg_op = 'DELETE' or old.cover_path is distinct from new.cover_path) then
    perform public.audiva_queue_storage_path('audiva-playlist-covers', old.cover_path);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists audiva_playlist_cover_cleanup on public.audiva_playlists;
create trigger audiva_playlist_cover_cleanup after update of cover_path or delete on public.audiva_playlists for each row execute function public.audiva_queue_playlist_cover_cleanup();

create or replace function public.audiva_queue_attachment_cleanup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.source = 'storage' and old.storage_path is not null then
    perform public.audiva_queue_storage_path('audiva-chat-media', old.storage_path);
  end if;
  return old;
end;
$$;
drop trigger if exists audiva_attachment_cleanup on public.audiva_message_attachments;
create trigger audiva_attachment_cleanup after delete on public.audiva_message_attachments for each row execute function public.audiva_queue_attachment_cleanup();

-- Les fonctions de file Storage ne sont pas appelables par les clients.
revoke all on function public.audiva_queue_storage_path(text,text) from public, anon, authenticated;
revoke all on function public.audiva_handle_new_user() from public, anon, authenticated;
revoke all on function public.audiva_after_message_insert() from public, anon, authenticated;
revoke all on function public.audiva_after_listening_insert() from public, anon, authenticated;
revoke all on function public.audiva_refresh_streak() from public, anon, authenticated;
revoke all on function public.audiva_friend_request_notification() from public, anon, authenticated;
revoke all on function public.audiva_streak_milestone_notification() from public, anon, authenticated;
revoke all on function public.audiva_playlist_share_notification() from public, anon, authenticated;
revoke all on function public.audiva_reaction_notification() from public, anon, authenticated;
revoke all on function public.audiva_queue_avatar_cleanup() from public, anon, authenticated;
revoke all on function public.audiva_queue_playlist_cover_cleanup() from public, anon, authenticated;
revoke all on function public.audiva_queue_attachment_cleanup() from public, anon, authenticated;
revoke all on function public.audiva_is_friend(uuid,uuid) from public, anon;
revoke all on function public.audiva_is_conversation_member(uuid,uuid) from public, anon;
revoke all on function public.audiva_can_send_message(uuid,uuid) from public, anon;
revoke all on function public.audiva_can_view_playlist(uuid,uuid) from public, anon;
revoke all on function public.audiva_shares_activity(uuid) from public, anon;

revoke all on function public.audiva_send_friend_request(uuid) from public, anon;
grant execute on function public.audiva_send_friend_request(uuid) to authenticated;
revoke all on function public.audiva_respond_friend_request(uuid,boolean) from public, anon;
grant execute on function public.audiva_respond_friend_request(uuid,boolean) to authenticated;
revoke all on function public.audiva_create_direct_conversation(uuid) from public, anon;
grant execute on function public.audiva_create_direct_conversation(uuid) to authenticated;
revoke all on function public.audiva_remove_friend(uuid) from public, anon;
grant execute on function public.audiva_remove_friend(uuid) to authenticated;
