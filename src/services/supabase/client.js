import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = Boolean(url && anonKey);

let browserClient;
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) throw new Error("Supabase n’est pas configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.");
  browserClient ||= createBrowserClient(url, anonKey, {
    auth: { experimental: { appendPkceFlowIdToRedirects: true } },
  });
  return browserClient;
}

// Backward-compatible named export for existing feature services.
export const supabase = new Proxy({}, {
  get(_target, property) {
    const client = getSupabaseBrowserClient();
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
