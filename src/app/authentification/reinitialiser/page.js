"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { updatePassword } from "@/domaines/authentification/services/authService";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";
import { AuthBrand } from "@/domaines/authentification/composants/AuthBrand";
import AuthPasswordField from "@/domaines/authentification/composants/AuthPasswordField";

export default function ReinitialiserPage() {
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget), password = String(form.get("password") || "");
    if (password.length < 8) { setMessage("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (password !== form.get("confirmation")) { setMessage("Les deux mots de passe ne correspondent pas."); return; }
    try { await updatePassword(password); setMessage("Mot de passe mis à jour. Vous pouvez continuer à utiliser Audiva."); }
    catch (error) { setMessage(error.message || "Le lien est invalide ou expiré. Demandez-en un nouveau."); }
  }
  return (
    <main className="audiva-auth grid h-dvh overflow-hidden bg-[#060b18] text-white lg:grid-cols-[43.2%_56.8%]">
      <section className="relative flex h-dvh items-center justify-center overflow-hidden bg-[#060b18] px-5 py-5 sm:px-10 lg:px-14 xl:px-20">
        <AuthAmbient />
        <div className="relative z-10 w-full max-w-[420px]">
          <AuthBrand className="mx-auto mb-3 h-auto w-36 sm:mb-4 sm:w-40" />
          <p className="mb-5 text-center text-[10px] font-semibold uppercase tracking-[.28em] text-[#8ba2bb] sm:text-left">AUDIVA · VOTRE MUSIQUE VOUS ATTEND</p>
          <h1 className="text-center text-3xl font-bold tracking-tight sm:text-left sm:text-4xl">Retrouvez votre accès.</h1>
          <p className="mt-3 text-center text-sm leading-6 text-[#aebbd0] sm:text-left">Choisissez un nouveau mot de passe pour retrouver votre bibliothèque et poursuivre vos écoutes.</p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <AuthPasswordField label="Nouveau mot de passe" name="password" autoComplete="new-password" placeholder="8 caractères minimum" minLength={8} lineClassName="py-3" />
            <AuthPasswordField label="Confirmer le mot de passe" name="confirmation" autoComplete="new-password" placeholder="Répétez votre mot de passe" minLength={8} lineClassName="py-3" />
            <button className="w-full bg-[#72eee7] px-4 py-3.5 font-bold text-[#061426] transition hover:bg-[#a6f6ef]">Enregistrer mon nouveau mot de passe</button>
          </form>
          {message && <p role="status" className="mt-4 text-sm leading-5 text-[#c8fffb]">{message}</p>}
          <Link href="/authentification/connexion" className="mt-6 block text-center text-sm text-[#a6f6ef] hover:text-white sm:text-left">← Retour à la connexion</Link>
        </div>
      </section>
      <section className="auth-hero-image relative hidden h-dvh overflow-hidden lg:block">
        <Image src="/recherche.jpg" alt="Une auditrice explore sa collection de disques" fill priority sizes="57vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111e]/90 via-[#07111e]/5 to-[#07111e]/20" />
        <div className="auth-hero-copy absolute inset-x-0 bottom-0 p-12 xl:p-16"><span className="text-xs font-semibold uppercase tracking-[.24em] text-[#a6f6ef]">À VOUS DE CHOISIR LA SUITE</span><p className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">Un mot de passe, et la musique reprend.</p></div>
      </section>
    </main>
  );
}
