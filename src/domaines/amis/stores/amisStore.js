import { create } from "zustand";

export const useAmisStore = create((set) => ({
  amis: [],
  setAmis: (amis) => set({ amis }),
}));
