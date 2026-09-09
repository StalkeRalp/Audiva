import { useEffect, useState } from "react";

export function useIntersectionObserver(ref, options) {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), options);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, options]);
  return isIntersecting;
}
