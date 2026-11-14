import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { activateSpotifyPlayback, getSpotifyPlayback } from "@/domaines/lecteur/services/spotifyPlayback";

let pendingPlayerWrite = null;
let playerWriteTimer = null;
let playerFlushBound = false;
const flushPlayerWrite = () => {
  if (playerWriteTimer) window.clearTimeout(playerWriteTimer);
  playerWriteTimer = null;
  const pending = pendingPlayerWrite;
  pendingPlayerWrite = null;
  if (!pending) return;
  const [name, value] = pending;
  try {
    window.localStorage.setItem(name, value);
  } catch (error) {
    const quotaExceeded = error?.name === "QuotaExceededError" || error?.code === 22;
    if (!quotaExceeded) return;
    try {
      window.localStorage.removeItem(name);
      window.localStorage.setItem(name, value);
    } catch (retryError) {
      if (retryError?.name === "QuotaExceededError" || retryError?.code === 22) {
        try { window.localStorage.removeItem(name); } catch { /* Storage is unavailable. */ }
      }
    }
  }
};

const resilientPlayerStorage = createJSONStorage(() => ({
  getItem: (name) => window.localStorage.getItem(name),
  removeItem: (name) => window.localStorage.removeItem(name),
  setItem: (name, value) => {
    pendingPlayerWrite = [name, value];
    if (!playerFlushBound) {
      window.addEventListener("pagehide", flushPlayerWrite);
      playerFlushBound = true;
    }
    if (!playerWriteTimer) playerWriteTimer = window.setTimeout(flushPlayerWrite, 750);
  },
}));

const pickShuffledIndex = (state) => {
  const allOthers = state.queue.map((_, index) => index).filter((index) => index !== state.currentIndex);
  const unplayed = allOthers.filter((index) => !state.shuffleHistory.includes(index));
  const candidates = unplayed.length ? unplayed : allOthers;
  const nextIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? state.currentIndex;
  return { nextIndex, history: unplayed.length ? [...state.shuffleHistory, nextIndex] : [state.currentIndex, nextIndex] };
};

const appendRecent = (state, track = state.currentTrack) => {
  if (!track?.id) return state.recentTracks;
  return [track, ...state.recentTracks.filter((item) => item.id !== track.id)].slice(0, 30);
};

const persistTrack = (track) => {
  if (!track?.id) return null;
  const compact = {};
  for (const key of ["id", "localId", "provider", "providerId", "type", "title", "artist", "album", "duration", "addedAt", "source", "mediaType", "trackNumber", "genre", "year", "externalUrl", "uri"]) {
    const value = track[key];
    if (value !== undefined && value !== null && typeof value !== "object") compact[key] = value;
  }
  for (const key of ["cover", "image", "streamUrl"]) {
    const value = track[key];
    if (typeof value === "string" && value.length < 1200 && !value.startsWith("blob:") && !value.startsWith("data:")) compact[key] = value;
  }
  return compact;
};

export const isLocalTrack = (track) => Boolean(track && (
  track.provider === "local" || track.source === "local" || track.localId ||
  String(track.id || "").startsWith("local:") || String(track.id || "").startsWith("local-") ||
  track.streamUrl?.startsWith("blob:")
));

const startTrack = (track) => {
  if (!track) return false;
  if (isLocalTrack(track)) return Boolean(track.streamUrl);
  activateSpotifyPlayback().catch(() => {});
  return true;
};

