/**
 * Utilidades de dinero. Regla del proyecto (ADR-006): el dinero se guarda como
 * entero en unidades menores (centavos). Nunca float.
 */

/**
 * Locale con el que se escribe cada moneda.
 *
 * Antes todo se formateaba con `es-MX`, y eso hacia que a un negocio de Costa
 * Rica sus propias cotizaciones le salieran como "CRC 2,117,055.00" en vez de
 * "₡ 2 117 055,00": sin el simbolo del colon y con separadores mexicanos.
 * En un documento que el cliente recibe, eso se ve ajeno.
 */
const LOCALE_POR_MONEDA: Record<string, string> = {
  MXN: "es-MX", CRC: "es-CR", COP: "es-CO", CLP: "es-CL", ARS: "es-AR",
  PEN: "es-PE", GTQ: "es-GT", HNL: "es-HN", NIO: "es-NI", PAB: "es-PA",
  DOP: "es-DO", BOB: "es-BO", PYG: "es-PY", UYU: "es-UY", VES: "es-VE",
  BRL: "pt-BR", EUR: "es-ES", USD: "en-US",
};

/**
 * Convierte un importe en centavos a string con formato de moneda.
 *
 * Se fuerzan 2 decimales siempre: Zentro guarda TODO en centavos, y hay
 * monedas (CLP, COP, PYG) cuyo locale los ocultaria y redondearia el importe
 * en pantalla, mostrando una cifra distinta a la que el usuario escribio.
 */
export function formatMoney(amountMinor: number, currency = "MXN", locale?: string): string {
  const loc = locale ?? LOCALE_POR_MONEDA[currency] ?? "es-MX";
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((amountMinor ?? 0) / 100);
}

/** Convierte lo que escribe el usuario (ej. "1234.50") a centavos (123450). */
export function toMinor(value: string | number): number {
  const n = typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) : value;
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Convierte centavos a un número decimal para mostrar en inputs. */
export function fromMinor(amountMinor: number): number {
  return (amountMinor ?? 0) / 100;
}
