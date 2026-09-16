import { create } from "zustand";
import { persist } from "zustand/middleware";
import { savePlaylistsSnapshot } from "@/utilitaires/playlistsStorage";

const makeId = () => `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const fallbackCover = "/hero-playlist.jpg";
const safeCover = (cover) => (typeof cover === "string" && (cover.startsWith("data:") || cover.startsWith("blob:")) ? fallbackCover : cover || fallbackCover);
const compactPlaylists = (playlists) => playlists.map((playlist) => ({
  ...playlist,
  cover: safeCover(playlist.cover),
  tracks: (playlist.tracks || []).map((track) => ({ ...track, cover: safeCover(track.cover) })),
}));
const snapshot = (state) => ({ playlists: compactPlaylists(state.playlists), favoritePlaylists: compactPlaylists(state.favoritePlaylists) });
const saveBackup = (state) => { savePlaylistsSnapshot(snapshot(state)).catch(() => {}); };

// Les couvertures chargées depuis un fichier peuvent dépasser le quota de localStorage.
// Cette couche persiste une version compacte et ne laisse jamais une création échouer.
const playlistStorage = {
  getItem: (name) => typeof window === "undefined" ? null : window.localStorage.getItem(name),
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      if (error?.name !== "QuotaExceededError") return;
      try {
        const compact = JSON.parse(value);
        compact.state.playlists = compactPlaylists(compact.state.playlists || []);
        window.localStorage.setItem(name, JSON.stringify(compact));
      } catch {
        // L'état reste disponible dans la session plutôt que de faire échouer l'interface.
      }
    }
  },
  removeItem: (name) => { if (typeof window !== "undefined") window.localStorage.removeItem(name); },
};

export const usePlaylistsStore = create(
  persist(
    (set, get) => ({
      playlists: [],
      favoritePlaylists: [],
      createPlaylist: ({ title, cover = "", description = "", visibility = "publique", owner = "Vous" }) => {
        const playlist = {
          id: makeId(),
          title: title.trim(),
          cover,
          description: description.trim(),
          visibility,
          owner,
          tracks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
        saveBackup(get());
        return playlist;
      },
      addTrack: (playlistId, track) => {
        set((state) => {
        const playlists = state.playlists.map((playlist) => playlist.id === playlistId
          ? { ...playlist, tracks: playlist.tracks.some((entry) => entry.id === track.id) ? playlist.tracks : [...playlist.tracks, track], updatedAt: new Date().toISOString() }
          : playlist);
        const updated = playlists.find((playlist) => playlist.id === playlistId);
        return { playlists, favoritePlaylists: state.favoritePlaylists.map((playlist) => playlist.id === playlistId ? { ...playlist, ...updated } : playlist) };
        });
        saveBackup(get());
      },
      updatePlaylist: (playlistId, updates) => {
        set((state) => {
        const playlists = state.playlists.map((playlist) => playlist.id === playlistId
          ? { ...playlist, ...updates, updatedAt: new Date().toISOString() }
          : playlist);
        const updated = playlists.find((playlist) => playlist.id === playlistId);
        return { playlists, favoritePlaylists: state.favoritePlaylists.map((playlist) => playlist.id === playlistId ? { ...playlist, ...updated } : playlist) };
        });
        saveBackup(get());
      },
      togglePlaylistFavorite: (playlist) => {
        set((state) => ({
          favoritePlaylists: state.favoritePlaylists.some((item) => item.id === playlist.id)
          ? state.favoritePlaylists.filter((item) => item.id !== playlist.id)
          : [{ ...playlist, tracks: playlist.tracks || [] }, ...state.favoritePlaylists],
        }));
        saveBackup(get());
      },
      setPlaylists: (playlists) => { set({ playlists }); saveBackup(get()); },
      restorePlaylists: (saved) => set((state) => ({
        playlists: Array.isArray(saved.playlists) ? saved.playlists : state.playlists,
        favoritePlaylists: Array.isArray(saved.favoritePlaylists) ? saved.favoritePlaylists : state.favoritePlaylists,
      })),
      removePlaylist: (playlistId) => {
        set((state) => ({ playlists: state.playlists.filter((playlist) => playlist.id !== playlistId), favoritePlaylists: state.favoritePlaylists.filter((playlist) => playlist.id !== playlistId) }));
        saveBackup(get());
      },
    }),
    {
      name: "audiva-playlists",
      storage: playlistStorage,
      partialize: (state) => ({ playlists: compactPlaylists(state.playlists), favoritePlaylists: compactPlaylists(state.favoritePlaylists) }),
    },
  ),
);
