import { create } from "zustand";

export const useBibliothequeStore = create((set) => ({
  tracks: [],
  setTracks: (tracks) => set({ tracks }),
  addTracks: (tracks) => set((state) => ({
    tracks: [...state.tracks, ...tracks.filter((track) => !state.tracks.some((existing) => existing.id === track.id))],
  })),
  removeTrack: (trackId) => set((state) => ({ tracks: state.tracks.filter((track) => track.id !== trackId) })),
  clearTracks: () => set({ tracks: [] }),
}));
