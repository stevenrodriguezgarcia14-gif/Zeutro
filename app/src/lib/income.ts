// Fuente única para netear el IVA del ingreso, y así Dashboard y Rentabilidad
// nunca diverjan (auditoría C4). Las ventas rápidas guardan el monto IVA-incluido
// (lo realmente cobrado) más su tasa; aquí se obtiene la parte que SÍ es ingreso.

/**
 * Ingreso neto de IVA a partir de un monto IVA-incluido.
 * rateBps = 0 (lo normal en ventas de contado sin IVA) → neto = bruto.
 */
export function netOfTaxInclusive(grossMinor: number, rateBps: number | null | undefined): number {
  const r = rateBps ?? 0;
  if (r <= 0) return Math.round(grossMinor);
  return Math.round((grossMinor * 10000) / (10000 + r));
}

/** IVA contenido en un monto IVA-incluido (el complemento de netOfTaxInclusive). */
export function taxOfInclusive(grossMinor: number, rateBps: number | null | undefined): number {
  return Math.round(grossMinor) - netOfTaxInclusive(grossMinor, rateBps);
}
