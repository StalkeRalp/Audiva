"use client";

import { useEffect } from "react";

const THEME_KEY = "audiva-color-theme";

export default function ThemeProvider() {
  useEffect(() => {
    try {
      document.documentElement.dataset.theme =
        window.localStorage.getItem(THEME_KEY) === "apple" ? "apple" : "audiva";
    } catch {
      document.documentElement.dataset.theme = "audiva";
    }

    const onThemeChange = event => {
      document.documentElement.dataset.theme = event.detail?.theme === "apple" ? "apple" : "audiva";
    };
    window.addEventListener("audiva-theme-change", onThemeChange);
    return () => window.removeEventListener("audiva-theme-change", onThemeChange);
  }, []);

  return null;
}

export function toggleAppleTheme() {
  const root = document.documentElement;
  const theme = root.dataset.theme === "apple" ? "audiva" : "apple";
  root.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {}
  window.dispatchEvent(new CustomEvent("audiva-theme-change", { detail: { theme } }));
}
