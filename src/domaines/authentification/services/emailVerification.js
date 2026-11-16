export function isEmailVerified(user) {
  if (!user) return false;
  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers || [];
  const hasSocialIdentity = providers.some(name => name !== "email");
  const isEmailIdentity = provider === "email" || (!provider && !hasSocialIdentity);
  return !isEmailIdentity || Boolean(user.email_confirmed_at || user.confirmed_at);
}
