import { supabase, bucket, json, bad } from "./_supabase.mjs";

export async function POST(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) return bad("form-data required");

  const form = await req.formData();
  const file = form.get("audio");
  const duration = Number(form.get("duration")) || 0;
  if (!file || !(file instanceof File)) return bad("audio file missing");
  if (!duration || duration <= 0 || duration > 600) return bad("invalid duration");

  // Build a random filename preserving an appropriate extension
  const ext = (file.type.includes("mp4") ? "m4a" : file.type.includes("webm") ? "webm" : "bin");
  const path = `${crypto.randomUUID()}.${ext}`;

  // Upload to Storage (public bucket)
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
  if (upErr) return bad(upErr.message, 500);

  // Insert DB row
  const ua = req.headers.get("user-agent") || null;
  const ip = req.headers.get("x-forwarded-for") || null;
  const { error: dbErr } = await supabase
    .from("messages")
    .insert({ path, duration_sec: Math.round(duration), ua, ip, is_read: false });
  if (dbErr) return bad(dbErr.message, 500);

  // 🔔 Déclenche IFTTT pour démarrer le clignotement (raccourci "Vocal Blink ON")
  try {
    const key = process.env.IFTTT_KEY;
    if (key) {
      await fetch(`https://maker.ifttt.com/trigger/vocal_new/json/with/key/${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ unread_hint: 'new_message' })
      });
    }
  } catch (_) {}

  return json({ ok: true });
}
