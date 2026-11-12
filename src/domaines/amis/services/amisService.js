import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { loadSocialCloud, createFriendRequest } from "@/domaines/social/services/supabaseSocial";

export async function getAmis(userId) {
  if (!userId) return [];
  return (await loadSocialCloud(userId)).friends;
}

export async function sendFriendRequest(userId) {
  return createFriendRequest(userId);
}

export async function findAmis(query) {
  const { searchProfiles } = await import("@/domaines/social/services/supabaseSocial");
  return searchProfiles(query);
}

export async function currentUserId() {
  const { data, error } = await getSupabaseBrowserClient().auth.getUser();
  if (error) throw error;
  return data.user?.id || null;
}
