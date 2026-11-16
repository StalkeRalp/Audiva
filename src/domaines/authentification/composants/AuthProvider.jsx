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
import { isEmailVerified } from "@/domaines/authentification/services/emailVerification";

function sessionUser(session) {
  return isEmailVerified(session?.user) ? session.user : null;
}

function discardUnverifiedSession(client, session) {
  if (session?.user && !isEmailVerified(session.user)) {
    queueMicrotask(() => client.auth.signOut({ scope: "local" }).catch(() => {}));
  }
}

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
    let lastSessionCheck = 0;
    const refreshSession = async (force = false) => {
      if (!active || !navigator.onLine) return;
      const now = Date.now();
      if (!force && now - lastSessionCheck < 1500) return;
      lastSessionCheck = now;
      try {
        const { data, error } = await client.auth.getSession();
        if (!active) return;
        if (error) {
          // Keep a previously restored identity during transient refresh/network errors.
          const currentUser = useAuthStore.getState().user;
          setSession(currentUser, false, currentUser ? "ready" : "session-error");
          return;
        }
        const verifiedUser = sessionUser(data.session);
        discardUnverifiedSession(client, data.session);
        setSession(verifiedUser, false, "ready");
      } catch {
        if (!active) return;
        const currentUser = useAuthStore.getState().user;
        setSession(currentUser, false, currentUser ? "ready" : "session-error");
      }
    };
    // Read the locally persisted Supabase session. getUser() always calls the
    // network and would repeatedly fail while Audiva is offline.
    client.auth.getSession().then(({ data, error }) => {
      if (active && !receivedAuthEvent) {
        if (error) {
          const currentUser = useAuthStore.getState().user;
          setSession(currentUser, false, currentUser ? "ready" : "session-error");
        } else {
          const verifiedUser = sessionUser(data.session);
          discardUnverifiedSession(client, data.session);
          setSession(verifiedUser, false, "ready");
        }
      }
    }).catch(() => { if (active) setSession(useAuthStore.getState().user, false, "session-error"); });
    const stopRefreshOffline = () => client.auth.stopAutoRefresh();
    const resumeRefreshOnline = () => { client.auth.startAutoRefresh(); refreshSession(true); };
    if (!navigator.onLine) stopRefreshOffline();
    window.addEventListener("offline", stopRefreshOffline);
    window.addEventListener("online", resumeRefreshOnline);
    const onTabVisible = () => { if (document.visibilityState === "visible") refreshSession(); };
    window.addEventListener("focus", onTabVisible);
    document.addEventListener("visibilitychange", onTabVisible);
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      storeSpotifyProviderSession(session);
      const verifiedUser = sessionUser(session);
      discardUnverifiedSession(client, session);
      setSession(verifiedUser, false, "ready");
    });
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener("offline", stopRefreshOffline); window.removeEventListener("online", resumeRefreshOnline); window.removeEventListener("focus", onTabVisible); document.removeEventListener("visibilitychange", onTabVisible); };
  }, [setSession]);
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) {
      const social = useSocialStore.getState();
      if (social.activeUserId !== null || social.friends.length || social.requests.length || social.sentRequests.length || social.conversations.length || social.notifications.length || social.activities.length || social.cloudLoading) {
        useSocialStore.setState({ friends: [], requests: [], sentRequests: [], conversations: [], notifications: [], activities: [], activeUserId: null, cloudLoading: false });
      }
      return;
    }
    let channel = null;
    const connect = () => {
      if (!navigator.onLine || channel) return;
      const social = useSocialStore.getState();
      if (social.activeUserId !== user.id || social.cloudError) hydrateSocial(user.id);
      channel = subscribeSocial(user.id, () => hydrateSocial(user.id), conversationIds);
    };
    const disconnect = () => {
      if (!channel) return;
      getSupabaseBrowserClient().removeChannel(channel);
      channel = null;
    };
    connect();
    window.addEventListener("online", connect);
    window.addEventListener("offline", disconnect);
    return () => { disconnect(); window.removeEventListener("online", connect); window.removeEventListener("offline", disconnect); };
  }, [user?.id, hydrateSocial, conversationIds]);
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return;
    let active = true, timer = null, running = false, rerun = false, ready = false;
    const sync = async () => {
      if (!ready || !navigator.onLine) return;
      if (running) { rerun = true; return; }
      running = true;
      try {
        await syncPersonalData(user.id);
        if (active) window.dispatchEvent(new CustomEvent("audiva-cloud-sync", { detail: { status: "done" } }));
      } catch (error) {
        if (navigator.onLine) console.warn("Audiva cloud sync:", error.message);
        if (active && navigator.onLine) window.dispatchEvent(new CustomEvent("audiva-cloud-sync", { detail: { status: "error", message: error.message } }));
      }
      running = false;
      if (rerun && active) { rerun = false; schedule(); }
    };
    const schedule = () => { if (!ready) return; window.clearTimeout(timer); timer = window.setTimeout(sync, 1400); };
    const restore = async () => {
      if (!navigator.onLine) { ready = true; return; }
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
      } catch (error) { if (navigator.onLine) console.warn("Audiva cloud restore:", error.message); ready = true; }
    };
    const unsubscribers = [
      useBibliothequeStore.subscribe((state, previous) => { if (state.tracks !== previous.tracks) schedule(); }),
      usePlaylistsStore.subscribe((state, previous) => { if (state.playlists !== previous.playlists || state.favoritePlaylists !== previous.favoritePlaylists) schedule(); }),
      useLecteurStore.subscribe((state, previous) => { if (state.likedTracks !== previous.likedTracks || state.recentTracks !== previous.recentTracks) schedule(); }),
      useIntelligenceStore.subscribe((state, previous) => { if (state.plays !== previous.plays) schedule(); }),
    ];
    const onManualSync = () => schedule();
    const onOnline = () => { restore(); };
    const onOffline = () => { window.clearTimeout(timer); };
    window.addEventListener("audiva-sync-requested", onManualSync);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    restore();
    return () => { active = false; window.clearTimeout(timer); unsubscribers.forEach(unsubscribe => unsubscribe()); window.removeEventListener("audiva-sync-requested", onManualSync); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [user?.id]);
  return children;
}
