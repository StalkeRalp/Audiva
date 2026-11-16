import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";
import { isSupabaseConfigured } from "@/services/supabase/client";
import { clearCloudConversation, createDirectConversation, createFriendInvitation, createFriendRequest, deleteNotification, loadSocialCloud, markNotificationRead as markCloudNotificationRead, markRead, persistMessage, respondFriendRequest, setAllNotificationsRead, softDeleteMessage, updateMessageText } from "../services/supabaseSocial";

const isLegacyDemo = state => (state?.friends || []).some(person => ["sophie", "marc", "julie"].includes(person.id)) || (state?.conversations || []).some(item => ["sophie", "marc", "julie"].includes(item.participantId));

export const useSocialStore = create(persist((set, get) => ({
  friends: [], requests: [], conversations: [], notifications: [], activities: [], sentRequests: [], invites: [],
  cloudLoading: false, cloudError: "", activeUserId: null,
  setCloudSnapshot: (snapshot, userId) => set({ ...snapshot, activeUserId: userId, cloudLoading: false, cloudError: "" }),
  setCloudLoading: (cloudLoading) => set({ cloudLoading }),
  setCloudError: (cloudError) => set({ cloudLoading: false, cloudError }),
  hydrateCloud: async (userId = useAuthStore.getState().user?.id) => {
    if (!userId || !isSupabaseConfigured) return;
    set({ cloudLoading: true, cloudError: "", activeUserId: userId });
    try { const snapshot = await loadSocialCloud(userId); set({ ...snapshot, activeUserId: userId, cloudLoading: false, cloudError: "" }); }
    catch (error) { set({ cloudLoading: false, cloudError: error.message || "La synchronisation sociale a échoué." }); }
  },
  getOrCreateConversation: async (friendId) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    const existing = get().conversations.find(item => item.participantId === friendId);
    if (existing) return existing.id;
    try { const id = await createDirectConversation(friendId); await get().hydrateCloud(userId); return id; }
    catch (error) { set({ cloudError: error.message || "Impossible d’ouvrir cette conversation." }); return null; }
  },
  createInvite: async () => {
    try { const invitation = await createFriendInvitation(); set(state => ({ invites: [invitation, ...state.invites.filter(item => item.expiresAt > Date.now())] })); return invitation; }
    catch (error) { set({ cloudError: error.message || "Impossible de créer le lien d’invitation." }); return null; }
  },
  getInviteStatus: token => { const invitation = get().invites.find(item => item.token === token); if (!invitation) return "inconnue"; return invitation.expiresAt > Date.now() ? "active" : "expirée"; },
  sendFriendRequest: async person => {
    if (!useAuthStore.getState().user) { set({ cloudError: "Connectez-vous pour ajouter un ami." }); return false; }
    try {
      const requestId = await createFriendRequest(person.id);
      set(state => ({ sentRequests: [...state.sentRequests.filter(item => item.id !== person.id), { ...person, requestId, status: "pending" }], cloudError: "" }));
      await get().hydrateCloud();
      return true;
    }
    catch (error) { set({ cloudError: error.message || "Impossible d’envoyer la demande." }); return false; }
  },
  acceptRequest: async id => {
    const request = get().requests.find(item => item.id === id || item.requestId === id);
    if (!request?.requestId) return;
    try { await respondFriendRequest(request.requestId, true); await get().hydrateCloud(); }
    catch (error) { set({ cloudError: error.message || "Impossible d’accepter la demande." }); }
  },
  declineRequest: async id => {
    const request = get().requests.find(item => item.id === id || item.requestId === id);
    if (!request?.requestId) return;
    try { await respondFriendRequest(request.requestId, false); await get().hydrateCloud(); }
    catch (error) { set({ cloudError: error.message || "Impossible de refuser la demande." }); }
  },
  sendMessage: async (conversationId, message) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) { set({ cloudError: "Connectez-vous pour envoyer un message." }); return false; }
    if (!conversationId) { set({ cloudError: "Ouvrez une conversation avant d’envoyer un message." }); return false; }
    try {
      const entry = await persistMessage(conversationId, message, userId);
      set(state => ({ conversations: state.conversations.map(conversation => conversation.id === conversationId ? { ...conversation, updatedAt: entry.time, unread: 0, messages: conversation.messages.some(existing => existing.id === entry.id) ? conversation.messages : [...conversation.messages, entry] } : conversation), cloudError: "" }));
      return true;
    } catch (error) { set({ cloudError: error.message || "Le message n’a pas pu être envoyé." }); return false; }
  },
  editMessage: async (messageId, text) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) { set({ cloudError: "Connectez-vous pour modifier ce message." }); return false; }
    try {
      const updated = await updateMessageText(messageId, text, userId);
      set(state => ({ conversations: state.conversations.map(conversation => ({ ...conversation, messages: conversation.messages.map(message => message.id === messageId ? updated : message) })), cloudError: "" }));
      return true;
    } catch (error) { set({ cloudError: error.message || "Impossible de modifier ce message." }); return false; }
  },
  deleteMessage: async messageId => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) { set({ cloudError: "Connectez-vous pour supprimer ce message." }); return false; }
    try {
      const deleted = await softDeleteMessage(messageId, userId);
      set(state => ({ conversations: state.conversations.map(conversation => ({ ...conversation, messages: conversation.messages.map(message => message.id === messageId ? deleted : message) })), cloudError: "" }));
      return true;
    } catch (error) { set({ cloudError: error.message || "Impossible de supprimer ce message." }); return false; }
  },
  clearConversation: async conversationId => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    try { await clearCloudConversation(conversationId, userId); set(state => ({ conversations: state.conversations.map(item => item.id === conversationId ? { ...item, messages: [], unread: 0 } : item) })); }
    catch (error) { set({ cloudError: error.message || "Impossible d’effacer l’historique." }); }
  },
  markConversationRead: async id => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    set(state => ({ conversations: state.conversations.map(item => item.id === id ? { ...item, unread: 0, messages: item.messages.map(message => message.author === "me" ? message : { ...message, read: true }) } : item) }));
    try { await markRead(id, userId); } catch { /* The local read state remains available if the network is offline. */ }
  },
  markNotificationRead: async id => {
    set(state => ({ notifications: state.notifications.map(item => item.id === id ? { ...item, read: true } : item) }));
    try { await markCloudNotificationRead(id); } catch { /* Keep the local optimistic update. */ }
  },
  removeNotification: async id => {
    set(state => ({ notifications: state.notifications.filter(item => item.id !== id) }));
    try { await deleteNotification(id); } catch (error) { set({ cloudError: error.message || "Impossible de supprimer la notification." }); }
  },
  clearNotifications: async () => {
    const ids = get().notifications.map(item => item.id);
    for (const id of ids) await get().removeNotification(id);
  },
  markAllNotificationsRead: async () => {
    set(state => ({ notifications: state.notifications.map(item => ({ ...item, read: true })) }));
    try { await setAllNotificationsRead(); } catch (error) { set({ cloudError: error.message || "Impossible de mettre à jour les notifications." }); }
  },
}), {
  name: "audiva-social",
  version: 2,
  migrate: persisted => isLegacyDemo(persisted) ? {} : persisted,
  partialize: state => ({ invites: state.invites }),
}));
