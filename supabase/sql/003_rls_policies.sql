-- Audiva / Supabase — étape 3/4 : RLS et privilèges clients.
-- Relançable : les politiques sont recréées. Les tables restent accessibles à l'app
-- uniquement via les permissions explicites ci-dessous et les politiques RLS.

grant usage on schema public to authenticated;

-- Ne pas hériter d'éventuels DEFAULT PRIVILEGES Supabase trop ouverts.
revoke all on table
  public.audiva_profiles, public.audiva_user_preferences, public.audiva_connected_accounts,
  public.audiva_music_items, public.audiva_favorites, public.audiva_recommendation_feedback,
  public.audiva_listening_events, public.audiva_playlists, public.audiva_playlist_items,
  public.audiva_playlist_collaborators, public.audiva_playlist_saves,
  public.audiva_friend_requests, public.audiva_friendships, public.audiva_user_blocks,
  public.audiva_conversations, public.audiva_conversation_members, public.audiva_messages,
  public.audiva_message_attachments, public.audiva_message_reactions,
  public.audiva_notifications, public.audiva_social_activities, public.audiva_activity_days,
  public.audiva_streaks, public.audiva_shared_stats, public.audiva_storage_cleanup_jobs
from public, anon;
revoke all on sequence public.audiva_storage_cleanup_jobs_id_seq from public, anon, authenticated;

-- Reappliquer les droits minimaux après le retrait défensif ci-dessus.
grant select, insert, update, delete on public.audiva_profiles to authenticated;
grant select, insert, update, delete on public.audiva_user_preferences to authenticated;
grant select, insert, delete on public.audiva_connected_accounts to authenticated;
grant select, insert, update, delete on public.audiva_music_items to authenticated;
grant select, insert, delete on public.audiva_favorites, public.audiva_recommendation_feedback to authenticated;
grant select, insert, delete on public.audiva_listening_events to authenticated;
grant select, insert, update, delete on public.audiva_playlists, public.audiva_playlist_items, public.audiva_playlist_collaborators to authenticated;
grant select, insert, delete on public.audiva_playlist_saves to authenticated;
grant select on public.audiva_friend_requests, public.audiva_friendships to authenticated;
grant select, insert, delete on public.audiva_user_blocks to authenticated;
grant select on public.audiva_conversations, public.audiva_conversation_members to authenticated;
grant update (last_read_at, muted) on public.audiva_conversation_members to authenticated;
grant select, insert on public.audiva_messages to authenticated;
grant select, update (body, payload, edited_at, deleted_at) on public.audiva_messages to authenticated;
grant select, insert, delete on public.audiva_message_attachments, public.audiva_message_reactions to authenticated;
grant select on public.audiva_notifications, public.audiva_activity_days, public.audiva_streaks, public.audiva_my_listening_summary to authenticated;
grant update (read_at) on public.audiva_notifications to authenticated;
grant select, insert, delete on public.audiva_social_activities to authenticated;
grant select, insert, update, delete on public.audiva_shared_stats to authenticated;
grant usage, select on sequence public.audiva_storage_cleanup_jobs_id_seq to service_role;
grant select, insert, update, delete on public.audiva_storage_cleanup_jobs to service_role;

grant execute on function public.audiva_is_friend(uuid,uuid) to authenticated;
grant execute on function public.audiva_is_conversation_member(uuid,uuid) to authenticated;
grant execute on function public.audiva_can_send_message(uuid,uuid) to authenticated;
grant execute on function public.audiva_can_view_playlist(uuid,uuid) to authenticated;
grant execute on function public.audiva_shares_activity(uuid) to authenticated;
revoke all on function public.audiva_is_friend(uuid,uuid) from public, anon;
revoke all on function public.audiva_is_conversation_member(uuid,uuid) from public, anon;
revoke all on function public.audiva_can_send_message(uuid,uuid) from public, anon;
revoke all on function public.audiva_can_view_playlist(uuid,uuid) from public, anon;
revoke all on function public.audiva_shares_activity(uuid) from public, anon;

