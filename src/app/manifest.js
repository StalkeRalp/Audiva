export default function manifest() {
  return {
    id: "/",
    name: "Audiva — votre univers musical",
    short_name: "Audiva",
    description: "Votre musique, votre bibliothèque et vos découvertes réunies dans Audiva.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#060b18",
    theme_color: "#060b18",
    icons: [
      { src: "/icons/audiva-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/audiva-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
