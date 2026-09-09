"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => router.replace("/accueil"), 1800);
    return () => window.clearTimeout(redirectTimer);
  }, [router]);

  return (
    <main className="landing-screen" aria-label="Chargement d'Audiva">
      <svg className="landing-decoration landing-decoration--top-left" viewBox="0 0 198 293" aria-hidden="true"><path d="M0 0h198C177 66 135 114 77 153c37 37 66 75 73 111 5 28-14 38-37 25C65 265 25 238 0 215V0Z" /></svg>
      <div className="landing-decoration landing-decoration--top-right" aria-hidden="true" />
      <div className="landing-decoration landing-decoration--bottom-left" aria-hidden="true" />
      <svg className="landing-decoration landing-decoration--bottom-right" viewBox="0 0 199 334" aria-hidden="true"><path d="M199 75V334H31C-3 286-8 237 12 190c13-31 39-58 75-76C55 74 46 41 52 23c8-25 38-19 67-2 31 18 57 37 80 54Z" /></svg>
      <Image src="/logoAudiva1.png" alt="Audiva" width={500} height={500} priority className="landing-logo" />
      <div className="landing-loader" aria-label="Chargement en cours" role="status">
        <span className="landing-loader__dot landing-loader__dot--large" />
        <span className="landing-loader__dot landing-loader__dot--small" />
        <span className="landing-loader__dot landing-loader__dot--large" />
      </div>
    </main>
  );
}