alter table public.audiva_profiles enable row level security;
alter table public.audiva_user_preferences enable row level security;
alter table public.audiva_connected_accounts enable row level security;
alter table public.audiva_music_items enable row level security;
alter table public.audiva_favorites enable row level security;
alter table public.audiva_recommendation_feedback enable row level security;
alter table public.audiva_listening_events enable row level security;
alter table public.audiva_playlists enable row level security;
alter table public.audiva_playlist_items enable row level security;
alter table public.audiva_playlist_collaborators enable row level security;
alter table public.audiva_playlist_saves enable row level security;
alter table public.audiva_friend_requests enable row level security;
alter table public.audiva_friendships enable row level security;
alter table public.audiva_user_blocks enable row level security;
alter table public.audiva_conversations enable row level security;
alter table public.audiva_conversation_members enable row level security;
alter table public.audiva_messages enable row level security;
alter table public.audiva_message_attachments enable row level security;
alter table public.audiva_message_reactions enable row level security;
alter table public.audiva_notifications enable row level security;
alter table public.audiva_social_activities enable row level security;
alter table public.audiva_activity_days enable row level security;
alter table public.audiva_streaks enable row level security;
alter table public.audiva_shared_stats enable row level security;
alter table public.audiva_storage_cleanup_jobs enable row level security;

-- Ne remplacer que les politiques nommées par ce lot; préserver toute politique tierce.
drop policy if exists audiva_profiles_read on public.audiva_profiles;
drop policy if exists audiva_profiles_insert on public.audiva_profiles;
drop policy if exists audiva_profiles_update on public.audiva_profiles;
drop policy if exists audiva_profiles_delete on public.audiva_profiles;
drop policy if exists audiva_preferences_owner on public.audiva_user_preferences;
drop policy if exists audiva_connected_accounts_owner on public.audiva_connected_accounts;
drop policy if exists audiva_music_read on public.audiva_music_items;
drop policy if exists audiva_music_insert on public.audiva_music_items;
drop policy if exists audiva_music_update on public.audiva_music_items;
drop policy if exists audiva_music_delete on public.audiva_music_items;
drop policy if exists audiva_favorites_owner on public.audiva_favorites;
drop policy if exists audiva_favorites_read on public.audiva_favorites;
drop policy if exists audiva_favorites_insert on public.audiva_favorites;
drop policy if exists audiva_favorites_delete on public.audiva_favorites;
drop policy if exists audiva_recommendation_feedback_owner on public.audiva_recommendation_feedback;
drop policy if exists audiva_recommendation_feedback_read on public.audiva_recommendation_feedback;
drop policy if exists audiva_recommendation_feedback_insert on public.audiva_recommendation_feedback;
drop policy if exists audiva_recommendation_feedback_delete on public.audiva_recommendation_feedback;
drop policy if exists audiva_listening_owner on public.audiva_listening_events;
drop policy if exists audiva_listening_read on public.audiva_listening_events;
drop policy if exists audiva_listening_insert on public.audiva_listening_events;
drop policy if exists audiva_listening_delete on public.audiva_listening_events;
drop policy if exists audiva_playlists_read on public.audiva_playlists;
drop policy if exists audiva_playlists_insert on public.audiva_playlists;
drop policy if exists audiva_playlists_update on public.audiva_playlists;
drop policy if exists audiva_playlists_delete on public.audiva_playlists;
drop policy if exists audiva_playlist_items_read on public.audiva_playlist_items;
drop policy if exists audiva_playlist_items_insert on public.audiva_playlist_items;
drop policy if exists audiva_playlist_items_update on public.audiva_playlist_items;
drop policy if exists audiva_playlist_items_delete on public.audiva_playlist_items;
drop policy if exists audiva_playlist_collaborators_read on public.audiva_playlist_collaborators;
drop policy if exists audiva_playlist_collaborators_manage on public.audiva_playlist_collaborators;
drop policy if exists audiva_playlist_saves_read on public.audiva_playlist_saves;
drop policy if exists audiva_playlist_saves_insert on public.audiva_playlist_saves;
drop policy if exists audiva_playlist_saves_delete on public.audiva_playlist_saves;
drop policy if exists audiva_friend_requests_parties on public.audiva_friend_requests;
drop policy if exists audiva_friendships_parties on public.audiva_friendships;
drop policy if exists audiva_blocks_owner on public.audiva_user_blocks;
drop policy if exists audiva_conversations_member_read on public.audiva_conversations;
drop policy if exists audiva_members_read on public.audiva_conversation_members;
drop policy if exists audiva_members_update_self on public.audiva_conversation_members;
drop policy if exists audiva_messages_read on public.audiva_messages;
drop policy if exists audiva_messages_insert on public.audiva_messages;
drop policy if exists audiva_messages_update_own on public.audiva_messages;
drop policy if exists audiva_attachments_read on public.audiva_message_attachments;
drop policy if exists audiva_attachments_insert on public.audiva_message_attachments;
drop policy if exists audiva_attachments_delete on public.audiva_message_attachments;
drop policy if exists audiva_reactions_read on public.audiva_message_reactions;
drop policy if exists audiva_reactions_insert on public.audiva_message_reactions;
drop policy if exists audiva_reactions_delete on public.audiva_message_reactions;
drop policy if exists audiva_notifications_read on public.audiva_notifications;
drop policy if exists audiva_notifications_update on public.audiva_notifications;
drop policy if exists audiva_social_activities_read on public.audiva_social_activities;
drop policy if exists audiva_social_activities_insert on public.audiva_social_activities;
drop policy if exists audiva_social_activities_delete on public.audiva_social_activities;
drop policy if exists audiva_activity_days_owner on public.audiva_activity_days;
drop policy if exists audiva_streaks_read on public.audiva_streaks;
drop policy if exists audiva_shared_stats_read on public.audiva_shared_stats;
drop policy if exists audiva_shared_stats_insert on public.audiva_shared_stats;
drop policy if exists audiva_shared_stats_update on public.audiva_shared_stats;
drop policy if exists audiva_shared_stats_delete on public.audiva_shared_stats;
drop policy if exists audiva_cleanup_service_only on public.audiva_storage_cleanup_jobs;

