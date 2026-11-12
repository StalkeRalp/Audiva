"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function InstallPWAButton() {
  const installEvent = useRef(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault();
      installEvent.current = event;
    };
    const onInstalled = () => {
      installEvent.current = null;
      setIsInstalled(true);
      setNotice("");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (isStandalone()) {
      setIsInstalled(true);
      setNotice("Audiva est déjà installée sur cet appareil.");
      return;
    }

    const promptEvent = installEvent.current;
    if (!promptEvent) {
      const isAppleMobile = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
        || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
      setNotice(isAppleMobile
        ? "Dans Safari, touchez Partager, puis « Sur l’écran d’accueil » pour installer Audiva."
        : "Ouvrez le menu de votre navigateur, puis choisissez « Installer Audiva » ou « Installer l’application ».");
      return;
    }

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      installEvent.current = null;
      if (outcome === "accepted") setNotice("Installation lancée. Audiva sera disponible depuis vos applications.");
    } catch {
      setNotice("L’installation n’a pas pu être lancée. Réessayez depuis le menu de votre navigateur.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        aria-label={isInstalled ? "Audiva est installée" : "Installer Audiva"}
        aria-expanded={Boolean(notice)}
        className="flex h-10 items-center gap-2 rounded-full border border-[#76eee9]/20 bg-[#76eee9]/[.07] px-3 text-xs font-bold text-[#bffffa] transition hover:border-[#76eee9]/50 hover:bg-[#76eee9]/[.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76eee9]/60"
      >
        <HugeiconsIcon icon={isInstalled ? Tick02Icon : Download01Icon} size={18} strokeWidth={1.8} />
        <span className="hidden min-[380px]:inline">{isInstalled ? "Installée" : "Installer"}</span>
      </button>
      {notice ? (
        <div role="status" className="absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(300px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-[#0b1425] p-4 text-sm leading-5 text-[#dce5fa] shadow-2xl shadow-black/40">
          <p>{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="mt-3 text-xs font-bold text-[#76eee9] hover:text-white">Compris</button>
        </div>
      ) : null}
    </div>
  );
}
