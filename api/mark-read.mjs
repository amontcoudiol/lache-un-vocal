import { supabase, json, bad } from "./_supabase.mjs";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { id, slug } = body;
  if (!slug || !/[\w-]{8,}/.test(slug)) return bad("invalid slug", 403);
  if (!id) return bad("missing id");

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("id", id);
  if (error) return bad(error.message, 500);

  // Si plus aucun non-lu, déclenche IFTTT pour couper l'effet (raccourci "Vocal OFF")
  try {
    const { count, error: cErr } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (!cErr && (count || 0) === 0) {
      const key = process.env.IFTTT_KEY;
      if (key) {
        await fetch(`https://maker.ifttt.com/trigger/vocal_clear/json/with/key/${key}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ unread_hint: 'cleared' })
        });
      }
    }
  } catch (_) {}

  return json({ ok: true });
}