create policy audiva_profiles_read on public.audiva_profiles for select to authenticated
using (id = (select auth.uid()) or profile_visibility = 'public' or (profile_visibility = 'friends' and public.audiva_is_friend(id, (select auth.uid()))));
create policy audiva_profiles_insert on public.audiva_profiles for insert to authenticated with check (id = (select auth.uid()));
create policy audiva_profiles_update on public.audiva_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy audiva_profiles_delete on public.audiva_profiles for delete to authenticated using (id = (select auth.uid()));

create policy audiva_preferences_owner on public.audiva_user_preferences for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy audiva_connected_accounts_owner on public.audiva_connected_accounts for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy audiva_music_read on public.audiva_music_items for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.audiva_playlist_items pi where pi.music_item_id = id and public.audiva_can_view_playlist(pi.playlist_id, (select auth.uid()))
  )
);
create policy audiva_music_insert on public.audiva_music_items for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_library_metadata)
);
create policy audiva_music_update on public.audiva_music_items for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_library_metadata)
);
create policy audiva_music_delete on public.audiva_music_items for delete to authenticated using (user_id = (select auth.uid()));

create policy audiva_favorites_read on public.audiva_favorites for select to authenticated using (user_id = (select auth.uid()));
create policy audiva_favorites_insert on public.audiva_favorites for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_favorites)
);
create policy audiva_favorites_delete on public.audiva_favorites for delete to authenticated using (user_id = (select auth.uid()));
create policy audiva_recommendation_feedback_read on public.audiva_recommendation_feedback for select to authenticated using (user_id = (select auth.uid()));
create policy audiva_recommendation_feedback_insert on public.audiva_recommendation_feedback for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_recommendations)
);
create policy audiva_recommendation_feedback_delete on public.audiva_recommendation_feedback for delete to authenticated using (user_id = (select auth.uid()));
create policy audiva_listening_read on public.audiva_listening_events for select to authenticated using (user_id = (select auth.uid()));
create policy audiva_listening_insert on public.audiva_listening_events for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_listening_history)
);
create policy audiva_listening_delete on public.audiva_listening_events for delete to authenticated using (user_id = (select auth.uid()));

