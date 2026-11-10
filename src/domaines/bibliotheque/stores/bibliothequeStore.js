import { create } from "zustand";

export const useBibliothequeStore = create((set) => ({
  tracks: [],
  hydrated: false,
  loadError: "",
  setLoadError: (loadError) => set({hydrated:true,loadError}),
  setTracks: (tracks) => set({ tracks, hydrated:true, loadError:"" }),
  addTracks: (tracks) => set((state) => ({
    tracks: [...state.tracks, ...tracks.filter((track) => !state.tracks.some((existing) => existing.id === track.id))],
  })),
  removeTrack: (trackId) => set((state) => ({ tracks: state.tracks.filter((track) => track.id !== trackId) })),
  clearTracks: () => set({ tracks: [] }),
}));
