export async function loginWithEmail(email, password) {
  return { email, password, ok: true };
}

export async function registerWithEmail(payload) {
  return { ...payload, ok: true };
}

export async function signOut() {
  return { ok: true };
}
