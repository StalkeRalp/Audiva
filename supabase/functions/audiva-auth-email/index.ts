import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type AuthEmailEvent = {
  user: { email?: string; new_email?: string; user_metadata?: Record<string, unknown> };
  email_data: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
    site_url?: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

const EMAILJS_SERVICE_ID = "service_4dfszxi";
const EMAILJS_TEMPLATE_ID = "template_3wo5vr8";
const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const actionLabels: Record<string, string> = {
  signup: "Confirmation de votre compte Audiva",
  recovery: "Réinitialisation de votre mot de passe Audiva",
  magiclink: "Votre code de connexion Audiva",
  email_change: "Confirmation de changement d’adresse e-mail",
  invite: "Invitation à rejoindre Audiva",
  reauthentication: "Confirmation de sécurité Audiva",
  email: "Confirmation de votre adresse e-mail Audiva",
};

function confirmationUrl(tokenHash: string, action: string, redirectTo: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) throw new Error("SUPABASE_URL missing");
  const url = new URL("/auth/v1/verify", supabaseUrl);
  url.searchParams.set("token", tokenHash);
  url.searchParams.set("type", action);
  url.searchParams.set("redirect_to", redirectTo);
  return url.toString();
}

async function sendEmail(email: string, otp: string, tokenHash: string, action: string, redirectTo: string, siteUrl: string, publicKey: string, privateKey: string) {
  const body = JSON.stringify({
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: email,
      email,
      otp,
      code: otp,
      action,
      action_label: actionLabels[action] || "Vérification de votre compte Audiva",
      confirmation_url: confirmationUrl(tokenHash, action, redirectTo),
      redirect_to: redirectTo,
      site_url: siteUrl,
      app_name: "Audiva",
    },
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(EMAILJS_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
    });
    if (response.ok) return;

    const reason = (await response.text()).slice(0, 240);
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      // EmailJS permits one REST send per second. Retry transient throttling/provider errors.
      await new Promise(resolve => setTimeout(resolve, 1200 * (attempt + 1)));
      continue;
    }
    console.error("[audiva-auth-email] EmailJS rejected the send:", response.status, reason);
    throw new Error(`EmailJS request failed (${response.status})`);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "";
  const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY") || "";
  const privateKey = Deno.env.get("EMAILJS_PRIVATE_KEY") || "";
  if (!hookSecret || !publicKey || !privateKey) return jsonResponse({ error: "Email hook is not configured" }, 500);

  let event: AuthEmailEvent;
  try {
    const payload = await request.text();
    const verifier = new Webhook(hookSecret.replace(/^v1,whsec_/, ""));
    event = verifier.verify(payload, Object.fromEntries(request.headers)) as AuthEmailEvent;
  } catch {
    return jsonResponse({ error: "Invalid hook signature" }, 401);
  }

  const data = event.email_data;
  const action = data.email_action_type || "signup";
  const redirectTo = data.redirect_to || data.site_url || "";
  const siteUrl = data.site_url || "";

  try {
    if (action === "email_change" && data.token && data.token_hash_new && data.token_new && data.token_hash && event.user.new_email) {
      await sendEmail(event.user.email || "", data.token, data.token_hash_new, action, redirectTo, siteUrl, publicKey, privateKey);
      // EmailJS limits the REST send endpoint to one request per second.
      await new Promise(resolve => setTimeout(resolve, 1100));
      await sendEmail(event.user.new_email, data.token_new, data.token_hash, action, redirectTo, siteUrl, publicKey, privateKey);
    } else {
      const email = action === "email_change" ? event.user.new_email || event.user.email : event.user.email;
      const otp = data.token_new || data.token || "";
      const tokenHash = data.token_hash || data.token_hash_new || "";
      if (!email || !tokenHash) return jsonResponse({ error: "Auth email payload is incomplete" }, 400);
      await sendEmail(email, otp, tokenHash, action, redirectTo, siteUrl, publicKey, privateKey);
    }
    return jsonResponse({});
  } catch (error) {
    console.error("[audiva-auth-email] Delivery failed:", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Email delivery failed" }, 502);
  }
});
