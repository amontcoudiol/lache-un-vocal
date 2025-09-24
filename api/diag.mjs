import { supabase, json, bad } from "./_supabase.mjs";

export async function GET() {
  try {
    const { error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true });
    if (error) return bad("DB: " + error.message, 500);
    return json({ ok: true });
  } catch (e) {
    return bad(String(e), 500);
  }
}
