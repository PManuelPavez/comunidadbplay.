
// Conexión a Supabase
const supabaseUrl = 'https://mkplcvwomznyyqniiwqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcGxjdndvbXpueXlxbmlpd3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjY0MzMsImV4cCI6MjA3ODcwMjQzM30.Ckauv0DBuiHoXjFeZlmwgugtuuipw3VEYCA6lWuvYWo';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

/****************************************************
 * OBTENER DATOS DINÁMICOS DE SUPABASE
 ****************************************************/
async function actualizarCBU(provincia) {
  const prov = provincia || null;
  const clave = prov ? `cbu_${prov.toLowerCase().replaceAll(" ", "")}` : null;
  const cbu = clave ? await getContenido(clave) : null;

  document.getElementById("cbuProv").textContent = prov || "—";
  document.getElementById("cbuVal").textContent = cbu || "—";

  const msg = encodeURIComponent(`Hola, ya tengo el CBU (${prov || 'SIN PROV'}) = ${cbu || 'N/D'} y quiero transferir`);
  document.getElementById("waBtn").href = `https://wa.me/5492617490475?text=${msg}`;
}

async function getContenido(clave) {
  try {
    const { data, error } = await supabase
      .from('contenido_dinamico')
      .select('valor')
      .eq('clave', clave)
      .single();

    if (error) {
      console.error('Error al obtener contenido:', error);
      return null;
    }
    return data.valor;
  } catch (err) {
    console.error('Error inesperado al obtener contenido:', err);
    return null;
  }
}

/****************************************************
 * TRACKING EN SUPABASE
 ****************************************************/
function trackClick(tipo, provincia) {
  supabase
    .from("clics")
    .insert([{ tipo, provincia, timestamp: new Date().toISOString() }])
    .then(({ error }) => {
      if (error) console.error("Error al registrar click:", error);
    });
}

/****************************************************
 * NORMALIZAR PROVINCIA
 ****************************************************/
function normalizeProvince(raw = "") {
  let k = raw.toUpperCase()
    .replaceAll("Á","A").replaceAll("É","E")
    .replaceAll("Í","I").replaceAll("Ó","O").replaceAll("Ú","U");

  if (k.includes("AUTONOMA") && k.includes("BUENOS AIRES")) return "CABA";
  if (k.includes("CIUDAD AUTONOMA")) return "CABA";
  if (k.includes("CABA")) return "CABA";
  if (k.includes("BUENOS AIRES")) return "BUENOS AIRES";
  if (k.includes("SANTA FE")) return "SANTA FE";
  if (k.includes("CORDOBA")) return "CORDOBA";
  if (k.includes("MENDOZA")) return "MENDOZA";

  return null;
}

/****************************************************
 * DETECTAR PROVINCIA (GEOLocalización)
 ****************************************************/
async function detectarProvincia() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const u = new URL("https://nominatim.openstreetmap.org/reverse");
          u.searchParams.set("format","jsonv2");
          u.searchParams.set("lat",p.coords.latitude);
          u.searchParams.set("lon",p.coords.longitude);
          u.searchParams.set("zoom","10");
          u.searchParams.set("accept-language","es");

          const r = await fetch(u);
          const d = await r.json();
          const prov = normalizeProvince(d.address?.state || "");

          resolve(prov);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 3000 }
    );
  });
}

/****************************************************
 * ACTUALIZAR WHATSAPP SEGÚN PROVINCIA
 ****************************************************/
async function actualizarWhatsAppSegunProvincia(provincia) {
  const whatsapp = await getContenido("whatsapp_num");

  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    try {
      const url = new URL(a.href);
      const text = url.searchParams.get("text") || "";
      const newText = encodeURIComponent(text + ` (provincia: ${provincia || 'N/D'})`);
      a.href = `https://wa.me/${whatsapp}?text=${newText}`;
    } catch {}
  });
}

/****************************************************
 * CARGAR TODO AL INICIAR
 ****************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  const provincia = await detectarProvincia();
  if (provincia && document.getElementById("geo")) {
    document.getElementById("geo").textContent = provincia;
  }

  await actualizarWhatsAppSegunProvincia(provincia);
  await actualizarCBU(provincia);

  if (provincia) trackClick("visita", provincia);
});

/****************************************************
 * CAMBIO MANUAL DESDE SELECTOR
 ****************************************************/
const sel = document.getElementById("provSel");
if (sel) {
  sel.addEventListener("change", () => {
    const value = sel.value || null;
    actualizarCBU(value);
  });
}
