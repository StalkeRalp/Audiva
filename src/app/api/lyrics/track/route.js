export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";

  return Response.json({
    ok: true,
    title,
    artist,
    lyrics: "Aucune parole trouvée pour cette piste.",
    source: "lyrics",
  });
}
