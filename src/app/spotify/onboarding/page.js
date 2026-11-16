"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkCircle02Icon, HeadphonesIcon, MusicNote01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";
import { AuthBrand } from "@/domaines/authentification/composants/AuthBrand";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/services/supabase/client";
import { authorizeSpotify, hasSpotifyDataConsent, hasSpotifySession, saveSpotifyDataConsent, spotifyRequest, storeSpotifyProviderSession, spotifyOAuthScopes } from "@/domaines/statistiques/services/spotify";

function safeNext(value) { return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/spotify/onboarding") ? value : "/accueil"; }

export default function SpotifyOnboardingPage() {
  const router = useRouter();
  const [stage, setStage] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [next, setNext] = useState("/accueil");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      const params = new URLSearchParams(window.location.search);
      const destination = safeNext(params.get("next"));
      if (active) setNext(destination);
      if (!isSupabaseConfigured) { if (active) { setError("Supabase n’est pas configuré pour cette session."); setStage("connect"); } return; }
      const client = getSupabaseBrowserClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session?.user) {
        const onboardingPath = `/spotify/onboarding?next=${encodeURIComponent(destination)}`;
        router.replace(`/authentification/connexion?next=${encodeURIComponent(onboardingPath)}`);
        return;
      }
      if (active) setUserId(session.user.id);
      storeSpotifyProviderSession(session);
      try {
        if (!hasSpotifySession()) throw new Error("Spotify non associé");
        const spotifyProfile = await spotifyRequest("me");
        if (!active) return;
        const [preferencesResult, linkedResult] = await Promise.all([
          client.from("audiva_user_preferences").select("preferences").eq("user_id", session.user.id).maybeSingle(),
          client.from("audiva_connected_accounts").select("provider_user_id").eq("user_id", session.user.id).eq("provider", "spotify").maybeSingle(),
        ]);
        if (preferencesResult.error) throw preferencesResult.error;
        if (linkedResult.error) throw linkedResult.error;
        const preferences = preferencesResult.data;
        const linkedAccount = linkedResult.data;
        const cloudConsent = preferences?.preferences?.spotify_data_consent?.accepted_at;
        const linked = linkedAccount?.provider_user_id === spotifyProfile.id;
        if (linked && (cloudConsent || hasSpotifyDataConsent(session.user.id))) router.replace(destination);
        else setStage("consent");
      } catch (reason) {
        if (active) {
          if (reason.message !== "Spotify non associé") setError(reason.message || "Impossible de vérifier votre association Spotify.");
          setStage("connect");
        }
      }
    };
    prepare().catch(reason => { if (active) { setError(reason.message || "Impossible de préparer votre accès Spotify."); setStage("connect"); } });
    return () => { active = false; };
  }, [router]);

  async function beginSpotifyConnection() {
    setBusy(true); setError("");
    try { await authorizeSpotify({ returnTo: `/spotify/onboarding?next=${encodeURIComponent(next)}`, expectedUserId: userId }); }
    catch (reason) { setError(reason.message || "Impossible de démarrer la connexion Spotify."); setBusy(false); }
  }

  async function acceptSpotifyDataUse() {
    setBusy(true); setError("");
    try {
      const client = getSupabaseBrowserClient();
      if (!userId || !hasSpotifySession()) throw new Error("Reconnectez votre compte Spotify avant de confirmer l’association.");

      // Verify the Spotify token against Spotify itself, then link its stable account ID to this Audiva user.
      const spotifyProfile = await spotifyRequest("me");
      if (!spotifyProfile?.id) throw new Error("Spotify n’a pas renvoyé l’identifiant de votre compte.");
      const { data: existingLink, error: linkReadError } = await client.from("audiva_connected_accounts")
        .select("provider_user_id").eq("user_id", userId).eq("provider", "spotify").maybeSingle();
      if (linkReadError) throw linkReadError;
      if (existingLink && existingLink.provider_user_id !== spotifyProfile.id) {
        throw new Error("Un autre compte Spotify est déjà associé à ce compte Audiva. Déconnectez-le avant d’en associer un nouveau.");
      }
      if (!existingLink) {
        const { error: linkError } = await client.from("audiva_connected_accounts").insert({
          user_id: userId,
          provider: "spotify",
          provider_user_id: spotifyProfile.id,
          display_name: spotifyProfile.display_name || null,
          metadata: { uri: spotifyProfile.uri || null },
        });
        if (linkError?.code === "23505") throw new Error("Ce compte Spotify est déjà associé à un autre compte Audiva.");
        if (linkError) throw linkError;
      }

      const { data: preferences, error: readError } = await client.from("audiva_user_preferences")
        .select("preferences").eq("user_id", userId).maybeSingle();
      if (readError) throw readError;
      const consent = { accepted_at: new Date().toISOString(), scopes: spotifyOAuthScopes.split(" ") };
      const { error: saveError } = await client.from("audiva_user_preferences").upsert({
        user_id: userId,
        preferences: { ...(preferences?.preferences || {}), spotify_data_consent: consent },
      }, { onConflict: "user_id" });
      if (saveError) throw saveError;
      saveSpotifyDataConsent(userId);
      router.replace(next);
    } catch (reason) { setError(reason.message || "Impossible d’enregistrer votre accord. Réessayez."); }
    finally { setBusy(false); }
  }

  return <main className="audiva-auth relative grid h-dvh overflow-hidden bg-[#060b18] text-white lg:grid-cols-[43.2%_56.8%]">
    <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#060b18] px-5 py-5 sm:px-10 lg:px-14 xl:px-20">
      <AuthAmbient />
      <div className="relative z-10 w-full max-w-[470px]">
        <AuthBrand className="mx-auto mb-4 h-auto w-36 sm:mx-0 sm:w-40" />
        <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#8ba2bb]">VOTRE MUSIQUE, DANS AUDIVA</p>
        {stage === "checking" ? <><h1 className="mt-5 text-3xl font-bold">Préparation de votre espace…</h1><p className="mt-3 text-sm text-[#aebbd0]">Nous vérifions votre connexion Spotify.</p></> : stage === "connect" ? <>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Retrouvez votre Spotify dans Audiva.</h1>
          <p className="mt-4 text-sm leading-6 text-[#aebbd0]">Connectez Spotify une fois pour retrouver vos titres, artistes, playlists et recommandations personnalisées ici, dans votre application.</p>
          <div className="mt-6 space-y-3 text-sm text-[#c6d2e3]"><p className="flex items-center gap-3"><HugeiconsIcon icon={MusicNote01Icon} size={18} className="text-[#72eee7]"/>Profil, titres et artistes favoris, écoutes récentes</p><p className="flex items-center gap-3"><HugeiconsIcon icon={MusicNote01Icon} size={18} className="text-[#72eee7]"/>Playlists, bibliothèque et artistes suivis</p><p className="flex items-center gap-3"><HugeiconsIcon icon={HeadphonesIcon} size={18} className="text-[#72eee7]"/>Lecture et commandes compatibles avec Spotify</p><p className="flex items-center gap-3"><HugeiconsIcon icon={Shield01Icon} size={18} className="text-[#72eee7]"/>Spotify affiche la liste complète avant votre accord</p></div>
          <button type="button" onClick={beginSpotifyConnection} disabled={busy} className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-[#1ed760] px-5 py-3.5 font-bold text-[#071523] transition hover:bg-[#52e787] disabled:opacity-60"><Image src="/spotify12.png" alt="" width={22} height={22}/> {busy ? "Redirection vers Spotify…" : "Connecter Spotify"}</button>
        </> : <>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Vos données Spotify, votre choix.</h1>
          <p className="mt-4 text-sm leading-6 text-[#aebbd0]">Pour relier votre compte, Audiva demande en une seule autorisation les accès Spotify nécessaires à l’affichage de votre profil, de vos titres et artistes favoris, de vos écoutes récentes, de vos playlists et de votre bibliothèque, ainsi qu’au contrôle de lecture compatible. Spotify affiche et valide la liste complète des autorisations.</p>
          <div className="mt-6 border-l-2 border-[#72eee7] bg-white/[.035] px-4 py-3 text-sm leading-6 text-[#c6d2e3]">Audiva utilise ces données pour afficher votre musique, personnaliser les découvertes et faire fonctionner le lecteur. L’accord et les préférences sont associés à votre compte Audiva. Aucun fichier audio Spotify n’est téléversé. Vous pouvez retirer l’accès depuis les réglages de votre compte Spotify.</div>
          <button type="button" onClick={acceptSpotifyDataUse} disabled={busy} className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#72eee7] px-5 py-3.5 font-bold text-[#061426] transition hover:bg-[#a6f6ef] disabled:opacity-60"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={19}/>{busy ? "Association du compte…" : "OK, j’accepte"}<HugeiconsIcon icon={ArrowRight01Icon} size={17}/></button>
        </>}
        {error && <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
      </div>
    </section>
    <section className="auth-hero-image relative hidden h-dvh overflow-hidden lg:block"><Image src="/recherche2.jpg" alt="Collection de disques et découverte musicale" fill priority sizes="57vw" className="object-cover object-[65%_center]"/><div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/90 via-[#07111e]/10 to-[#07111e]/20"/><div className="auth-hero-copy absolute inset-x-0 bottom-0 p-12 xl:p-16"><span className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6f6ef]">AUDIVA × SPOTIFY</span><p className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">Tout votre univers musical, réuni.</p><p className="mt-4 max-w-md text-sm leading-6 text-white/75">Vous gardez la main sur les accès que vous accordez et sur les données utilisées.</p></div></section>
  </main>;
}
