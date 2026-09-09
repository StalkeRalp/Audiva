import { create } from "zustand";

export const useAppStore = create((set) => ({
  ready: false,
  setReady: (r = true) => set({ ready: r }),
}));
