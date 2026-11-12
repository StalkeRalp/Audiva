import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  status: "loading",
  setUser: (user) => set({ user, isAuthenticated: Boolean(user), loading: false, status: "ready" }),
  setSession: (user, loading = false, status = "ready") => set({ user, isAuthenticated: Boolean(user), loading, status }),
  clearUser: () => set({ user: null, isAuthenticated: false, loading: false, status: "ready" }),
}));
