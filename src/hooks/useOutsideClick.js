import { useEffect } from "react";

export function useOutsideClick(ref, handler) {
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler(e);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [ref, handler]);
}
