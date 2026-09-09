import { supabase } from "./client";

export async function fetchNotifications(userId) {
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}
