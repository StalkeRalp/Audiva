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

      <Image src="/logoAudiva1.png" alt="Audiva" width={500} height={500} priority className="landing-logo" />

    </main>
  );
}
