/** Largo máximo del subtítulo de un producto (cabe en una línea en móvil). */
export const SUBTITLE_MAX = 80;

/**
 * Normaliza el subtítulo de un producto: recorta espacios, colapsa saltos de
 * línea y limita el largo. Devuelve `null` cuando el usuario no escribió nada,
 * para que la ficha no reserve un hueco vacío bajo el nombre.
 *
 * Es puramente visual: no participa en ningún cálculo de costo ni precio.
 */
export function normalizeSubtitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const clean = raw.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.slice(0, SUBTITLE_MAX).trim() || null;
}

/** Lee y normaliza el campo `subtitle` de un formulario. */
export function readSubtitle(formData: { get(name: string): unknown }): string | null {
  return normalizeSubtitle(formData.get("subtitle"));
}
