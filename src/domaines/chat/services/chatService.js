import { getSupabaseBrowserClient } from "@/services/supabase/client";
import { loadSocialCloud, persistMessage } from "@/domaines/social/services/supabaseSocial";

export async function fetchConversations(userId) {
  if (!userId) return [];
  return (await loadSocialCloud(userId)).conversations;
}

export async function sendMessage(conversationId, message) {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("Connectez-vous pour envoyer un message.");
  return persistMessage(conversationId, typeof message === "string" ? { text: message } : message, user.id);
}
