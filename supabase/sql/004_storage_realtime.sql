-- Audiva / Supabase — étape 4/4 : Storage et Realtime.
-- Créer dans Dashboard > Storage (ou via Storage API), en PRIVATE, les buckets :
--   audiva-avatars          : images jpeg/png/webp, 5 MB max
--   audiva-playlist-covers  : images jpeg/png/webp, 8 MB max
--   audiva-chat-media       : image/gif, image/webp, image/jpeg, image/png, 15 MB max
-- Les valeurs de taille/MIME sont à adapter au produit; aucun bucket n'est créé en SQL.
-- Convention de chemin : avatars/<uid>/<nom>, playlist-covers/<playlist-uuid>/<uid>/<nom>,
-- chat-media/<conversation-uuid>/<uid>/<nom>. N'y placer aucun fichier audio importé.

drop policy if exists audiva_avatar_read on storage.objects;
create policy audiva_avatar_read on storage.objects for select to authenticated
using (
  bucket_id = 'audiva-avatars'
  and exists (select 1 from public.audiva_profiles p where p.id = ((storage.foldername(name))[1])::uuid)
);
drop policy if exists audiva_avatar_insert on storage.objects;
create policy audiva_avatar_insert on storage.objects for insert to authenticated
with check (bucket_id = 'audiva-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists audiva_avatar_update on storage.objects;
create policy audiva_avatar_update on storage.objects for update to authenticated
using (bucket_id = 'audiva-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'audiva-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists audiva_avatar_delete on storage.objects;
create policy audiva_avatar_delete on storage.objects for delete to authenticated
using (bucket_id = 'audiva-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists audiva_playlist_cover_read on storage.objects;
create policy audiva_playlist_cover_read on storage.objects for select to authenticated
using (bucket_id = 'audiva-playlist-covers' and public.audiva_can_view_playlist(((storage.foldername(name))[1])::uuid, (select auth.uid())));
drop policy if exists audiva_playlist_cover_insert on storage.objects;
create policy audiva_playlist_cover_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'audiva-playlist-covers'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (select 1 from public.audiva_playlists p where p.id = ((storage.foldername(name))[1])::uuid and p.owner_id = (select auth.uid()))
);
drop policy if exists audiva_playlist_cover_update on storage.objects;
create policy audiva_playlist_cover_update on storage.objects for update to authenticated
using (bucket_id = 'audiva-playlist-covers' and (storage.foldername(name))[2] = (select auth.uid())::text)
with check (bucket_id = 'audiva-playlist-covers' and (storage.foldername(name))[2] = (select auth.uid())::text);
drop policy if exists audiva_playlist_cover_delete on storage.objects;
create policy audiva_playlist_cover_delete on storage.objects for delete to authenticated
using (bucket_id = 'audiva-playlist-covers' and (storage.foldername(name))[2] = (select auth.uid())::text);

drop policy if exists audiva_chat_media_read on storage.objects;
create policy audiva_chat_media_read on storage.objects for select to authenticated
using (bucket_id = 'audiva-chat-media' and public.audiva_is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid())));
drop policy if exists audiva_chat_media_insert on storage.objects;
create policy audiva_chat_media_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'audiva-chat-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and public.audiva_is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid()))
);
drop policy if exists audiva_chat_media_update on storage.objects;
create policy audiva_chat_media_update on storage.objects for update to authenticated
using (bucket_id = 'audiva-chat-media' and (storage.foldername(name))[2] = (select auth.uid())::text and public.audiva_is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid())))
with check (bucket_id = 'audiva-chat-media' and (storage.foldername(name))[2] = (select auth.uid())::text and public.audiva_is_conversation_member(((storage.foldername(name))[1])::uuid, (select auth.uid())));
drop policy if exists audiva_chat_media_delete on storage.objects;
create policy audiva_chat_media_delete on storage.objects for delete to authenticated
using (bucket_id = 'audiva-chat-media' and (storage.foldername(name))[2] = (select auth.uid())::text);

-- Workers de confiance consomment audiva_storage_cleanup_jobs puis appellent Storage API.
-- Ne jamais supprimer storage.objects directement par SQL.

-- Activer les changements de tables uniquement si la publication Supabase existe.
-- Realtime respecte les droits SELECT/RLS; ne pas publier les blobs ou données privées inutiles.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array[
      'audiva_messages', 'audiva_notifications', 'audiva_friend_requests',
      'audiva_friendships', 'audiva_playlists', 'audiva_playlist_items',
      'audiva_social_activities', 'audiva_streaks'
    ] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
