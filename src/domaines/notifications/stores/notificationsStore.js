import { create } from "zustand";

export const useNotificationsStore = create((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  markRead: (id) => set((state) => ({ items: state.items.map((it) => (it.id === id ? { ...it, read: true } : it)) })),
}));
