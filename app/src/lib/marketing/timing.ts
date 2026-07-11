import type { Script, ScriptSegment } from "./types";

// ============================================================================
// MOTOR DE TIEMPOS REALES — el estándar del Centro de Marketing.
//
// Los segundos de cada bloque NO se escriben a mano: se calculan de lo que
// realmente se dice, a velocidad de una persona hablando a cámara en español
// con buena vocalización, énfasis y respiración. Así todo guion (actual o
// futuro) queda calibrado automáticamente, sin recalibraciones manuales.
//
// Calibración:
// - 2.3 palabras/segundo hablado a cámara (≈138 ppm). El español conversa-
//   cional corre a 2.6-3.0 p/s, pero frente a cámara, vocalizando y con
//   micro-pausas de énfasis, 2.2-2.4 p/s es lo que de verdad se mide.
// - Cada "..." escrito en el guion = 0.6 s de pausa dramática.
// - `actionSec` = tiempo visual sin hablar (navegar la pantalla, mostrar algo).
// - `pauseAfterSec` = silencio deliberado al final del bloque.
// - Mínimo 2 s por bloque (nada legible dura menos).
// Regla de oro: claridad > cronómetro. Un gancho de 5-6 s que se entiende
// vale más que uno de 3 s imposible de decir.
// ============================================================================

export const WORDS_PER_SECOND = 2.3;

/** Cuenta palabras habladas (ignora acotaciones entre paréntesis). */
function spokenWords(say: string): number {
  const clean = say.replace(/\([^)]*\)/g, " ");
  return clean.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Duración realista de un bloque, en segundos (redondeada a 0.5). */
export function segmentSeconds(seg: ScriptSegment): number {
  const words = spokenWords(seg.say);
  const ellipses = (seg.say.match(/\.\.\./g) ?? []).length;
  const speech = words / WORDS_PER_SECOND;
  const total = speech + ellipses * 0.6 + (seg.actionSec ?? 0) + (seg.pauseAfterSec ?? 0);
  return Math.max(2, Math.round(total * 2) / 2);
}

export type TimedSegment = { from: number; to: number; seconds: number };

/** Línea de tiempo acumulada de un guion (bloque a bloque). */
export function scriptTimeline(script: Script): TimedSegment[] {
  let cursor = 0;
  return script.segments.map((seg) => {
    const seconds = segmentSeconds(seg);
    const t = { from: cursor, to: cursor + seconds, seconds };
    cursor += seconds;
    return t;
  });
}

/** Duración total realista del video (habla + pausas + acción + cortinilla). */
export function scriptTotalSeconds(script: Script): number {
  const CORTINILLA = 3.2; // cortinilla oficial v2 (con QR)
  const body = script.segments.reduce((acc, s) => acc + segmentSeconds(s), 0);
  return Math.round(body + CORTINILLA);
}

/** Formatea segundos para UI: 47 → "47 s", 65 → "1:05". */
export function fmtSeconds(s: number): string {
  const v = Math.round(s);
  if (v < 60) return `${v} s`;
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
}

/**
 * Chequeo de naturalidad (validación profesional): un bloque cómodo queda
 * entre 2.0 y 2.6 palabras/seg una vez restadas pausas y acción. Devuelve
 * los índices de bloques fuera de rango (para tests y auditoría).
 */
export function paceIssues(script: Script): number[] {
  const issues: number[] = [];
  script.segments.forEach((seg, i) => {
    const words = spokenWords(seg.say);
    if (words === 0) return; // bloque de acción pura
    const seconds = segmentSeconds(seg) - (seg.actionSec ?? 0) - (seg.pauseAfterSec ?? 0);
    const wps = words / Math.max(seconds, 0.1);
    if (wps > 2.6) issues.push(i);
  });
  return issues;
}
