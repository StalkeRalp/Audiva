import { getSupabaseBrowserClient } from "@/services/supabase/client";

export async function loadCloudAccount(userId) {
  const client = getSupabaseBrowserClient();
  const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }] = await Promise.all([
    client.from("audiva_profiles").select("id,username,display_name,bio,avatar_path,profile_visibility").eq("id", userId).single(),
    client.from("audiva_user_preferences").select("*").eq("user_id", userId).single(),
  ]);
  if (profileError) throw profileError;
  if (preferencesError) throw preferencesError;
  let avatar = "";
  if (profile.avatar_path) {
    const { data } = await client.storage.from("audiva-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatar = data?.signedUrl || "";
  }
  return { profile: { name: profile.display_name || "", email: (await client.auth.getUser()).data.user?.email || "", bio: profile.bio || "", avatar, avatarPath: profile.avatar_path || "", username: profile.username }, preferences };
}

export async function saveCloudAccount(userId, profile, localPreferences, cloudPreferences) {
  const client = getSupabaseBrowserClient();
  const { data: old, error: readError } = await client.from("audiva_profiles").select("avatar_path").eq("id", userId).single();
  if (readError) throw readError;
  let avatarPath = profile.avatarPath || null;
  if (profile.avatar?.startsWith("data:image/")) {
    const blob = await (await fetch(profile.avatar)).blob();
    const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
    avatarPath = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from("audiva-avatars").upload(avatarPath, blob, { contentType: blob.type, upsert: false });
    if (error) throw error;
  } else if (!profile.avatar) avatarPath = null;

  const { error: profileError } = await client.from("audiva_profiles").update({ display_name: profile.name.trim(), bio: String(profile.bio || "").trim(), avatar_path: avatarPath }).eq("id", userId);
  if (profileError) throw profileError;
  const { error: prefsError } = await client.from("audiva_user_preferences").update({
    allow_friend_requests: Boolean(localPreferences.allowFriends),
    allow_activity_sharing: Boolean(localPreferences.showStats),
    allow_notifications: Boolean(localPreferences.newMessages),
    sync_library_metadata: Boolean(cloudPreferences.sync_library_metadata),
    sync_listening_history: Boolean(cloudPreferences.sync_listening_history),
    sync_favorites: Boolean(cloudPreferences.sync_favorites),
    sync_playlists: Boolean(cloudPreferences.sync_playlists),
    sync_recommendations: Boolean(cloudPreferences.sync_recommendations),
    preferences: localPreferences,
  }).eq("user_id", userId);
  if (prefsError) throw prefsError;
  if (old.avatar_path && old.avatar_path !== avatarPath) await client.storage.from("audiva-avatars").remove([old.avatar_path]);
  return avatarPath;
}
