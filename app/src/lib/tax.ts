// Tasa de IVA/IGV/VAT estándar por país, en porcentaje. Sirve para PRE-LLENAR
// el IVA de cada línea de factura/cotización (el usuario puede cambiarlo).
// No es una fuente fiscal oficial: si tu país cambia la tasa, ajústala en la línea.
const VAT_PCT: Record<string, number> = {
  MX: 16, CR: 13, ES: 21, CO: 19, AR: 21, PE: 18, CL: 19, GT: 12,
  SV: 13, HN: 15, NI: 15, PA: 7, DO: 18, EC: 12, BO: 13, PY: 10,
  UY: 22, VE: 16, US: 0,
};

/** IVA estándar (en %) del país de la organización; 0 si no se conoce. */
export function defaultVatPct(country: string | null | undefined): number {
  return VAT_PCT[(country ?? "").toUpperCase()] ?? 0;
}
