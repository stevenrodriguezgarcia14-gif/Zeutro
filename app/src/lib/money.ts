/**
 * Utilidades de dinero. Regla del proyecto (ADR-006): el dinero se guarda como
 * entero en unidades menores (centavos). Nunca float.
 */

/** Convierte un importe en centavos a string con formato de moneda. */
export function formatMoney(amountMinor: number, currency = "MXN", locale = "es-MX"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
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
