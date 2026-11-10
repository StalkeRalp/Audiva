export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  return Response.json({
    ok: true,
    query: q,
    results: [],
    source: "jamendo",
  });
}
