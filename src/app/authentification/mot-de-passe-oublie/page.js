"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { requestPasswordReset } from "@/domaines/authentification/services/authService";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";

export default function MotDePasseOubliePage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await requestPasswordReset(String(new FormData(event.currentTarget).get("email") || "")); setMessage("Si cette adresse est associée à un compte, un lien de réinitialisation vient d’être envoyé."); }
    catch (error) { setMessage(error.message || "Impossible d’envoyer le lien."); }
    finally { setBusy(false); }
  }
  return (
    <main className="audiva-auth grid h-dvh overflow-hidden bg-[#060b18] text-white lg:grid-cols-[43.2%_56.8%]">
      <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#060b18] px-5 py-5 sm:px-10 lg:px-14 xl:px-20">
        <AuthAmbient />
        <div className="relative z-10 w-full max-w-[420px]">
          <Image src="/logoAudiva4png" alt="Audiva" width={1254} height={1254} priority className="auth-brand-mark mx-auto mb-3 h-auto w-36 sm:mb-4 sm:w-40" />
          <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[.28em] text-[#8ba2bb] sm:text-left">AUDIVA · VOTRE MUSIQUE VOUS ATTEND</p>
          <h1 className="text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl">On vous aide à revenir.</h1>
          <p className="mt-3 text-center text-sm leading-6 text-[#aebbd0] sm:text-left">Indiquez l’adresse e-mail de votre compte. Nous vous enverrons un lien sécurisé pour choisir un nouveau mot de passe.</p>
          <form onSubmit={submit} className="mt-7 space-y-6">
            <label className="block text-sm font-semibold">Adresse e-mail
              <input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" className="mt-2 w-full border-0 border-b border-white/25 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-[#8291a8] focus:border-[#72eee7]" />
            </label>
            <button disabled={busy} className="w-full bg-[#72eee7] px-4 py-3.5 font-bold text-[#061426] transition hover:bg-[#a6f6ef] disabled:opacity-60">{busy ? "Envoi en cours…" : "Recevoir le lien de réinitialisation"}</button>
          </form>
          {message && <p role="status" className="mt-4 text-sm leading-5 text-[#c8fffb]">{message}</p>}
          <Link className="mt-6 block text-center text-sm text-[#a6f6ef] hover:text-white sm:text-left" href="/authentification/connexion">← Retour à la connexion</Link>
        </div>
      </section>
      <section className="auth-hero-image relative hidden h-dvh overflow-hidden lg:block">
        <Image src="/discussions.jpg" alt="Une auditrice choisit un disque vinyle" fill priority sizes="57vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/90 via-[#07111e]/5 to-[#07111e]/20" />
        <div className="auth-hero-copy absolute inset-x-0 bottom-0 p-12 xl:p-16"><span className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6f6ef]">REPRENEZ LE FIL</span><p className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">Vos playlists et vos découvertes sont tout près.</p></div>
      </section>
    </main>
  );
}
