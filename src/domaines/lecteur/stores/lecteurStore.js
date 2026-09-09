import { create } from "zustand";
import { persist } from "zustand/middleware";

const demoStream = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const demoQueue = [
  { id: "afterglow", title: "Afterglow", artist: "Maya K.", album: "Blue Hour", cover: "/hero-recommandation.jpg", duration: 213, streamUrl: demoStream, lyrics: [{ time: 0, text: "La ville respire sous les néons" }, { time: 18, text: "Les silences deviennent des sons" }, { time: 38, text: "Afterglow, reste encore un peu" }, { time: 58, text: "La nuit nous appartient tous les deux" }, { time: 78, text: "Je garde l'écho de ta voix" }] },
  { id: "nuit-electrique", title: "Nuit électrique", artist: "Audiva Sessions", album: "Pour votre soirée", cover: "/hero-playlist.jpg", duration: 228, streamUrl: demoStream, lyrics: [{ time: 0, text: "Les lumières dessinent la piste" }, { time: 20, text: "Chaque battement nous rapproche" }, { time: 40, text: "Nuit électrique, on résiste" }, { time: 60, text: "Jusqu'au matin qui s'approche" }] },
  { id: "lila-sun", title: "Lila Sun", artist: "Lila Sun", album: "Jamendo Discovery", cover: "/hero-decouverte.jpg", duration: 196, streamUrl: demoStream, lyrics: [{ time: 0, text: "Je chante au bord de l'horizon" }, { time: 21, text: "Pour les visages que je ne connais pas" }, { time: 43, text: "Lila Sun, libre comme une chanson" }, { time: 65, text: "Qui trouve son chemin vers toi" }] },
  { id: "afro-future", title: "Afro Future", artist: "Collectif Audiva", album: "Tendances", cover: "/hero-tendances.jpg", duration: 205, streamUrl: demoStream, lyrics: null },
];

const pickShuffledIndex = (state) => {
  const allOthers = state.queue.map((_, index) => index).filter((index) => index !== state.currentIndex);
  const unplayed = allOthers.filter((index) => !state.shuffleHistory.includes(index));
  const candidates = unplayed.length ? unplayed : allOthers;
  const nextIndex = candidates[Math.floor(Math.random() * candidates.length)] ?? state.currentIndex;
  return { nextIndex, history: unplayed.length ? [...state.shuffleHistory, nextIndex] : [state.currentIndex, nextIndex] };
};

export const useLecteurStore = create(persist((set) => ({
  currentTrack: demoQueue[0], queue: demoQueue, currentIndex: 0, isPlaying: false, currentTime: 0, duration: demoQueue[0].duration,
  volume: 0.7, isMuted: false, isShuffled: false, shuffleHistory: [0], repeatMode: "off", lyricsOpen: false, queueOpen: false, likedTrackIds: [],
  setCurrentTrack: (track) => set((state) => { const knownIndex = state.queue.findIndex((item) => item.id === track.id); const queue = knownIndex === -1 ? [track, ...state.queue] : state.queue; const currentIndex = knownIndex === -1 ? 0 : knownIndex; return { currentTrack: queue[currentIndex], queue, currentIndex, currentTime: 0, duration: queue[currentIndex].duration || 0, shuffleHistory: [currentIndex] }; }),
  setQueue: (queue) => set((state) => { const currentIndex = Math.max(0, queue.findIndex((track) => track.id === state.currentTrack?.id)); return { queue, currentIndex, currentTrack: queue[currentIndex] || null }; }),
  play: () => set({ isPlaying: true }), pause: () => set({ isPlaying: false }), togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setCurrentTime: (currentTime) => set({ currentTime }), setDuration: (duration) => set({ duration }), seek: (currentTime) => set({ currentTime }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }), toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled, shuffleHistory: [state.currentIndex] })),
  cycleRepeatMode: () => set((state) => ({ repeatMode: state.repeatMode === "off" ? "track" : state.repeatMode === "track" ? "queue" : "off" })),
  toggleLyrics: () => set((state) => ({ lyricsOpen: !state.lyricsOpen, queueOpen: false })), toggleQueue: () => set((state) => ({ queueOpen: !state.queueOpen, lyricsOpen: false })),
  toggleLike: (track = null) => set((state) => {
    const target = track || state.currentTrack;
    if (!target?.id) return state;
    return {
      likedTrackIds: state.likedTrackIds.includes(target.id)
        ? state.likedTrackIds.filter((id) => id !== target.id)
        : [...state.likedTrackIds, target.id],
    };
  }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  playNext: (track) => set((state) => {
    const queueWithoutTrack = state.queue.filter((item) => item.id !== track.id);
    const activeIndex = Math.max(0, queueWithoutTrack.findIndex((item) => item.id === state.currentTrack?.id));
    const queue = [...queueWithoutTrack.slice(0, activeIndex + 1), track, ...queueWithoutTrack.slice(activeIndex + 1)];
    return { queue, currentIndex: activeIndex };
  }),
  removeFromQueue: (index) => set((state) => ({ queue: state.queue.filter((_, itemIndex) => itemIndex !== index), currentIndex: index < state.currentIndex ? state.currentIndex - 1 : state.currentIndex })),
  moveQueueItem: (from, to) => set((state) => { const queue = [...state.queue]; const [track] = queue.splice(from, 1); queue.splice(to, 0, track); return { queue, currentIndex: queue.findIndex((track) => track.id === state.currentTrack?.id) }; }),
  nextTrack: () => set((state) => { if (!state.queue.length) return state; const selected = state.isShuffled ? pickShuffledIndex(state) : { nextIndex: (state.currentIndex + 1) % state.queue.length, history: [state.currentIndex] }; const track = state.queue[selected.nextIndex]; return { currentIndex: selected.nextIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: true, shuffleHistory: selected.history }; }),
  previousTrack: () => set((state) => { if (!state.queue.length) return state; const previousIndex = (state.currentIndex - 1 + state.queue.length) % state.queue.length; const track = state.queue[previousIndex]; return { currentIndex: previousIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: true }; }),
  handleTrackEnd: () => set((state) => { if (state.repeatMode === "track") return { currentTime: 0, isPlaying: true }; const atLastTrack = state.currentIndex === state.queue.length - 1; if (atLastTrack && state.repeatMode === "off" && !state.isShuffled) return { isPlaying: false, currentTime: state.duration }; const selected = state.isShuffled ? pickShuffledIndex(state) : { nextIndex: atLastTrack ? 0 : state.currentIndex + 1, history: [state.currentIndex] }; const track = state.queue[selected.nextIndex]; return { currentIndex: selected.nextIndex, currentTrack: track, currentTime: 0, duration: track.duration || 0, isPlaying: true, shuffleHistory: selected.history }; }),
}), { name: "audiva-player", partialize: (state) => ({ currentTrack: state.currentTrack, queue: state.queue, currentIndex: state.currentIndex, volume: state.volume, isMuted: state.isMuted, isShuffled: state.isShuffled, repeatMode: state.repeatMode, likedTrackIds: state.likedTrackIds }) }));
