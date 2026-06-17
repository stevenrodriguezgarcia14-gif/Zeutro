// Códigos de marcación por país (los más comunes de LatAm + España) para
// armar enlaces de WhatsApp (wa.me requiere el número con código de país).
const DIAL_CODES: Record<string, string> = {
  MX: "52", CR: "506", ES: "34", CO: "57", AR: "54", PE: "51", CL: "56",
  GT: "502", SV: "503", HN: "504", NI: "505", PA: "507", DO: "1",
  EC: "593", BO: "591", PY: "595", UY: "598", VE: "58", US: "1",
};

/**
 * Normaliza un teléfono a formato internacional solo-dígitos para wa.me.
 * Si el número parece local (no empieza por el código de país y es corto),
 * antepone el código del país de la organización. Devuelve "" si no hay número.
 */
export function toWhatsappNumber(raw: string | null | undefined, country: string | null | undefined): string {
  const digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  const code = DIAL_CODES[(country ?? "").toUpperCase()] ?? "";
  if (!code) return digits;
  // Si ya incluye el código de país al inicio, dejarlo.
  if (digits.startsWith(code)) return digits;
  // Heurística: números locales de hasta 11 dígitos -> anteponer el código.
  if (digits.length <= 11) return code + digits;
  return digits;
}
