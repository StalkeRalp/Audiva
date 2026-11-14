-- Découverte paginée des profils qui acceptent les demandes d’amitié.
-- Exécuter après 005_app_integration.sql dans le SQL Editor Supabase.
-- Ne renvoie que les champs publics du profil et masque les comptes bloqués,
-- les amis existants et les demandes déjà ouvertes.

create or replace function public.audiva_discover_profiles(
  search_query text default '',
  page_offset integer default 0,
  page_size integer default 50
)
returns table(id uuid, username text, display_name text, bio text, avatar_path text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.bio, p.avatar_path
  from public.audiva_profiles p
  left join public.audiva_user_preferences pref on pref.user_id = p.id
  where auth.uid() is not null
    and p.id <> auth.uid()
    and coalesce(pref.allow_friend_requests, true)
    and (
      length(trim(coalesce(search_query, ''))) < 1
      or p.username ilike '%' || trim(both '@' from trim(search_query)) || '%'
      or p.display_name ilike '%' || trim(search_query) || '%'
    )
    and not exists (
      select 1 from public.audiva_user_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
    and not exists (
      select 1 from public.audiva_friendships f
      where (f.user_low = auth.uid() and f.user_high = p.id)
         or (f.user_low = p.id and f.user_high = auth.uid())
    )
    and not exists (
      select 1 from public.audiva_friend_requests r
      where r.status = 'pending'
        and ((r.requester_id = auth.uid() and r.addressee_id = p.id)
          or (r.requester_id = p.id and r.addressee_id = auth.uid()))
    )
  order by lower(p.username), p.id
  limit least(greatest(coalesce(page_size, 50), 1), 100)
  offset greatest(coalesce(page_offset, 0), 0);
$$;

revoke all on function public.audiva_discover_profiles(text, integer, integer) from public, anon;
grant execute on function public.audiva_discover_profiles(text, integer, integer) to authenticated;
