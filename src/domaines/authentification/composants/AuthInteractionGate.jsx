"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";

export default function AuthInteractionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);
  const status = useAuthStore(state => state.status);

  useEffect(() => {
    if (loading || status === "session-error" || user || pathname === "/" || pathname.startsWith("/authentification/") || pathname.startsWith("/auth/") || pathname.startsWith("/spotify/")) return undefined;

    const redirectToSignIn = (event) => {
      if (event.defaultPrevented || event.button !== undefined && event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const control = event.type === "submit" ? target : target.closest("button:not(:disabled), a[href], [role='button']");
      if (!control || control.matches("[aria-disabled='true']")) return;
      if (control instanceof HTMLAnchorElement) {
        const destination = new URL(control.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      const destination = `${window.location.pathname}${window.location.search}`;
      const onboarding = `/spotify/onboarding?next=${encodeURIComponent(destination.startsWith("/spotify/") ? "/accueil" : destination)}`;
      router.replace(`/authentification/connexion?next=${encodeURIComponent(onboarding)}`);
    };

    document.addEventListener("click", redirectToSignIn, true);
    document.addEventListener("submit", redirectToSignIn, true);
    return () => {
      document.removeEventListener("click", redirectToSignIn, true);
      document.removeEventListener("submit", redirectToSignIn, true);
    };
  }, [loading, pathname, router, status, user]);

  return null;
}
