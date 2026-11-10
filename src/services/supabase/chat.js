import { supabase } from "./client";

export async function fetchConversations(userId) {
  const { data, error } = await supabase.from("conversations").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}
