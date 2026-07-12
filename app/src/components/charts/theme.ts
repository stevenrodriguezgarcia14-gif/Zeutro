/**
 * Tokens de visualización de Zentro — paleta VALIDADA (skill dataviz,
 * validate_palette.js, superficie blanca, modo claro):
 *  - Par ingresos/gastos:  ΔE CVD 39.3 · contraste ≥3:1 · PASS completo.
 *  - Par utilidad +/−:     ΔE CVD 23.0 · PASS (refuerzo: dirección + signo).
 *  - Trío estado de cobro: peor par ΔE 16.9 · PASS (refuerzo: etiqueta + monto).
 *  - El verde de marca #00C781 NO pinta barras (contraste 2.2:1 vs blanco):
 *    se reserva como acento de la sparkline junto a valores en texto.
 *
 * Regla de identidad: el color sigue a la entidad en TODO el dashboard —
 * verde = dinero que entra · ámbar = dinero que sale · rojo = en riesgo.
 */
export const CHART = {
  in: "#059669", //   emerald-600 — dinero que entra (ingresos, cobrado, al día)
  out: "#d97706", //  amber-600   — dinero que sale (gastos) / por vencer
  bad: "#dc2626", //  red-600     — pérdida / vencido
  accent: "#00C781", // verde de marca — SOLO acentos pequeños (sparkline)
  muted: "#cbd5e1", // slate-300  — serie de contexto / sparkline base
  grid: "#f1f5f9", // slate-100   — gridlines hairline
} as const;

/** Compacta un monto en centavos para ticks de eje: 12 500 00 → "12.5 mil". */
export function compactMoney(minor: number, locale = "es-MX"): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    Math.round(minor / 100),
  );
}

/** Ticks "limpios" para un eje: [0, mitad, tope redondeado]. */
export function niceTicks(max: number): number[] {
  if (max <= 0) return [0];
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / pow) * pow;
  return [0, top / 2, top];
}
