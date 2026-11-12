import { useSocialStore } from "@/domaines/social/stores/socialStore";
import { useAuthStore } from "@/domaines/authentification/stores/authStore";

export function useAmis() {
  const user = useAuthStore(state => state.user);
  const amis = useSocialStore(state => state.friends);
  const requests = useSocialStore(state => state.requests);
  const loading = useSocialStore(state => state.cloudLoading);
  const error = useSocialStore(state => state.cloudError);
  const hydrate = useSocialStore(state => state.hydrateCloud);
  return { amis, requests, loading, error, refresh: () => hydrate(user?.id) };
}
