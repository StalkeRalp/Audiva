export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("provider") !== "audius" || !searchParams.get("id")) return new Response("Morceau indisponible", { status: 404 });
  const url = new URL(`https://api.audius.co/v1/tracks/${encodeURIComponent(searchParams.get("id"))}/stream`);
  if (process.env.AUDIUS_API_KEY) url.searchParams.set("api_key", process.env.AUDIUS_API_KEY);
  const headers = process.env.AUDIUS_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.AUDIUS_BEARER_TOKEN}` } : {};
  const response = await fetch(url, { headers, redirect: "manual", cache: "no-store" });
  const location = response.headers.get("location");
  if (location) return Response.redirect(location, response.status);
  if (!response.ok) return new Response("Morceau indisponible", { status: response.status });
  return new Response(response.body, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") || "audio/mpeg" } });
}