create policy audiva_playlists_read on public.audiva_playlists for select to authenticated using (public.audiva_can_view_playlist(id, (select auth.uid())));
create policy audiva_playlists_insert on public.audiva_playlists for insert to authenticated with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_playlists)
);
create policy audiva_playlists_update on public.audiva_playlists for update to authenticated using (owner_id = (select auth.uid())) with check (
  owner_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_playlists)
);
create policy audiva_playlists_delete on public.audiva_playlists for delete to authenticated using (owner_id = (select auth.uid()));

create policy audiva_playlist_items_read on public.audiva_playlist_items for select to authenticated using (public.audiva_can_view_playlist(playlist_id, (select auth.uid())));
create policy audiva_playlist_items_insert on public.audiva_playlist_items for insert to authenticated with check (
  added_by = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences pref where pref.user_id = (select auth.uid()) and pref.sync_playlists) and exists (
    select 1 from public.audiva_playlists p where p.id = playlist_id and (p.owner_id = (select auth.uid()) or exists (
      select 1 from public.audiva_playlist_collaborators c where c.playlist_id = p.id and c.user_id = (select auth.uid()) and c.role = 'editor'
    ))
  )
);
create policy audiva_playlist_items_update on public.audiva_playlist_items for update to authenticated using (
  exists (select 1 from public.audiva_playlists p where p.id = playlist_id and p.owner_id = (select auth.uid()))
) with check (exists (select 1 from public.audiva_playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())));
create policy audiva_playlist_items_delete on public.audiva_playlist_items for delete to authenticated using (
  exists (select 1 from public.audiva_playlists p where p.id = playlist_id and (p.owner_id = (select auth.uid()) or exists (
    select 1 from public.audiva_playlist_collaborators c where c.playlist_id = p.id and c.user_id = (select auth.uid()) and c.role = 'editor'
  )))
);

create policy audiva_playlist_collaborators_read on public.audiva_playlist_collaborators for select to authenticated using (
  user_id = (select auth.uid()) or public.audiva_can_view_playlist(playlist_id, (select auth.uid()))
);
create policy audiva_playlist_collaborators_manage on public.audiva_playlist_collaborators for all to authenticated
using (exists (select 1 from public.audiva_playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())))
with check (added_by = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences pref where pref.user_id = (select auth.uid()) and pref.sync_playlists) and exists (select 1 from public.audiva_playlists p where p.id = playlist_id and p.owner_id = (select auth.uid())));

create policy audiva_playlist_saves_read on public.audiva_playlist_saves for select to authenticated using (user_id = (select auth.uid()));
create policy audiva_playlist_saves_insert on public.audiva_playlist_saves for insert to authenticated with check (
  user_id = (select auth.uid()) and public.audiva_can_view_playlist(playlist_id, (select auth.uid())) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.sync_playlists)
);
create policy audiva_playlist_saves_delete on public.audiva_playlist_saves for delete to authenticated using (user_id = (select auth.uid()));

create policy audiva_friend_requests_parties on public.audiva_friend_requests for select to authenticated using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));
create policy audiva_friendships_parties on public.audiva_friendships for select to authenticated using (user_low = (select auth.uid()) or user_high = (select auth.uid()));
create policy audiva_blocks_owner on public.audiva_user_blocks for all to authenticated using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

