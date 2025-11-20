// index.ts - create-lead
import { serve } from "std/server";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PHONE_RE = /^549[0-9]{8,12}$/;
serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Only POST", { status: 405 });
    let body: any;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400 }); }
    const { name, phone, province, utms = {}, variant, msg } = body || {};
    if (!name || !phone) return new Response(JSON.stringify({ error: "name and phone required" }), { status: 400 });
    const phoneNorm = String(phone).replace(/\D/g, "");
    if (!PHONE_RE.test(phoneNorm)) return new Response(JSON.stringify({ error: "phone invalid format" }), { status: 400 });

    const { data: leadData, error: leadErr } = await supabase.from("leads").insert({
      name: String(name).trim(),
      phone: phoneNorm,
      province: province || null,
      utm_source: utms.source || null,
      utm_medium: utms.medium || null,
      utm_campaign: utms.campaign || null,
      utm_content: utms.content || null,
      landing_variant: variant || null,
      notes: null
    }).select().single();

    if (leadErr) return new Response(JSON.stringify({ error: "db_insert_lead" }), { status: 500 });

    const { data: num } = await supabase.from("numbers").select("phone").eq("active", true).order("RANDOM()", { ascending: true }).limit(1).maybeSingle();
    const selected = String(num?.phone || "").replace(/\D/g, "");
    if (!selected) return new Response(JSON.stringify({ error: "no_numbers_available" }), { status: 500 });

    await supabase.from("clicks").insert({
      session_id: Math.random().toString(36).slice(2,10),
      phone_number_sent: selected,
      utm_source: utms.source || null,
      utm_campaign: utms.campaign || null,
      utm_content: utms.content || null,
      lead_id: leadData.id
    });

    const defaultMsg = `Hola, vengo de la landing de ${province || "mi provincia"} y quiero ayuda para registrarme.`;
    const text = encodeURIComponent((msg && String(msg).trim().length > 0) ? String(msg) : defaultMsg);
    const waUrl = `https://wa.me/${selected}?text=${text}`;

    return new Response(JSON.stringify({ waUrl, leadId: leadData.id }), { status: 200, headers: { "content-type":"application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "internal" }), { status: 500 });
  }
});
