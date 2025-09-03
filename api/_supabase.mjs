import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
export const bucket = process.env.SUPABASE_BUCKET || "messages";

if (!url || !serviceKey) throw new Error("Missing Supabase env vars");

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

export function json(data, init = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === "number" ? init : 200,
    headers: { "content-type": "application/json" }
  });
}

export function bad(msg, code = 400) { return json({ error: msg }, code); }