export const useLecteurStore = create(persist((set) => ({
  currentTrack: null, queue: [], currentIndex: 0, isPlaying: false, currentTime: 0, duration: 0,
  volume: 0.7, isMuted: false, isShuffled: false, shuffleHistory: [0], repeatMode: "off", lyricsOpen: false, queueOpen: false, likedTrackIds: [], likedTracks: [],
  upNextQueue: [], queueSourceName: "Votre file Audiva", recentTracks: [],
  setCurrentTrack: (track) => { if(!track?.id)return; return set((state) => { const knownIndex = state.queue.findIndex((item) => item.id === track.id); const queue = knownIndex === -1 ? [track, ...state.queue] : state.queue; const currentIndex = knownIndex === -1 ? 0 : knownIndex; return { currentTrack: queue[currentIndex], queue, currentIndex, currentTime: 0, duration: queue[currentIndex].duration || 0, shuffleHistory: [currentIndex], recentTracks: appendRecent(state, queue[currentIndex]) }; }); },
  setQueue: (queue, queueSourceName = "Votre file Audiva") => set((state) => { const currentIndex = Math.max(0, queue.findIndex((track) => track.id === state.currentTrack?.id)); return { queue, queueSourceName, upNextQueue: [], currentIndex, currentTrack: queue[currentIndex] || null, recentTracks: appendRecent(state) }; }),
  clearCollectionData: () => set({ currentTrack: null, queue: [], currentIndex: 0, isPlaying: false, currentTime: 0, duration: 0, shuffleHistory: [], likedTrackIds: [], likedTracks: [], upNextQueue: [], recentTracks: [] }),
  restoreLocalTracks: (localTracks) => set((state) => {
    const replaceTrack = (track) => localTracks.find((local) => local.id === track?.id || local.localId && local.localId === track?.localId || local.title === track?.title && local.artist === track?.artist && track?.source === "local") || track;
    const queue = state.queue.map(replaceTrack);
    const upNextQueue = state.upNextQueue.map(replaceTrack);
    const likedTracks = state.likedTracks.map(replaceTrack);
    const recentTracks = state.recentTracks.map(replaceTrack);
    return { queue, upNextQueue, likedTracks, recentTracks, currentTrack: replaceTrack(state.currentTrack) };
  }),
  play: () => set((state) => ({ isPlaying: startTrack(state.currentTrack) })), pause: () => set({ isPlaying: false }), togglePlay: () => set((state) => ({ isPlaying: state.isPlaying ? false : startTrack(state.currentTrack) })),
  setCurrentTime: (currentTime) => set({ currentTime }), setDuration: (duration) => set({ duration }), seek: (currentTime) => { set({ currentTime }); const track = useLecteurStore.getState().currentTrack; if (track && !isLocalTrack(track)) getSpotifyPlayback().player?.seek(currentTime * 1000).catch(() => {}); },
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }), toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled, shuffleHistory: [state.currentIndex] })),
  cycleRepeatMode: () => set((state) => ({ repeatMode: state.repeatMode === "off" ? "track" : state.repeatMode === "track" ? "queue" : "off" })),
  toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen, queueOpen: false })), toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen, lyricsOpen: false })),
  toggleLike: (track = null) => set((state) => {
    const target = track || state.currentTrack;
    if (!target?.id) return state;
    const isLiked = state.likedTrackIds.includes(target.id);
    return {
      likedTrackIds: isLiked ? state.likedTrackIds.filter((id) => id !== target.id) : [...state.likedTrackIds, target.id],
      likedTracks: isLiked ? state.likedTracks.filter((item) => item.id !== target.id) : [target, ...state.likedTracks.filter((item) => item.id !== target.id)],
    };
  }),
  addToQueue: (track) => set((state) => ({ upNextQueue: [...state.upNextQueue.filter((item) => item.id !== track.id), track] })),
  playNext: (track) => set((state) => ({ upNextQueue: [track, ...state.upNextQueue.filter((item) => item.id !== track.id)] })),
  removeUpNext: (index) => set((state) => ({ upNextQueue: state.upNextQueue.filter((_, itemIndex) => itemIndex !== index) })),
  moveUpNext: (from, to) => set((state) => { const upNextQueue = [...state.upNextQueue]; const [track] = upNextQueue.splice(from, 1); upNextQueue.splice(to, 0, track); return { upNextQueue }; }),
  removeFromQueue: (index) => set((state) => ({ queue: state.queue.filter((_, itemIndex) => itemIndex !== index), currentIndex: index < state.currentIndex ? state.currentIndex - 1 : state.currentIndex })),
  moveQueueItem: (from, to) => set((state) => { const queue = [...state.queue]; const [track] = queue.splice(from, 1); queue.splice(to, 0, track); return { queue, currentIndex: queue.findIndex((track) => track.id === state.currentTrack?.id) }; }),
  nextTrack: () => set((state) => { if (state.upNextQueue.length) { const [track, ...upNextQueue] = state.upNextQueue; return { upNextQueue, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: startTrack(track), recentTracks: appendRecent(state) }; } if (!state.queue.length) return state; const selected = state.isShuffled ? pickShuffledIndex(state) : { nextIndex: (state.currentIndex + 1) % state.queue.length, history: [state.currentIndex] }; const track = state.queue[selected.nextIndex]; return { currentIndex: selected.nextIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: startTrack(track), shuffleHistory: selected.history, recentTracks: appendRecent(state) }; }),
  previousTrack: () => set((state) => { if (!state.queue.length) return state; const previousIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length; const track = state.queue[previousIndex]; return { currentIndex: previousIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: startTrack(track) }; }),
  handleTrackEnd: () => set((state) => { if (state.repeatMode === "track") return { currentTime: 0, isPlaying: startTrack(state.currentTrack) }; if (state.upNextQueue.length) { const [track, ...upNextQueue] = state.upNextQueue; return { upNextQueue, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: startTrack(track), recentTracks: appendRecent(state) }; } const atLastTrack = state.currentIndex === state.queue.length - 1; if (atLastTrack && state.repeatMode === "off" && !state.isShuffled) return { isPlaying: false, currentTime: state.duration }; const selected = state.isShuffled ? pickShuffledIndex(state) : { nextIndex: atLastTrack ? 0 : state.currentIndex + 1, history: [state.currentIndex] }; const track = state.queue[selected.nextIndex]; return { currentIndex: selected.nextIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: startTrack(track), shuffleHistory: selected.history, recentTracks: appendRecent(state) }; }),
}), { name: "audiva-player", version: 3, storage: resilientPlayerStorage, migrate: (state) => {const real=t=>t&&!t.streamUrl?.includes('soundhelix.com');return {...state,queue:(state.queue||[]).filter(real),upNextQueue:(state.upNextQueue||[]).filter(real),recentTracks:(state.recentTracks||[]).filter(real),likedTracks:(state.likedTracks||[]).filter(real),currentTrack:real(state.currentTrack)?state.currentTrack:null,isPlaying:false};}, partialize: (state) => ({ currentTrack: persistTrack(state.currentTrack), queue: state.queue.slice(0, 80).map(persistTrack).filter(Boolean), currentIndex: state.currentIndex, currentTime: state.currentTime, upNextQueue: state.upNextQueue.slice(0, 80).map(persistTrack).filter(Boolean), queueSourceName: state.queueSourceName, recentTracks: state.recentTracks.slice(0, 30).map(persistTrack).filter(Boolean), volume: state.volume, isMuted: state.isMuted, isShuffled: state.isShuffled, repeatMode: state.repeatMode, likedTrackIds: state.likedTrackIds.slice(-500), likedTracks: state.likedTracks.slice(0, 100).map(persistTrack).filter(Boolean) }) }));

const selectLecteurSansHorloge = ({ currentTime, duration, ...state }) => state;
export const useLecteurControlsStore = (selector = selectLecteurSansHorloge) =>
  useLecteurStore(useShallow(selector));
