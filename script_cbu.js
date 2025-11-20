// === Supabase config ===
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  "https://mkplcvwomznyyqniiwqt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcGxjdndvbXpueXlxbmlpd3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMjY0MzMsImV4cCI6MjA3ODcwMjQzM30.Ckauv0DBuiHoXjFeZlmwgugtuuipw3VEYCA6lWuvYWo"
);

// === Normalizar texto de provincia ===
function normalizarProvincia(raw = '') {
  const k = raw.toUpperCase()
    .replaceAll("Á", "A").replaceAll("É", "E").replaceAll("Í", "I").replaceAll("Ó", "O").replaceAll("Ú", "U");
  if (k.includes("AUTONOMA") && k.includes("BUENOS AIRES")) return "CABA";
  if (k.includes("CIUDAD AUTONOMA")) return "CABA";
  if (k.includes("CABA")) return "CABA";
  if (k.includes("BUENOS AIRES")) return "BUENOS AIRES";
  if (k.includes("SANTA FE")) return "SANTA FE";
  if (k.includes("CORDOBA")) return "CORDOBA";
  if (k.includes("MENDOZA")) return "MENDOZA";
  return null;
}

// === Obtener CBU desde Supabase según provincia
async function obtenerCBU(provincia) {
  const clave = `CBU_${provincia}`;
  const { data, error } = await supabase
    .from('contenidos')
    .select('valor')
    .eq('clave', clave)
    .single();

  if (error) {
    console.error('❌ Error al obtener CBU:', error.message);
    return null;
  }
  return data?.valor || null;
}

// === Actualizar contenido del DOM
async function mostrarCBU(provincia) {
  const prov = provincia || "—";
  const cbu = provincia ? await obtenerCBU(provincia) : "—";

  document.getElementById('cbuProv').textContent = prov;
  document.getElementById('cbuVal').textContent = cbu || "—";

  const msg = encodeURIComponent(`Hola, ya tengo el CBU (${prov}) = ${cbu} y quiero transferir`);
  document.getElementById("waBtn").href = `https://wa.me/5492617490475?text=${msg}`;
}

// === Obtener provincia por geolocalización
async function detectarProvinciaGeo() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const url = new URL("https://nominatim.openstreetmap.org/reverse");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("lat", latitude);
        url.searchParams.set("lon", longitude);
        url.searchParams.set("zoom", "10");
        url.searchParams.set("accept-language", "es");

        const response = await fetch(url, {
          headers: { "User-Agent": "bplay-cbu/1.0" }
        });
        const data = await response.json();
        const prov = normalizarProvincia(data.address?.state || "");
        resolve(prov);
      } catch (e) {
        console.warn("⚠️ No se pudo detectar provincia:", e);
        resolve(null);
      }
    }, () => resolve(null), { timeout: 3000 });
  });
}

// === Tracking
function trackClick(tipo, provincia) {
  supabase
    .from("clics")
    .insert([{ tipo, provincia, timestamp: new Date().toISOString() }])
    .then(({ error }) => {
      if (error) console.error("❌ Error en tracking:", error.message);
    });
}

// === Copiar botón
function configurarBotonCopiar() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const target = document.querySelector(btn.getAttribute("data-copy"));
    if (!target) return;

    const texto = target.textContent.trim();
    if (!texto || texto === "—") return;

    navigator.clipboard.writeText(texto).then(() => {
      btn.textContent = "Copiado ✓";
      setTimeout(() => btn.textContent = "Copiar", 1500);
    });
  });
}

// === Select manual de provincia
function configurarSelectorManual() {
  const select = document.getElementById("provSel");
  if (!select) return;

  select.addEventListener("change", async () => {
    const prov = select.value || null;
    await mostrarCBU(prov);
    if (prov) trackClick("manual", prov);
  });
}

// === INIT
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 script_cbu.js cargado");

  configurarBotonCopiar();
  configurarSelectorManual();

  const prov = await detectarProvinciaGeo();
  if (prov) {
    document.getElementById("provSel").value = prov;
  }

  await mostrarCBU(prov);
  if (prov) trackClick("visita", prov);
});
