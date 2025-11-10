export function normalizeProvince(raw = "") {
  let k = raw.toUpperCase()
    .replaceAll("Á","A").replaceAll("É","E").replaceAll("Í","I").replaceAll("Ó","O").replaceAll("Ú","U");

  if (k.includes("AUTONOMA") && k.includes("BUENOS AIRES")) return "CABA";
  if (k.includes("CIUDAD AUTONOMA")) return "CABA";
  if (k.includes("CABA")) return "CABA";
  if (k.includes("BUENOS AIRES")) return "BUENOS AIRES";
  if (k.includes("SANTA FE")) return "SANTA FE";
  if (k.includes("CORDOBA")) return "CORDOBA";
  if (k.includes("MENDOZA")) return "MENDOZA";
  return null;
}
