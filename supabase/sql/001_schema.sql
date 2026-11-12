-- Audiva / Supabase — étape 1/4 : modèle applicatif additif.
-- Aucun blob audio, URL blob:, jeton OAuth ou donnée de démonstration n'est stocké ici.
-- Réexécutable : CREATE TABLE/INDEX IF NOT EXISTS.

create table if not exists public.audiva_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_path text check (avatar_path is null or avatar_path !~* '^(https?://|data:|blob:)'),
  profile_visibility text not null default 'friends' check (profile_visibility in ('private','friends','public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audiva_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sync_library_metadata boolean not null default false,
  sync_listening_history boolean not null default false,
  sync_favorites boolean not null default false,
  sync_playlists boolean not null default false,
  sync_recommendations boolean not null default false,
  allow_friend_requests boolean not null default true,
  allow_activity_sharing boolean not null default false,
  allow_notifications boolean not null default true,
  time_zone text not null default 'UTC',
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  updated_at timestamptz not null default now()
);

-- Identité externe uniquement : aucun access/refresh token OAuth n'est conservé.
create table if not exists public.audiva_connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('spotify')),
  provider_user_id text not null,
  display_name text,
  linked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and metadata::text !~* '(access.?token|refresh.?token|code.?verifier|blob:|data:|stream.?url)'),
  unique (provider, provider_user_id),
  unique (user_id, provider)
);

create table if not exists public.audiva_music_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('local','spotify','external')),
  source_item_id text,
  media_type text not null default 'track' check (media_type in ('track','episode','video')),
  title text not null,
  artist text not null default '',
  album text not null default '',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  cover_url text check (cover_url is null or cover_url ~* '^https?://'),
  local_fingerprint text,
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
    and not (metadata ?| array['file','blob','streamUrl','stream_url','access_token','refresh_token','spotify_access_token'])
    and metadata::text !~* '(blob:|data:|stream.?url|access.?token|refresh.?token|code.?verifier)'
  ),
  check (source <> 'local' or cover_url is null),
  check (local_fingerprint is null or source = 'local'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source, source_item_id),
  unique (user_id, local_fingerprint)
);

create table if not exists public.audiva_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  music_item_id uuid not null references public.audiva_music_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, music_item_id)
);

create table if not exists public.audiva_recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('spotify','audiva','external')),
  source_item_id text not null,
  feedback text not null check (feedback in ('like','dismiss','not_interested','played')),
  created_at timestamptz not null default now(),
  unique (user_id, source, source_item_id, feedback)
);

create table if not exists public.audiva_listening_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  music_item_id uuid references public.audiva_music_items(id) on delete set null,
  source text not null check (source in ('local','spotify','external')),
  title text not null,
  artist text not null default '',
  played_at timestamptz not null default now(),
  listened_seconds integer not null default 0 check (listened_seconds >= 0),
  qualified boolean not null default false,
  local_day date not null default (now() at time zone 'utc')::date,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and metadata::text !~* '(blob:|data:|stream.?url|access.?token|refresh.?token)')
);

create table if not exists public.audiva_playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  visibility text not null default 'private' check (visibility in ('private','friends','public')),
  cover_path text check (cover_path is null or cover_path !~* '^(https?://|data:|blob:)'),
  source text not null default 'audiva' check (source in ('audiva','spotify_import')),
  source_playlist_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and metadata::text !~* '(blob:|data:|stream.?url|access.?token|refresh.?token)'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audiva_playlist_items (
  playlist_id uuid not null references public.audiva_playlists(id) on delete cascade,
  music_item_id uuid not null references public.audiva_music_items(id) on delete cascade,
  position integer not null check (position >= 0),
  added_by uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (playlist_id, music_item_id),
  unique (playlist_id, position)
);

create table if not exists public.audiva_playlist_collaborators (
  playlist_id uuid not null references public.audiva_playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor','viewer')),
  added_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);

create table if not exists public.audiva_playlist_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id uuid not null references public.audiva_playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);

create table if not exists public.audiva_friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);

create table if not exists public.audiva_friendships (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_low, user_high),
  check (user_low < user_high)
);

create table if not exists public.audiva_user_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.audiva_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct','group')),
  created_by uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audiva_conversation_members (
  conversation_id uuid not null references public.audiva_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  muted boolean not null default false,
  primary key (conversation_id, user_id)
);

create table if not exists public.audiva_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.audiva_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_type text not null check (message_type in ('text','gif','sticker','track','playlist','system')),
  body text not null default '',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and payload::text !~* '(blob:|data:|access.?token|refresh.?token|stream.?url)'),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  check (length(body) <= 10000)
);

