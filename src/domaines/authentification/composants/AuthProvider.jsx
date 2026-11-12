"use client";

import { useEffect, useMemo } from "react";
import { isSupabaseConfigured, getSupabaseBrowserClient } from "@/services/supabase/client";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { subscribeSocial } from "@/domaines/social/services/supabaseSocial";
import { restoreCloudPersonalData, syncPersonalData } from "@/services/supabase/personalData";
import { useBibliothequeStore } from "@/domaines/bibliotheque/stores/bibliothequeStore";
import { usePlaylistsStore } from "@/domaines/playlists/stores/playlistsStore";
import { useLecteurStore } from "@/domaines/lecteur/stores/lecteurStore";
import { useIntelligenceStore } from "@/domaines/statistiques/stores/intelligenceStore";
import { storeSpotifyProviderSession } from "@/domaines/statistiques/services/spotify";

export default function AuthProvider({ children }) {
  const setSession = useAuthStore(state => state.setSession);
  const user = useAuthStore(state => state.user);
  const hydrateSocial = useSocialStore(state => state.hydrateCloud);
  const conversations = useSocialStore(state => state.conversations);
  const conversationIds = useMemo(() => conversations.map(item => item.id), [conversations]);
  useEffect(() => {
    if (!isSupabaseConfigured) { setSession(null, false, "missing-config"); return; }
    const client = getSupabaseBrowserClient();
    let active = true, receivedAuthEvent = false;
    client.auth.getUser().then(({ data, error }) => {
      if (active && !receivedAuthEvent) setSession(error ? null : data.user, false, error ? "session-error" : "ready");
    }).catch(() => { if (active) setSession(null, false, "session-error"); });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      storeSpotifyProviderSession(session);
      setSession(session?.user || null, false, "ready");
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [setSession]);
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      const social = useSocialStore.getState();
      if (social.activeUserId !== null || social.friends.length || social.requests.length || social.conversations.length || social.notifications.length || social.activities.length || social.cloudLoading) {
        useSocialStore.setState({ friends: [], requests: [], conversations: [], notifications: [], activities: [], activeUserId: null, cloudLoading: false });
      }
      return;
    }
    hydrateSocial(user.id);
    const channel = subscribeSocial(user.id, () => hydrateSocial(user.id), conversationIds);
    return () => { getSupabaseBrowserClient().removeChannel(channel); };
  }, [user?.id, hydrateSocial, conversationIds]);
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    let active = true, timer = null, running = false, rerun = false, ready = false;
    const sync = async () => {
      if (!ready) return;
      if (running) { rerun = true; return; }
      running = true;
      try {
        await syncPersonalData(user.id);
        if (active) window.dispatchEvent(new CustomEvent("audiva-cloud-sync", { detail: { status: "done" } }));
      } catch (error) {
        console.warn("Audiva cloud sync:", error.message);
        if (active) window.dispatchEvent(new CustomEvent("audiva-cloud-sync", { detail: { status: "error", message: error.message } }));
      }
      running = false;
      if (rerun && active) { rerun = false; schedule(); }
    };
    const schedule = () => { if (!ready) return; window.clearTimeout(timer); timer = window.setTimeout(sync, 1400); };
    const restore = async () => {
      try {
        const cloud = await restoreCloudPersonalData(user.id);
        if (!active) return;
        if (cloud.favorites.length) {
          const current = useLecteurStore.getState();
          const merged = [...new Map([...cloud.favorites, ...current.likedTracks].map(track => [track.id, track])).values()];
          useLecteurStore.setState({ likedTracks: merged, likedTrackIds: [...new Set([...current.likedTrackIds, ...merged.map(track => track.id)])] });
        }
        if (cloud.playlists.length) {
          const current = usePlaylistsStore.getState();
          const merged = [...new Map([...current.playlists, ...cloud.playlists].map(item => [item.id, item])).values()];
          current.setPlaylists(merged);
        }
        if (cloud.plays.length) {
          const current = useIntelligenceStore.getState();
          useIntelligenceStore.setState({ plays: [...new Map([...cloud.plays, ...current.plays].map(play => [play.id, play])).values()] });
        }
        ready = true;
        schedule();
      } catch (error) { console.warn("Audiva cloud restore:", error.message); }
    };
    const unsubscribers = [
      useBibliothequeStore.subscribe((state, previous) => { if (state.tracks !== previous.tracks) schedule(); }),
      usePlaylistsStore.subscribe((state, previous) => { if (state.playlists !== previous.playlists || state.favoritePlaylists !== previous.favoritePlaylists) schedule(); }),
      useLecteurStore.subscribe((state, previous) => { if (state.likedTracks !== previous.likedTracks || state.recentTracks !== previous.recentTracks) schedule(); }),
      useIntelligenceStore.subscribe((state, previous) => { if (state.plays !== previous.plays) schedule(); }),
    ];
    const onManualSync = () => schedule();
    window.addEventListener("audiva-sync-requested", onManualSync);
    restore();
    return () => { active = false; window.clearTimeout(timer); unsubscribers.forEach(unsubscribe => unsubscribe()); window.removeEventListener("audiva-sync-requested", onManualSync); };
  }, [user?.id]);
  return children;
}
