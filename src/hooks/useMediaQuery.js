import { useSyncExternalStore } from "react";

export function useMediaQuery(query) {
  const subscribe = (callback) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