create policy audiva_conversations_member_read on public.audiva_conversations for select to authenticated using (public.audiva_is_conversation_member(id, (select auth.uid())));
create policy audiva_members_read on public.audiva_conversation_members for select to authenticated using (public.audiva_is_conversation_member(conversation_id, (select auth.uid())));
create policy audiva_members_update_self on public.audiva_conversation_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy audiva_messages_read on public.audiva_messages for select to authenticated using (public.audiva_is_conversation_member(conversation_id, (select auth.uid())));
create policy audiva_messages_insert on public.audiva_messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and message_type <> 'system' and public.audiva_can_send_message(conversation_id, (select auth.uid()))
);
create policy audiva_messages_update_own on public.audiva_messages for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));

create policy audiva_attachments_read on public.audiva_message_attachments for select to authenticated using (
  exists (select 1 from public.audiva_messages m where m.id = message_id and public.audiva_is_conversation_member(m.conversation_id, (select auth.uid())))
);
create policy audiva_attachments_insert on public.audiva_message_attachments for insert to authenticated with check (
  uploader_id = (select auth.uid()) and exists (select 1 from public.audiva_messages m where m.id = message_id and m.sender_id = (select auth.uid()) and public.audiva_is_conversation_member(m.conversation_id, (select auth.uid())))
);
create policy audiva_attachments_delete on public.audiva_message_attachments for delete to authenticated using (uploader_id = (select auth.uid()));

create policy audiva_reactions_read on public.audiva_message_reactions for select to authenticated using (
  exists (select 1 from public.audiva_messages m where m.id = message_id and public.audiva_is_conversation_member(m.conversation_id, (select auth.uid())))
);
create policy audiva_reactions_insert on public.audiva_message_reactions for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_messages m where m.id = message_id and public.audiva_is_conversation_member(m.conversation_id, (select auth.uid())))
);
create policy audiva_reactions_delete on public.audiva_message_reactions for delete to authenticated using (user_id = (select auth.uid()));

create policy audiva_notifications_read on public.audiva_notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy audiva_notifications_update on public.audiva_notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy audiva_social_activities_read on public.audiva_social_activities for select to authenticated using (public.audiva_shares_activity(actor_id));
create policy audiva_social_activities_insert on public.audiva_social_activities for insert to authenticated with check (
  actor_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.allow_activity_sharing)
);
create policy audiva_social_activities_delete on public.audiva_social_activities for delete to authenticated using (actor_id = (select auth.uid()));
create policy audiva_activity_days_owner on public.audiva_activity_days for select to authenticated using (user_id = (select auth.uid()));
create policy audiva_streaks_read on public.audiva_streaks for select to authenticated using (
  user_id = (select auth.uid()) or public.audiva_shares_activity(user_id)
);

create policy audiva_shared_stats_read on public.audiva_shared_stats for select to authenticated using (
  user_id = (select auth.uid()) or visibility = 'public' or (visibility = 'friends' and public.audiva_is_friend(user_id, (select auth.uid())))
);
create policy audiva_shared_stats_insert on public.audiva_shared_stats for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.allow_activity_sharing)
);
create policy audiva_shared_stats_update on public.audiva_shared_stats for update to authenticated using (user_id = (select auth.uid())) with check (
  user_id = (select auth.uid()) and exists (select 1 from public.audiva_user_preferences p where p.user_id = (select auth.uid()) and p.allow_activity_sharing)
);
create policy audiva_shared_stats_delete on public.audiva_shared_stats for delete to authenticated using (user_id = (select auth.uid()));

create policy audiva_cleanup_service_only on public.audiva_storage_cleanup_jobs for all to service_role using (true) with check (true);

-- Restreindre les colonnes mutables dans les zones où une édition partielle est attendue.
revoke update on public.audiva_messages from authenticated;
grant update (body, payload, edited_at, deleted_at) on public.audiva_messages to authenticated;
revoke update on public.audiva_notifications from authenticated;
grant update (read_at) on public.audiva_notifications to authenticated;
