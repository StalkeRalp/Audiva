import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowId = url.searchParams.get("sb_flow_id");
  const requested = url.searchParams.get("next") || "/accueil";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/accueil";
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/authentification/connexion?erreur=configuration", url.origin));
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.warn("[auth/callback] Supabase session exchange failed:", error.code || error.name || "unknown_error");
  }
  return NextResponse.redirect(new URL("/authentification/connexion?erreur=confirmation", url.origin));
}
