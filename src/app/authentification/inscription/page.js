"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthSuccessPath, registerWithEmail, resendSignupOtp, signInWithGoogle, signInWithSpotify, verifySignupOtp } from "@/domaines/authentification/services/authService";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";
import { AuthBrand } from "@/domaines/authentification/composants/AuthBrand";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import AuthPasswordField from "@/domaines/authentification/composants/AuthPasswordField";
import { isEmailVerified } from "@/domaines/authentification/services/emailVerification";

function EmailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.8 12.23c0-.7-.06-1.37-.18-2H12v3.77h5.5a4.7 4.7 0 0 1-2.04 3.08v2.52h3.24c1.9-1.75 3.1-4.34 3.1-7.37Z" />
      <path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.7-2.4l-3.24-2.52c-.9.6-2.05.96-3.46.96-2.65 0-4.9-1.79-5.7-4.2H3.96v2.6A10.12 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.84a6.1 6.1 0 0 1 0-3.68V7.57H3.96a10 10 0 0 0 0 8.86l2.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.53 0 2.9.53 3.98 1.57l2.98-2.98C17.05 2.77 14.74 2 12 2a10.12 10.12 0 0 0-8.04 5.57L6.3 10.16c.8-2.41 3.05-4.2 5.7-4.2Z" />
    </svg>
  );
}

function Field({ children, label, type = "text", name, autoComplete, icon }) {
  if (type === "password") return <AuthPasswordField label={label} name={name} autoComplete={autoComplete} placeholder={children} className="text-base" lineClassName="py-2.5" minLength={8} />;
  return (
    <label className="block text-base font-semibold">
      <span className="mb-1.5 block text-sm">{label}</span>
      <span className="flex items-center gap-3 border-b border-white/25 px-0 py-2.5 text-[#a6f6ef] transition focus-within:border-[#72eee7]">
        {icon}
        <input required type={type} name={name} autoComplete={autoComplete} placeholder={children} className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
      </span>
    </label>
  );
}

function explainSignupError(error) {
  if (error?.code === "email_address_not_authorized") {
    return "Supabase bloque cet envoi : avec le service e-mail par défaut, seuls les membres de l’équipe du projet peuvent recevoir les confirmations. Configurez un serveur SMTP personnalisé dans Supabase pour envoyer aux autres adresses.";
  }
  if (error?.code === "over_email_send_rate_limit") {
    return "Supabase limite temporairement les renvois de code pour cette adresse. Attendez le délai indiqué avant de réessayer. Cette protection ne peut pas être supprimée depuis Audiva.";
  }
  if (error?.status === 429 || error?.code === "over_request_rate_limit") {
    return "Supabase limite temporairement les demandes depuis cette connexion. Attendez quelques minutes avant de réessayer.";
  }
  if (/error sending confirmation email/i.test(error?.message || "")) {
    return "Supabase n’a pas réussi à envoyer le code. Vérifiez Authentication → Logs. Si le hook EmailJS est activé, contrôlez ses secrets, ses journaux et les variables du modèle; sinon, configurez un SMTP personnalisé dans Supabase.";
  }
  return error?.message || "Création du compte impossible.";
}

export default function InscriptionPage() {
  return <Suspense fallback={<main className="h-dvh bg-[#060b18]" />}><InscriptionForm /></Suspense>;
}

function InscriptionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendUntil, setResendUntil] = useState(0);
  const [resendRemaining, setResendRemaining] = useState(0);
  const resendLock = useRef(false);
  const redirectPath = getAuthSuccessPath(`?${searchParams.toString()}`);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!resendUntil) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000));
      setResendRemaining(remaining);
      if (!remaining) setResendUntil(0);
    };
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [resendUntil]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password.length < 8) { setMessage("Le mot de passe doit contenir au moins 8 caractères."); setBusy(false); return; }
    if (password !== form.get("passwordConfirmation")) { setMessage("Les deux mots de passe ne correspondent pas."); setBusy(false); return; }
    const email = String(form.get("email") || "").trim();
    try {
      const result = await registerWithEmail({ email, password, displayName: String(form.get("name") || ""), redirectPath });
      if (result.session && isEmailVerified(result.user)) router.replace(redirectPath);
      else { setPendingConfirmationEmail(email); setMessage("Nous avons envoyé un code de confirmation à votre adresse e-mail."); }
    } catch (error) {
      if (/error sending confirmation email/i.test(error?.message || "") || error?.code === "over_email_send_rate_limit") setPendingConfirmationEmail(email);
      setMessage(explainSignupError(error));
    }
    finally { setBusy(false); }
  }
  async function confirmSignup(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await verifySignupOtp(pendingConfirmationEmail, otp); router.replace(redirectPath); }
    catch (error) { setMessage(error.message || "Ce code est invalide ou a expiré. Demandez-en un nouveau."); }
    finally { setBusy(false); }
  }
  async function resendCode() {
    if (busy || resendLock.current || resendRemaining) return;
    resendLock.current = true;
    setBusy(true); setMessage("");
    try { await resendSignupOtp(pendingConfirmationEmail); setMessage("Un nouveau code vient d’être envoyé."); }
    catch (error) {
      const text = `${error?.code || ""} ${error?.message || ""}`;
      const emailRateLimited = /email.*rate.?limit|rate.?limit.*email|over_email_send_rate_limit/i.test(text);
      if (emailRateLimited || error?.status === 429 || error?.code === "over_request_rate_limit") {
        const seconds = Math.max(1, Number(text.match(/(?:after|in)\s+(\d+)\s+seconds?/i)?.[1]) || (emailRateLimited ? 60 : 300));
        setResendUntil(Date.now() + seconds * 1000);
        setResendRemaining(seconds);
        setMessage(emailRateLimited
          ? `Limite temporaire d’envoi d’e-mail : réessayez dans ${seconds} s. Le code déjà reçu reste utilisable s’il n’a pas expiré.`
          : `Limite temporaire de demandes depuis cette connexion : réessayez dans ${seconds} s. Le code déjà reçu reste utilisable s’il n’a pas expiré.`);
      } else setMessage(explainSignupError(error));
    }
    finally { resendLock.current = false; setBusy(false); }
  }
  async function googleSignup() { setBusy(true); setMessage(""); try { await signInWithGoogle(redirectPath); } catch (error) { setMessage(error.message || "Connexion Google indisponible."); setBusy(false); } }
  async function spotifySignup() { setBusy(true); setMessage(""); try { await signInWithSpotify(redirectPath); } catch (error) { setMessage(error.message || "Connexion Spotify indisponible. Vérifiez que Spotify est activé dans Supabase."); setBusy(false); } }
  return (
    <main className="audiva-auth grid h-dvh overflow-hidden bg-[#060b18] text-white lg:grid-cols-[43.2%_56.8%]">
      <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#060b18] px-5 py-2 sm:px-10 lg:px-14 xl:px-[62px]">
        <AuthAmbient />
        <div className="relative z-10 w-full max-w-[420px]">
          <AuthBrand className="mx-auto mb-1 h-auto w-32 sm:mb-2 sm:w-36" />
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[.28em] text-[#8ba2bb] sm:text-left">AUDIVA · LE SON DE VOTRE HISTOIRE</p>

          <h1 className="text-center font-sans text-3xl font-bold tracking-tight sm:text-left sm:text-4xl">Donnez une place à votre musique.</h1>

          {!pendingConfirmationEmail && <form className="mt-3 space-y-2.5" onSubmit={submit}>
            <Field label="Nom" name="name" autoComplete="name" icon={<HugeiconsIcon icon={UserCircleIcon} size={20} strokeWidth={1.7} aria-hidden="true" />}>Votre nom</Field>
            <Field label="Adresse e-mail" type="email" name="email" autoComplete="email" icon={<EmailIcon />}>vous@exemple.com</Field>
            <Field label="Mot de passe" type="password" name="password" autoComplete="new-password">8 caractères minimum</Field>
            <Field label="Confirmer le mot de passe" type="password" name="passwordConfirmation" autoComplete="new-password">Répétez le mot de passe</Field>

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#76eee9] px-6 py-2.5 font-bold text-[#071523] transition hover:bg-white disabled:opacity-60">
              {busy ? "Création…" : "Créer mon compte"}
            </button>
          </form>}
          {pendingConfirmationEmail && <form onSubmit={confirmSignup} className="mt-4 space-y-3" aria-label="Confirmer l’adresse e-mail">
            <label className="block text-sm font-semibold">Code reçu par e-mail
              <input required autoComplete="one-time-code" inputMode="numeric" value={otp} onChange={event => setOtp(event.target.value)} placeholder="Saisissez votre code" className="mt-2 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#72eee7]" />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#76eee9] px-5 py-3 font-bold text-[#071523] transition hover:bg-white disabled:opacity-60">{busy ? "Vérification…" : "Confirmer mon adresse"}</button>
            <button type="button" disabled={busy || resendRemaining > 0} onClick={resendCode} className="w-full py-1 text-sm font-semibold text-[#a6f6ef] hover:text-white disabled:opacity-50">{resendRemaining > 0 ? `Renvoyer dans ${resendRemaining} s` : "Renvoyer un code"}</button>
          </form>}
          {message && <p role="status" className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white">{message}</p>}

          <div className="my-2.5 flex items-center gap-3 text-[10px] text-white/40">
            <span className="h-px flex-1 bg-white/15" />
            <span>OU CONTINUER AVEC</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <button type="button" disabled={busy} onClick={spotifySignup} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1ed760] px-6 py-2.5 text-sm font-bold text-[#071523] transition hover:bg-[#52e787] disabled:opacity-60"><Image src="/spotify12.png" alt="" width={22} height={22} className="object-contain" />Se connecter avec Spotify</button>
          <button type="button" disabled={busy} onClick={googleSignup} className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[.06] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
            <GoogleIcon />
            Continuer avec Google
          </button>

          <p className="mt-3 text-center text-sm text-white/60">
            Vous avez déjà un compte ?{" "}
            <Link href={`/authentification/connexion?next=${encodeURIComponent(redirectPath)}`} className="font-sans font-bold text-[#9a37ff] hover:text-[#b36cff]">
              Se connecter
            </Link>
          </p>
        </div>
      </section>

      <section className="auth-hero-image relative hidden h-dvh overflow-hidden lg:block">
        <Image src="/image sign-up.jpg" alt="Personne écoutant de la musique" fill priority sizes="62vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/90 via-[#07111e]/5 to-[#07111e]/20" />
        <div className="auth-hero-copy absolute inset-x-0 bottom-0 p-12 xl:p-16"><span className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6f6ef]">AUDIVA · VOTRE UNIVERS MUSICAL</span><p className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">Vos titres. Vos découvertes. Votre histoire.</p><p className="mt-4 max-w-md text-sm leading-6 text-white/75">Créez votre espace et gardez le fil de ce que vous aimez écouter.</p></div>
      </section>
    </main>
  );
}
