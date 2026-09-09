export async function GET() {
  return Response.json({
    ok: true,
    service: "supabase",
    status: "healthy",
  });
}
