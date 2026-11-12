import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";

export function useChat() {
  const user = useAuthStore(state => state.user);
  const conversations = useSocialStore(state => state.conversations);
  const friends = useSocialStore(state => state.friends);
  const loading = useSocialStore(state => state.cloudLoading);
  const error = useSocialStore(state => state.cloudError);
  const hydrate = useSocialStore(state => state.hydrateCloud);
  const sendMessage = useSocialStore(state => state.sendMessage);
  return { conversations, friends, loading, error, refresh: () => hydrate(user?.id), sendMessage };
}
