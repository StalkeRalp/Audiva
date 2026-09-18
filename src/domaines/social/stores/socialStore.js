import { create } from "zustand";
import { persist } from "zustand/middleware";

const friends = [
  { id: "sophie", name: "Sophie N.", username: "@sophiewaves", avatar: "/hero-decouverte.jpg", online: true, topArtist: "Lila Sun", common: "Afro & Indie", playlist: "Afro Future" },
  { id: "marc", name: "Marc T.", username: "@marcafterdark", avatar: "/hero-tendances.jpg", online: false, topArtist: "Kairo", common: "Electro nocturne", playlist: "Night Drive" },
  { id: "julie", name: "Julie R.", username: "@julieonrepeat", avatar: "/hero-recommandation.jpg", online: true, topArtist: "Maya K.", common: "Pop alternative", playlist: "Blue Hour" },
];
const requests = [{ id: "ines", name: "Inès M.", username: "@inesbeats", avatar: "/hero-playlist.jpg", mutual: 4, topArtist: "Lila Sun" }];
const conversations = [
  { id: "sophie", participantId: "sophie", unread: 2, updatedAt: "18:42", messages: [{ id: "s1", author: "sophie", text: "Tu as écouté cette sélection ?", time: "18:38", read: true }, { id: "s2", author: "sophie", share: { kind: "playlist", title: "Afro Future", subtitle: "22 morceaux · Partagée par Sophie", cover: "/hero-tendances.jpg" }, time: "18:39", read: true }] },
  { id: "julie", participantId: "julie", unread: 0, updatedAt: "Hier", messages: [{ id: "j1", author: "me", text: "Merci pour la découverte !", time: "Hier, 21:05", read: true }] },
  { id: "marc", participantId: "marc", unread: 0, updatedAt: "Lun.", messages: [{ id: "m1", author: "marc", text: "On compare nos statistiques cette semaine ?", time: "Lun., 17:10", read: true }] },
];
const notifications = [{ id: "friend-request-ines", type: "social", title: "Nouvelle demande d’amitié", text: "Inès M. souhaite rejoindre votre cercle Audiva.", time: "Il y a 5 min", read: false }, { id: "shared-sophie", type: "partage", title: "Sophie a partagé une playlist", text: "Afro Future · 22 morceaux", time: "Il y a 8 min", read: false }];

export const useSocialStore = create(persist((set, get) => ({
  friends, requests, conversations, notifications, sentRequests: [], invites: [],
  createInvite: () => {
    const now = Date.now();
    const token = `audiva-${now}-${Math.random().toString(36).slice(2, 8)}`;
    const invitation = { token, createdAt: now, expiresAt: now + 5 * 60 * 1000 };
    set((state) => ({ invites: [invitation, ...state.invites.filter((item) => item.expiresAt > now)] }));
    return invitation;
  },
  getInviteStatus: (token) => {
    const invitation = get().invites.find((item) => item.token === token);
    if (!invitation) return "inconnue";
    return invitation.expiresAt > Date.now() ? "active" : "expirée";
  },
  sendFriendRequest: (person) => set((state) => state.sentRequests.some((item) => item.id === person.id) || state.friends.some((item) => item.id === person.id) ? state : ({ sentRequests: [...state.sentRequests, person], notifications: [{ id: `sent-${person.id}`, type: "social", title: "Demande d’amitié envoyée", text: `${person.name} recevra votre invitation Audiva.`, time: "À l’instant", read: false }, ...state.notifications] })),
  acceptRequest: (id) => set((state) => { const request = state.requests.find((item) => item.id === id); if (!request) return state; const friend = { ...request, online: false, common: "Goûts à découvrir", playlist: "Première sélection" }; return { requests: state.requests.filter((item) => item.id !== id), friends: [...state.friends, friend], notifications: [{ id: `accepted-${id}`, type: "social", title: "Ami ajouté", text: `${request.name} fait maintenant partie de vos amis.`, time: "À l’instant", read: false }, ...state.notifications] }; }),
  declineRequest: (id) => set((state) => ({ requests: state.requests.filter((item) => item.id !== id) })),
  sendMessage: (conversationId, message) => set((state) => ({ conversations: state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, updatedAt: "À l’instant", messages: [...conversation.messages, { id: `me-${Date.now()}`, author: "me", ...message, time: "À l’instant", read: true }] } : conversation) })),
  clearConversation: (conversationId) => set((state) => ({ conversations: state.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, messages: [], unread: 0, updatedAt: "À l’instant" } : conversation) })),
  markConversationRead: (id) => set((state) => ({ conversations: state.conversations.map((conversation) => conversation.id === id ? { ...conversation, unread: 0, messages: conversation.messages.map((message) => ({ ...message, read: true })) } : conversation) })),
  markNotificationRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, read: true } : item) })),
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter((item) => item.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
  markAllNotificationsRead: () => set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) })),
}), { name: "audiva-social" }));
