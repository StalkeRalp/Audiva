function webImage(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export function getAuthProfileImage(user) {
  if (!user) return "";
  const metadata = user.user_metadata || {};
  const identities = Array.isArray(user.identities) ? user.identities : [];
  const provider = user.app_metadata?.provider;
  const orderedIdentities = [
    ...identities.filter((identity) => identity.provider === provider),
    ...identities.filter((identity) => identity.provider !== provider),
  ];
  const identityImages = orderedIdentities.flatMap((identity) => {
    const data = identity.identity_data || {};
    return [data.avatar_url, data.picture, data.photo_url, data.image];
  });

  return [
    metadata.avatar_url,
    metadata.picture,
    metadata.photo_url,
    metadata.image,
    ...identityImages,
  ].map(webImage).find(Boolean) || "";
}
