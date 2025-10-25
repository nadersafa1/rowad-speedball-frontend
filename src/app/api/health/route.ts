export async function GET() {
  return Response.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "rowad-speedball-frontend",
    },
    { status: 200 }
  );
}
