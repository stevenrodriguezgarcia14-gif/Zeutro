import type { Pillar, VideoStatus } from "@/lib/marketing/types";

// Tokens visuales del Marketing OS. Un solo lugar para color semántico:
// pilares, estados y tipos de tarea comparten lenguaje en todo el OS.

export const GREEN = "#00C781";

export const PILLAR_THEME: Record<Pillar, { name: string; dot: string; chip: string; text: string }> = {
  P1: { name: "Dolor", dot: "bg-rose-400", chip: "bg-rose-400/10 text-rose-300 ring-rose-400/20", text: "text-rose-300" },
  P2: { name: "Build in public", dot: "bg-sky-400", chip: "bg-sky-400/10 text-sky-300 ring-sky-400/20", text: "text-sky-300" },
  P3: { name: "Demo", dot: "bg-emerald-400", chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20", text: "text-emerald-300" },
  P4: { name: "Historia", dot: "bg-amber-400", chip: "bg-amber-400/10 text-amber-300 ring-amber-400/20", text: "text-amber-300" },
  P5: { name: "Comunidad", dot: "bg-violet-400", chip: "bg-violet-400/10 text-violet-300 ring-violet-400/20", text: "text-violet-300" },
};

export const STATUS_THEME: Record<VideoStatus, { label: string; chip: string; bar: string }> = {
  pendiente: { label: "Pendiente", chip: "bg-white/[0.06] text-zinc-400 ring-white/10", bar: "bg-zinc-600" },
  grabado: { label: "Grabado", chip: "bg-sky-400/10 text-sky-300 ring-sky-400/25", bar: "bg-sky-400" },
  editado: { label: "Editado", chip: "bg-violet-400/10 text-violet-300 ring-violet-400/25", bar: "bg-violet-400" },
  publicado: { label: "Publicado", chip: "bg-[#00C781]/15 text-[#3ee6a8] ring-[#00C781]/30", bar: "bg-[#00C781]" },
};

export const KIND_THEME: Record<string, { label: string; chip: string; dot: string }> = {
  grabar: { label: "Grabar", chip: "bg-sky-400/10 text-sky-300 ring-sky-400/25", dot: "bg-sky-400" },
  editar: { label: "Editar", chip: "bg-violet-400/10 text-violet-300 ring-violet-400/25", dot: "bg-violet-400" },
  publicar: { label: "Publicar", chip: "bg-[#00C781]/12 text-[#3ee6a8] ring-[#00C781]/25", dot: "bg-[#00C781]" },
  revisar: { label: "Métricas", chip: "bg-amber-400/10 text-amber-300 ring-amber-400/25", dot: "bg-amber-400" },
  campaña: { label: "Campaña", chip: "bg-white/[0.06] text-zinc-400 ring-white/10", dot: "bg-zinc-500" },
  comunidad: { label: "Comunidad", chip: "bg-pink-400/10 text-pink-300 ring-pink-400/25", dot: "bg-pink-400" },
};

/** Fecha local del fundador (LatAm, sin horario de verano). */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export const DOW_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const DOW_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function dayOfWeek(date: string): number {
  return new Date(date + "T12:00:00Z").getUTCDay();
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtShort(date: string): string {
  return `${DOW_SHORT[dayOfWeek(date)]} ${Number(date.slice(8, 10))}`;
}
