"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

export default function OfflineSupport() {
  const [online, setOnline] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) setDismissed(false);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    // Ask the browser to protect Audiva's IndexedDB, localStorage and offline
    // cache from automatic storage eviction after the user closes the app.
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => false);
    }
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online !== false || dismissed) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-3 border-b border-cyan-300/20 bg-[#071a2b]/95 px-4 py-2 text-center text-xs font-medium text-cyan-100 shadow-lg backdrop-blur-md sm:text-sm">
      <span>Hors ligne · Vos fichiers, playlists et favoris locaux restent accessibles. Spotify, les discussions et la synchronisation reprendront à la reconnexion.</span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Fermer le message hors ligne" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/10"><HugeiconsIcon icon={Cancel01Icon} size={17}/></button>
    </div>
  );
}
