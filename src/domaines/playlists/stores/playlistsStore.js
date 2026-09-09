import { create } from "zustand";

export const usePlaylistsStore = create((set) => ({
  playlists: [],
  setPlaylists: (playlists) => set({ playlists }),
}));
