import { supabase } from "./client";

export async function getUserById(id) {
  const { data, error } = await supabase.from("audiva_profiles").select("id,username,display_name,bio,avatar_path,profile_visibility").eq("id", id).single();
  if (error) throw error;
  return data;
}
