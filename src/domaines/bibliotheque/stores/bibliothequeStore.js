import { create } from "zustand";

export const useBibliothequeStore = create((set) => ({
  tracks: [],
  setTracks: (tracks) => set({ tracks }),
  clearTracks: () => set({ tracks: [] }),
}));
