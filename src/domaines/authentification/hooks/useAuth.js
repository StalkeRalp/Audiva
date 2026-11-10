import { create } from "zustand";

export function useAuth() {
  return create((set) => ({
    user: null,
    loading: false,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
  }));
}
