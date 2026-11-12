export default function sitemap() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!configuredUrl) return [];

  let origin;
  try {
    origin = new URL(configuredUrl).origin;
  } catch {
    return [];
  }

  return [{
    url: origin,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  }];
}
