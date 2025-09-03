import { supabase, json, bad } from "./_supabase.mjs";

export async function GET(req) {
  const auth = req.headers.get("authorization") || "";
  const expect = `Bearer ${process.env.BACKEND_SHARED_SECRET}`;
  if (auth !== expect) return bad("unauthorized", 401);

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) return bad(error.message, 500);
  return json({ unread: count || 0 });
}
