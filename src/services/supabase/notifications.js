import { supabase } from "./client";

export async function fetchNotifications(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from("audiva_notifications").select("*").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data;
}
