// supabase/functions/create-lead/index.ts
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PHONE_RE = /^549[0-9]{8,12}$/;
const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 6;

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Only POST", { status: 405 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

    let body: any;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 }); }

    const { name, phone, province, utms = {}, variant, msg } = body || {};
    if (!name || !phone) return new Response(JSON.stringify({ error: "name and phone required" }), { status: 400 });

    const phoneNorm = String(phone).replace(/\D/g, "");
    if (!PHONE_RE.test(phoneNorm)) return new Response(JSON.stringify({ error: "phone invalid format" }), { status: 400 });

    // Rate limit (table-backed)
    const key = `ip:${ip}`;
    const { data: rl } = await supabase.from("rate_limits").select("*").eq("key", key).maybeSingle();

    if (!rl) {
      await supabase.from("rate_limits").insert({ key, count: 1, window_start: new Date().toISOString() });
    } else {
      const windowStart = new Date(rl.window_start).getTime();
      const diff = (Date.now() - windowStart) / 1000;
      if (diff > RATE_LIMIT_WINDOW_SEC) {
        await supabase.from("rate_limits").upsert({ key, count: 1, window_start: new Date().toISOString() });
      } else {
        if (rl.count >= RATE_LIMIT_MAX) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });
        await supabase.from("rate_limits").upsert({ key, count: rl.count + 1, window_start: rl.window_start });
      }
    }

    // Insert lead
    const leadPayload = {
      name: String(name).trim(),
      phone: phoneNorm,
      province: province || null,
      utm_source: utms.source || null,
      utm_medium: utms.medium || null,
      utm_campaign: utms.campaign || null,
      utm_content: utms.content || null,
      landing_variant: variant || null,
      notes: null
    };

    const { data: leadData, error: leadErr } = await supabase.from("leads").insert(leadPayload).select().single();
    if (leadErr) {
      console.error("lead insert error:", leadErr);
      return new Response(JSON.stringify({ error: "db_insert_lead" }), { status: 500 });
    }

    // number selection (random or roundrobin)
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "random";

    let selectedNumber: string | null = null;

    if (mode === "random") {
      const { data: rand } = await supabase.from("numbers").select("phone").eq("active", true).order("RANDOM()", { ascending: true }).limit(1).maybeSingle();
      selectedNumber = rand?.phone ?? null;
    } else {
      const { data: rr } = await supabase.from("numbers").select("phone").eq("active", true).order("last_used_at", { ascending: true, nulls: "first" }).limit(1).maybeSingle();
      selectedNumber = rr?.phone ?? null;
      if (selectedNumber) {
        await supabase.from("numbers").update({ last_used_at: new Date().toISOString() }).eq("phone", selectedNumber);
      }
    }

    if (!selectedNumber) return new Response(JSON.stringify({ error: "no_numbers_available" }), { status: 500 });
    const selected = String(selectedNumber).replace(/\D/g, "");

    // Insert click
    const clickPayload = {
      session_id: Math.random().toString(36).slice(2,10),
      phone_number_sent: selected,
      utm_source: leadPayload.utm_source,
      utm_campaign: leadPayload.utm_campaign,
      utm_content: leadPayload.utm_content,
      lead_id: leadData.id
    };
    await supabase.from("clicks").insert(clickPayload);

    // Build wa.me url
    const defaultMsg = `Hola, vengo de la landing de ${leadPayload.province || "mi provincia"} y quiero ayuda para registrarme.`;
    const text = encodeURIComponent((msg && String(msg).trim().length > 0) ? String(msg) : defaultMsg);
    const waUrl = `https://wa.me/${selected}?text=${text}`;

    return new Response(JSON.stringify({ waUrl, leadId: leadData.id }), { status: 200, headers: { "content-type": "application/json" } });

  } catch (err) {
    console.error("Unhandled error in create-lead:", err);
    return new Response(JSON.stringify({ error: "internal" }), { status: 500 });
  }
});
