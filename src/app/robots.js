export default function robots() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  let sitemap;
  try {
    if (configuredUrl) sitemap = new URL("/sitemap.xml", configuredUrl).toString();
  } catch {
    sitemap = undefined;
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/accueil",
        "/albums",
        "/amis",
        "/auth/",
        "/authentification/",
        "/bibliotheque",
        "/chat",
        "/favoris",
        "/historique",
        "/lecteur",
        "/parametres",
        "/playlists",
        "/recherche",
        "/spotify/",
        "/statistiques",
      ],
    },
    ...(sitemap ? { sitemap } : {}),
  };
}
