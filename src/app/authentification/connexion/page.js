"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { getAuthSuccessPath, loginWithEmail, signInWithGoogle, signInWithSpotify } from "@/domaines/authentification/services/authService";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";

function EmailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.8 12.23c0-.7-.06-1.37-.18-2H12v3.77h5.5a4.7 4.7 0 0 1-2.04 3.08v2.52h3.24c1.9-1.75 3.1-4.34 3.1-7.37Z" />
      <path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.7-2.4l-3.24-2.52c-.9.6-2.05.96-3.46.96-2.65 0-4.9-1.79-5.7-4.2H3.96v2.6A10.12 10.12 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.84a6.1 6.1 0 0 1 0-3.68V7.57H3.96a10 10 0 0 0 0 8.86l2.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.53 0 2.9.53 3.98 1.57l2.98-2.98C17.05 2.77 14.74 2 12 2a10.12 10.12 0 0 0-8.04 5.57L6.3 10.16c.8-2.41 3.05-4.2 5.7-4.2Z" />
    </svg>
  );
}

function subscribeToHashChange(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getLocationHash() {
  return window.location.hash;
}

function getSpotifyOAuthError(hash) {
  if (!hash) return "";
  const params = new URLSearchParams(hash.slice(1));
  const description = params.get("error_description") || "";
  if (params.get("error_code") === "unexpected_failure" && /user profile from external provider/i.test(description)) {
    return "Spotify a autorisé la connexion, mais Supabase n’a pas pu lire le profil. Dans Spotify Developer Dashboard, ajoute l’adresse e-mail exacte de ce compte dans ton application → Users Management. En mode Développement, le compte propriétaire doit aussi avoir Spotify Premium.";
  }
  if (params.get("error") === "access_denied") return "La connexion Spotify a été annulée.";
  return description ? `La connexion Spotify a échoué : ${description}` : "";
}

export default function ConnexionPage() {
  return <Suspense fallback={<main className="h-dvh bg-[#060b18]" />}><ConnexionForm /></Suspense>;
}

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackHash = useSyncExternalStore(subscribeToHashChange, getLocationHash, () => "");
  const [busy, setBusy] = useState(false);
  const redirectPath = getAuthSuccessPath(`?${searchParams.toString()}`);
  const providerError = useMemo(() => getSpotifyOAuthError(callbackHash), [callbackHash]);
  const [error, setError] = useState(() => {
    const code = searchParams.get("erreur");
    return code ? code === "configuration" ? "Supabase n’est pas configuré dans .env." : "Le lien de confirmation a expiré ou n’est plus valide. Réessayez." : "";
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { await loginWithEmail(String(form.get("email") || ""), String(form.get("password") || "")); router.replace(redirectPath); }
    catch (reason) { setError(reason.message || "Connexion impossible."); }
    finally { setBusy(false); }
  }
  async function googleLogin() { setBusy(true); setError(""); try { await signInWithGoogle(redirectPath); } catch (reason) { setError(reason.message || "Connexion Google indisponible."); setBusy(false); } }
  async function spotifyLogin() { setBusy(true); setError(""); try { await signInWithSpotify(redirectPath); } catch (reason) { setError(reason.message || "Connexion Spotify indisponible. Vérifiez que Spotify est activé dans Supabase."); setBusy(false); } }
  const visibleError = providerError || error;

  return (
    <main className="audiva-auth grid h-dvh overflow-hidden bg-[#060b18] text-white lg:grid-cols-[43.2%_56.8%]">
      <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#060b18] px-5 py-3 sm:px-10 lg:px-14 xl:px-20">
        <AuthAmbient />
        <div className="relative z-10 w-full max-w-[420px]">
          <Image
            src="/logoAudiva4png"
            alt="Audiva"
            width={1254}
            height={1254}
            priority
            className="auth-brand-mark mx-auto mb-2 h-auto w-36 sm:mb-3 sm:w-40"
          />
          <p className="-mt-2 mb-5 text-center text-[10px] font-semibold uppercase tracking-[.28em] text-[#8ba2bb] sm:mb-6 sm:text-left">AUDIVA · LE SON DE VOTRE HISTOIRE</p>

          <h1 className="text-center font-sans text-3xl font-bold tracking-tight sm:text-left sm:text-4xl">On reprend là où la musique vous a mené ?</h1>
          <p className="mt-2 max-w-md text-center text-sm leading-5 text-white/70 sm:text-left">
            Retrouvez vos morceaux, vos découvertes et les gens avec qui les partager.
          </p>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
            <label className="block text-base font-semibold">
              <span className="mb-2 block text-sm">Adresse e-mail</span>
              <span className="flex items-center gap-3 border-b border-white/25 px-0 py-3 text-[#a6f6ef] transition focus-within:border-[#72eee7]">
                <EmailIcon />
                <input required type="email" name="email" autoComplete="email" placeholder="vous@exemple.com" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
              </span>
            </label>

            <label className="block text-base font-semibold">
              <span className="mb-2 block text-sm">Mot de passe</span>
              <span className="flex items-center gap-3 border-b border-white/25 px-0 py-3 text-[#a6f6ef] transition focus-within:border-[#72eee7]">
                <input required type="password" name="password" autoComplete="current-password" placeholder="Votre mot de passe" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
                <EyeIcon />
              </span>
            </label>

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#76eee9] px-6 py-3 font-bold text-[#071523] transition hover:bg-[#a6f6ef] disabled:opacity-60">
              {busy ? "Connexion…" : "Se connecter"}
            </button>
          </form>
          <Link className="mt-2 block text-right text-xs text-[#a6f6ef] hover:text-white" href="/authentification/mot-de-passe-oublie">Mot de passe oublié ?</Link>
          {visibleError && <p role="alert" className="mt-4 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{visibleError}</p>}

          <div className="my-3 flex items-center gap-3 text-[10px] text-white/40">
            <span className="h-px flex-1 bg-white/15" />
            <span>OU CONTINUER AVEC</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <button type="button" disabled={busy} onClick={spotifyLogin} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1ed760] px-6 py-3 text-sm font-bold text-[#071523] transition hover:bg-[#52e787] disabled:opacity-60">
            <Image src="/spotify12.png" alt="" width={23} height={23} className="object-contain" /> Se connecter avec Spotify
          </button>
          <button type="button" disabled={busy} onClick={googleLogin} className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[.06] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
            <GoogleIcon />
            Continuer avec Google
          </button>

          <p className="mt-3 text-center text-sm text-white/60">
            Nouveau sur Audiva ?{" "}
            <Link href={`/authentification/inscription?next=${encodeURIComponent(redirectPath)}`} className="font-sans font-bold text-[#9a37ff] hover:text-[#b36cff]">
              Créer un compte
            </Link>
          </p>
        </div>
      </section>

      <section className="auth-hero-image relative hidden h-dvh overflow-hidden lg:block">
        <Image src="/image-login.jpg" alt="Auditrice tenant un vinyle" fill priority sizes="57vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/90 via-[#07111e]/5 to-[#07111e]/20" />
        <div className="auth-hero-copy absolute inset-x-0 bottom-0 p-12 xl:p-16"><span className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6f6ef]">AUDIVA · VOTRE UNIVERS MUSICAL</span><p className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">Chaque écoute raconte quelque chose.</p><p className="mt-4 max-w-md text-sm leading-6 text-white/75">Retrouvez votre musique, vos découvertes et votre cercle au même endroit.</p></div>
      </section>
    </main>
  );
}