create table if not exists public.audiva_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.audiva_messages(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  storage_path text,
  external_url text,
  source text not null check (source in ('storage','external')),
  mime_type text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  source_name text,
  license text,
  attribution text,
  created_at timestamptz not null default now(),
  check (
    (source = 'storage' and storage_path is not null and storage_path !~* '^(https?://|data:|blob:)' and external_url is null)
    or (source = 'external' and storage_path is null and external_url ~* '^https?://')
  )
);

create table if not exists public.audiva_message_reactions (
  message_id uuid not null references public.audiva_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (length(reaction) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, reaction)
);

create table if not exists public.audiva_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('friend_request','friend_accepted','message','playlist_shared','streak','reaction','system')),
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object' and payload::text !~* '(blob:|data:|access.?token|refresh.?token)'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.audiva_social_activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('listened','playlist_created','playlist_shared','streak_milestone','shared_stats')),
  music_item_id uuid references public.audiva_music_items(id) on delete set null,
  playlist_id uuid references public.audiva_playlists(id) on delete set null,
  summary jsonb not null default '{}'::jsonb check (jsonb_typeof(summary) = 'object' and summary::text !~* '(blob:|data:|access.?token|refresh.?token|stream.?url)'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create table if not exists public.audiva_activity_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_day date not null,
  qualified_listens integer not null default 0 check (qualified_listens >= 0),
  messages_sent integer not null default 0 check (messages_sent >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, activity_day)
);

-- Le journal journalier est la source de vérité ; ce résumé est recalculable.
create table if not exists public.audiva_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_days integer not null default 0 check (current_days >= 0),
  longest_days integer not null default 0 check (longest_days >= 0),
  last_activity_day date,
  updated_at timestamptz not null default now()
);

create table if not exists public.audiva_shared_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('week','month','year','custom')),
  period_start date not null,
  period_end date not null,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and snapshot::text !~* '(blob:|data:|access.?token|refresh.?token|stream.?url)'),
  visibility text not null default 'friends' check (visibility in ('private','friends','public')),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists public.audiva_storage_cleanup_jobs (
  id bigint generated by default as identity primary key,
  bucket_id text not null,
  object_path text not null,
  queued_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  unique (bucket_id, object_path)
);

create index if not exists audiva_music_items_user_idx on public.audiva_music_items(user_id, updated_at desc);
create index if not exists audiva_recommendation_feedback_user_idx on public.audiva_recommendation_feedback(user_id, created_at desc);
create index if not exists audiva_music_items_source_idx on public.audiva_music_items(user_id, source, source_item_id);
create index if not exists audiva_listening_user_time_idx on public.audiva_listening_events(user_id, played_at desc);
create index if not exists audiva_listening_day_idx on public.audiva_listening_events(user_id, local_day);
create index if not exists audiva_playlists_owner_idx on public.audiva_playlists(owner_id, updated_at desc);
create index if not exists audiva_playlist_items_order_idx on public.audiva_playlist_items(playlist_id, position);
create index if not exists audiva_friend_requests_recipient_idx on public.audiva_friend_requests(addressee_id, status, created_at desc);
create index if not exists audiva_conversation_members_user_idx on public.audiva_conversation_members(user_id, conversation_id);
create index if not exists audiva_messages_conversation_idx on public.audiva_messages(conversation_id, created_at desc);
create index if not exists audiva_messages_sender_idx on public.audiva_messages(sender_id, created_at desc);
create index if not exists audiva_notifications_recipient_idx on public.audiva_notifications(recipient_id, created_at desc);
create index if not exists audiva_social_activities_actor_idx on public.audiva_social_activities(actor_id, created_at desc);
create index if not exists audiva_shared_stats_visibility_idx on public.audiva_shared_stats(visibility, created_at desc);
create index if not exists audiva_cleanup_pending_idx on public.audiva_storage_cleanup_jobs(queued_at) where processed_at is null;

-- Vue invocateur sécurisé : l'agrégat respecte les politiques RLS de la table source.
create or replace view public.audiva_my_listening_summary
with (security_invoker = true) as
select user_id,
       count(*) filter (where qualified) as qualified_plays,
       coalesce(sum(listened_seconds), 0)::bigint as listened_seconds,
       count(distinct music_item_id) as distinct_items,
       max(played_at) as last_played_at
from public.audiva_listening_events
where user_id = (select auth.uid())
group by user_id;
