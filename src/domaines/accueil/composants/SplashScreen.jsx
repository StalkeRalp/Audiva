"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthAmbient from "@/domaines/authentification/composants/AuthAmbient";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PaletteIcon } from "@hugeicons/core-free-icons";
import { toggleAppleTheme } from "@/composants/layout/ThemeProvider";

export default function SplashScreen({ bungeeClassName }) {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);

  useEffect(() => {
    if (!authLoading && user?.id) router.replace("/accueil");
  }, [authLoading, router, user?.id]);

  if (authLoading || user?.id) {
    return <main className={`landing-screen ${bungeeClassName || ""}`} aria-busy="true" aria-label="Ouverture de votre espace Audiva">
      <div className="landing-center">
        <Image src="/logoAudiva4png" alt="Logo Audiva" width={260} height={260} priority className="landing-logo" />
        <p className="landing-copy" role="status">{user?.id ? "Bienvenue. Votre espace s’ouvre…" : "Retrouvons votre espace Audiva…"}</p>
      </div>
    </main>;
  }

  function goToSignIn() {
    const next = "/spotify/onboarding?next=%2Faccueil";
    router.replace(`/authentification/connexion?next=${encodeURIComponent(next)}`);
  }

  return (
    <main className={`landing-screen ${bungeeClassName || ""}`} aria-label="Bienvenue sur Audiva">
      <video className="landing-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1}>
        <source src="/videos/videos2.mp4" type="video/mp4" />
      </video>
      <div className="landing-mobile-image" aria-hidden="true" />
      <div className="landing-video-tint" aria-hidden="true" />
      <AuthAmbient />
      <div className="landing-topline"><span className="landing-live-dot" /> VOTRE ESPACE MUSICAL</div>
      <button type="button" className="landing-theme-toggle" onClick={toggleAppleTheme} aria-label="Basculer entre le thème Audiva et le thème Apple" title="Thème Apple / Audiva"><HugeiconsIcon icon={PaletteIcon} size={20} strokeWidth={1.8}/></button>
      <section className="landing-center">
        <Image src="/logoAudiva4png" alt="Logo Audiva" width={500} height={500} priority className="landing-logo" />
        <p className="landing-eyebrow">AUDIVA</p>
        <h1 className="landing-title">Votre musique.<br /><span>À votre façon.</span></h1>
        <p className="landing-copy">Écoutez, explorez et partagez vos découvertes.</p>
        <div className="landing-loading" role="status" aria-live="polite" aria-label="Chargement de votre espace">
          <div className="landing-equalizer-frame"><div className="landing-equalizer" aria-hidden="true">{Array.from({ length: 31 }, (_, index) => {
            const levels = [7, 12, 18, 10, 24, 14, 20, 9, 16, 23, 12, 19, 8, 15, 22];
            const height = levels[index % levels.length];
            return <i key={index} style={{ "--bar-height": `${height}px`, "--bar": index }} />;
          })}</div></div>
        </div>
        <button type="button" className="landing-enter" onClick={goToSignIn}>Continuer <HugeiconsIcon icon={ArrowRight01Icon} size={19} strokeWidth={2} aria-hidden="true" /></button>
      </section>
      <footer className="landing-footer">VOTRE MUSIQUE, VOTRE RYTHME</footer>
    </main>
  );
}
