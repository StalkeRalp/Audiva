import { create } from "zustand";

export const useUiStore = create((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  playerVisible: true,
  setPlayerVisible: (playerVisible) => set({ playerVisible }),
  playerStyle: "audiva",
  setPlayerStyle: (playerStyle) => {
    if (typeof window !== "undefined") window.localStorage.setItem("audiva-player-style", playerStyle);
    set({ playerStyle });
  },
}));
