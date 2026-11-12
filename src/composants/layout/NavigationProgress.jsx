"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const ATTRIBUTE = "data-navigation-pending";
const MAX_WAIT_MS = 12000;

export function NavigationProgress() {
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const timeout = useRef(null);

  useEffect(() => {
    const clear = () => {
      document.documentElement.removeAttribute(ATTRIBUTE);
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = null;
    };
    const start = () => {
      document.documentElement.setAttribute(ATTRIBUTE, "true");
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = window.setTimeout(clear, MAX_WAIT_MS);
    };
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", start);
      clear();
    };
  }, []);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      document.documentElement.removeAttribute(ATTRIBUTE);
      if (timeout.current) window.clearTimeout(timeout.current);
      timeout.current = null;
    }
  }, [pathname]);

  return null;
}
