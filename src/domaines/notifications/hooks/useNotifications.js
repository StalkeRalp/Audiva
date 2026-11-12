import { useSocialStore } from "@/domaines/social/stores/socialStore";

export function useNotifications() {
  const items = useSocialStore(state => state.notifications);
  const loading = useSocialStore(state => state.cloudLoading);
  const error = useSocialStore(state => state.cloudError);
  return { items, loading, error };
}
