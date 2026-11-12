-- Audiva frontend integration additions. Safe to run repeatedly after 001-004.
-- Enables privacy-aware user discovery and per-user conversation hiding.

create or replace function public.audiva_search_profiles(search_query text)
returns table(id uuid, username text, display_name text, bio text, avatar_path text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.bio, p.avatar_path
  from public.audiva_profiles p
  join public.audiva_user_preferences pref on pref.user_id = p.id
  where auth.uid() is not null
    and length(trim(coalesce(search_query, ''))) >= 2
    and (p.username ilike '%' || trim(both '@' from trim(search_query)) || '%'
      or p.display_name ilike '%' || trim(search_query) || '%')
    and p.id <> auth.uid()
    and (p.profile_visibility = 'public' or pref.allow_friend_requests)
    and not exists (select 1 from public.audiva_user_blocks b where (b.blocker_id = auth.uid() and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  order by case when p.username ilike trim(both '@' from trim(search_query)) then 0 else 1 end, p.display_name
  limit 20;
$$;

create or replace function public.audiva_get_social_profiles(profile_ids uuid[])
returns table(id uuid, username text, display_name text, bio text, avatar_path text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.bio, p.avatar_path
  from public.audiva_profiles p
  where auth.uid() is not null and p.id = any(coalesce(profile_ids, array[]::uuid[]))
    and (
      p.id = auth.uid()
      or p.profile_visibility = 'public'
      or public.audiva_is_friend(p.id, auth.uid())
      or exists (select 1 from public.audiva_friend_requests r where r.status = 'pending' and ((r.requester_id = auth.uid() and r.addressee_id = p.id) or (r.requester_id = p.id and r.addressee_id = auth.uid())))
    )
    and not exists (select 1 from public.audiva_user_blocks b where (b.blocker_id = auth.uid() and b.blocked_id = p.id) or (b.blocker_id = p.id and b.blocked_id = auth.uid()))
  limit 100;
$$;

revoke all on function public.audiva_search_profiles(text) from public, anon;
revoke all on function public.audiva_get_social_profiles(uuid[]) from public, anon;
grant execute on function public.audiva_search_profiles(text) to authenticated;
grant execute on function public.audiva_get_social_profiles(uuid[]) to authenticated;

drop policy if exists audiva_notifications_delete_owner on public.audiva_notifications;
create policy audiva_notifications_delete_owner on public.audiva_notifications for delete to authenticated
using (recipient_id = (select auth.uid()));
grant delete on public.audiva_notifications to authenticated;

create table if not exists public.audiva_conversation_clears (
  conversation_id uuid not null references public.audiva_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cleared_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.audiva_conversation_clears enable row level security;
drop policy if exists audiva_conversation_clears_owner on public.audiva_conversation_clears;
create policy audiva_conversation_clears_owner on public.audiva_conversation_clears for all to authenticated
using (user_id = (select auth.uid()) and public.audiva_is_conversation_member(conversation_id, (select auth.uid())))
with check (user_id = (select auth.uid()) and public.audiva_is_conversation_member(conversation_id, (select auth.uid())));
grant select, insert, update, delete on public.audiva_conversation_clears to authenticated;

create table if not exists public.audiva_friend_invitations (
  token text primary key,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  check (accepted_by is null or accepted_by <> creator_id)
);
alter table public.audiva_friend_invitations enable row level security;

create or replace function public.audiva_create_friend_invitation()
returns text language plpgsql security definer set search_path = '' as $$
declare invitation_token text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  invitation_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.audiva_friend_invitations(token, creator_id) values (invitation_token, auth.uid());
  return invitation_token;
end;
$$;

create or replace function public.audiva_accept_friend_invitation(invitation_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invite public.audiva_friend_invitations%rowtype; new_conversation uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into invite from public.audiva_friend_invitations i where i.token = invitation_token for update;
  if not found or invite.expires_at <= now() or invite.accepted_by is not null then raise exception 'Invitation expired or already used'; end if;
  if invite.creator_id = auth.uid() then raise exception 'Cannot accept your own invitation'; end if;
  if exists (select 1 from public.audiva_user_blocks b where (b.blocker_id = auth.uid() and b.blocked_id = invite.creator_id) or (b.blocker_id = invite.creator_id and b.blocked_id = auth.uid())) then raise exception 'Invitation unavailable'; end if;
  update public.audiva_friend_invitations set accepted_by = auth.uid(), accepted_at = now() where token = invitation_token;
  insert into public.audiva_friend_requests(requester_id, addressee_id, status, responded_at)
  values (invite.creator_id, auth.uid(), 'accepted', now())
  on conflict (requester_id, addressee_id) do update set status = 'accepted', responded_at = now();
  insert into public.audiva_friendships(user_low, user_high)
  values (least(invite.creator_id, auth.uid()), greatest(invite.creator_id, auth.uid())) on conflict do nothing;
  new_conversation := public.audiva_create_direct_conversation(invite.creator_id);
  return new_conversation;
end;
$$;

revoke all on function public.audiva_create_friend_invitation() from public, anon;
revoke all on function public.audiva_accept_friend_invitation(text) from public, anon;
grant execute on function public.audiva_create_friend_invitation() to authenticated;
grant execute on function public.audiva_accept_friend_invitation(text) to authenticated;
