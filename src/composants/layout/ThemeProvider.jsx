"use client";

import { useEffect } from "react";

const THEME_KEY = "audiva-color-theme";

function persistThemeCookie(theme) {
  try {
    document.cookie = `${THEME_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {}
}

export default function ThemeProvider() {
  useEffect(() => {
    let theme = document.documentElement.dataset.theme === "apple" ? "apple" : "audiva";
    try {
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      if (savedTheme === "apple" || savedTheme === "audiva") theme = savedTheme;
      else window.localStorage.setItem(THEME_KEY, theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
    persistThemeCookie(theme);

    const onThemeChange = event => {
      const nextTheme = event.detail?.theme === "apple" ? "apple" : "audiva";
      document.documentElement.dataset.theme = nextTheme;
      persistThemeCookie(nextTheme);
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
  persistThemeCookie(theme);
  window.dispatchEvent(new CustomEvent("audiva-theme-change", { detail: { theme } }));
}
