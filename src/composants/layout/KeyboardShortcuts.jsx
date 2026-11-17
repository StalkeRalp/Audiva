"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";

const destinations = {
  "1": "/accueil",
  "2": "/recherche",
  "3": "/decouverte",
  "4": "/bibliotheque",
  "5": "/favoris",
  "6": "/amis",
  "7": "/chat",
  "8": "/notifications",
  "9": "/statistiques",
  "0": "/parametres",
};

function isEditing(event) {
  const target = event.target;
  return target instanceof HTMLElement && (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']") ||
    (event.code === "Space" && target.closest("button, a, [role='button']"))
  );
}

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.isComposing || isEditing(event)) return;
      const key = event.key.toLowerCase();
      const player = useLecteurStore.getState();
      const command = event.ctrlKey || event.metaKey;

      if (command && !event.altKey && key === "k") {
        event.preventDefault();
        router.push("/recherche");
        return;
      }
      if (command && event.altKey && destinations[event.key]) {
        event.preventDefault();
        router.push(destinations[event.key]);
        return;
      }
      if (event.key === "?" && !command && !event.altKey) {
        event.preventDefault();
        router.push("/parametres#raccourcis-clavier");
        return;
      }
      if (event.repeat) return;

      if ((event.code === "Space" || event.key === " ") && !command && !event.altKey && !event.shiftKey && player.currentTrack) {
        event.preventDefault();
        player.togglePlay();
      } else if (key === "m" && !command && !event.altKey) {
        event.preventDefault();
        player.toggleMute();
      } else if (key === "n" && !command && !event.altKey && player.currentTrack) {
        event.preventDefault();
        player.nextTrack();
      } else if (key === "p" && !command && !event.altKey && player.currentTrack) {
        event.preventDefault();
        player.previousTrack();
      } else if (key === "f" && !command && !event.altKey && player.currentTrack) {
        event.preventDefault();
        player.toggleLike();
      } else if (key === "q" && !command && !event.altKey) {
        event.preventDefault();
        player.toggleQueue();
      } else if (key === "y" && !command && !event.altKey && player.currentTrack) {
        event.preventDefault();
        player.toggleLyrics();
      } else if (key === "l" && !command && !event.altKey) {
        event.preventDefault();
        router.push("/lecteur");
      } else if (key === "i" && !command && !event.altKey) {
        event.preventDefault();
        router.push("/bibliotheque?import=1");
      } else if (event.key === "ArrowLeft" && player.currentTrack && !command && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        player.seek(Math.max(0, player.currentTime - 5));
      } else if (event.key === "ArrowRight" && player.currentTrack && !command && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        player.seek(Math.min(player.duration || player.currentTrack.duration || Infinity, player.currentTime + 5));
      } else if (event.key === "ArrowUp" && player.currentTrack && !command && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        player.setVolume(Math.min(1, player.volume + 0.05));
      } else if (event.key === "ArrowDown" && player.currentTrack && !command && !event.altKey && !event.shiftKey) {
        event.preventDefault();
        player.setVolume(Math.max(0, player.volume - 0.05));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
