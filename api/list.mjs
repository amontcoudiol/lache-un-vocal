import { supabase, json, bad } from "./_supabase.mjs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug || !/^[a-zA-Z0-9_-]{8,}$/.test(slug)) return bad("missing/invalid slug", 403);

  const { data, error } = await supabase
    .from("messages")
    .select("id, path, duration_sec, is_read, created_at")
    .order("created_at", { ascending: false });

  if (error) return bad(error.message, 500);

  // Build public URLs
  const url = process.env.SUPABASE_URL;
  const bucket = process.env.SUPABASE_BUCKET || "messages";
  const base = `${url}/storage/v1/object/public/${bucket}`;

  const rows = data.map(r => ({
    id: r.id,
    url: `${base}/${encodeURIComponent(r.path)}`,
    duration_sec: r.duration_sec,
    is_read: r.is_read,
    created_at: r.created_at
  }));

  return json(rows);
}
