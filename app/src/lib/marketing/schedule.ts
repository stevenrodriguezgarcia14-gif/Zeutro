import type { CalendarTask, VideoStatus } from "./types";
import { VIDEOS } from "./videos";

// ============================================================================
// PLANIFICADOR DINÁMICO — el calendario NUNCA depende de fechas escritas.
//
// Se genera SIEMPRE desde la fecha actual + el estado real de cada video
// (pendiente/grabado/editado/publicado). Si te atrasas, te adelantas o grabas
// cinco videos en un día, el plan de mañana se reorganiza solo: no hay nada
// que "recalibrar". El botón Replanificar solo limpia los movimientos
// manuales (drag & drop) para volver al plan óptimo.
//
// Reglas estratégicas:
// - Orden de publicación de la campaña (no se rompe al replanificar).
// - Un video nuevo por día de publicación: TikTok primero (7-9 pm) y
//   Reels+FB al día siguiente (11 am-1 pm) — cada pieza vive 2 días.
// - Sesiones de grabación en lotes de hasta 4 (la 1ª: HOY si hay pendientes;
//   las siguientes: cada domingo). Edición: el día siguiente a grabar.
// - Domingo: revisar métricas. Jueves: post de texto en FB + grupos.
// - Videos que requieren material real NO se auto-programan (esperan).
// - Carga de trabajo estimada por día (minutos) para detectar días saturados.
// ============================================================================

/** Orden estratégico de publicación (el #4 va temprano: se fija en perfiles). */
export const PUBLICATION_SEQUENCE = [1, 4, 2, 5, 3, 7, 6, 13, 12, 10, 14, 34, 24, 9, 20, 15, 35, 17, 19, 36];

/** Piezas con fecha absoluta (campaña F1-F5 programada en Meta). Las pasadas se omiten. */
export const FIXED_TASKS: CalendarTask[] = [
  { id: "f4", date: "2026-07-13", kind: "campaña", label: "F4 “15 Usuarios Fundadores” (FB+IG 11 am) — FIJAR el post", detail: "Ya programada en Meta. Tu trabajo: responder comentarios <1 h." },
  { id: "f5", date: "2026-07-16", kind: "campaña", label: "F5 “Primero 15” (FB+IG 11 am)", detail: "Si ya hay inscritos: rellenar casillas del SVG y re-renderizar." },
];

export type ScheduledTask = CalendarTask & { loadMin: number };

export type Schedule = {
  tasks: ScheduledTask[];
  /** Carga estimada por día (minutos). */
  loadByDate: Map<string, number>;
  horizonEnd: string;
};

const DOW = (date: string) => new Date(date + "T12:00:00Z").getUTCDay(); // 0=dom
const addDays = (date: string, n: number) => {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function nextDow(from: string, dow: number, allowSame = true): string {
  let d = allowSame ? from : addDays(from, 1);
  while (DOW(d) !== dow) d = addDays(d, 1);
  return d;
}

export function buildSchedule(
  today: string,
  statusOf: (videoId: number) => VideoStatus,
  horizonDays = 28,
): Schedule {
  const horizonEnd = addDays(today, horizonDays);
  const tasks: ScheduledTask[] = [];
  const byId = new Map(VIDEOS.map((v) => [v.id, v]));

  // Cola estratégica: solo lo no publicado y sin dependencia de material real.
  const queue = PUBLICATION_SEQUENCE
    .map((id) => byId.get(id)!)
    .filter((v) => v && statusOf(v.id) !== "publicado" && !v.requiresReal)
    .slice(0, 8);

  // --- 1) Sesiones de grabación (lotes de hasta 4 pendientes de la cola) ---
  const pending = queue.filter((v) => statusOf(v.id) === "pendiente");
  const batches: (typeof pending)[] = [];
  for (let i = 0; i < pending.length; i += 4) batches.push(pending.slice(i, i + 4));

  const readyAfterEdit = new Map<number, string>(); // videoId → fecha en que queda editado
  let sessionDay = today; // la primera sesión es HOY: lo atrasado se recupera ya
  batches.forEach((batch, i) => {
    if (i > 0) sessionDay = nextDow(addDays(sessionDay, 1), 0); // siguientes: domingo
    const editDay = addDays(sessionDay, 1);
    const mins = batch.reduce((a, v) => a + v.effortMin, 0) + 15;
    tasks.push({
      id: `rec-s${i + 1}`,
      date: sessionDay,
      kind: "grabar",
      label: `SESIÓN ${i + 1}: grabar ${batch.map((v) => `#${v.id}`).join(" → ")} (~${mins} min)`,
      detail: "Orden dentro de la sesión: del más fácil al más importante. Checklist “Antes de grabar” primero.",
      loadMin: mins,
    });
    tasks.push({
      id: `edit-s${i + 1}`,
      date: editDay,
      kind: "editar",
      label: `Editar los ${batch.length} videos de la sesión ${i + 1} (receta del Manual)`,
      loadMin: batch.length * 25,
    });
    for (const v of batch) readyAfterEdit.set(v.id, editDay);
  });

  // Videos ya grabados pero sin editar: sesión de edición hoy/mañana.
  const toEdit = queue.filter((v) => statusOf(v.id) === "grabado");
  if (toEdit.length > 0) {
    const day = batches.length > 0 ? addDays(today, 1) : today;
    tasks.push({
      id: "edit-pend",
      date: day,
      kind: "editar",
      label: `Editar lo ya grabado: ${toEdit.map((v) => `#${v.id}`).join(", ")}`,
      loadMin: toEdit.length * 25,
    });
    for (const v of toEdit) readyAfterEdit.set(v.id, day);
  }

  // --- 2) Publicaciones: un video nuevo por slot (mar/jue/sáb), en orden ---
  const isPubDay = (d: string) => [2, 4, 6].includes(DOW(d));
  let slot = today;
  const nextSlot = (from: string): string => {
    let d = from;
    while (!isPubDay(d)) d = addDays(d, 1);
    return d;
  };

  for (const v of queue) {
    const st = statusOf(v.id);
    const available = st === "editado" ? today : readyAfterEdit.get(v.id);
    if (!available) continue; // (grabado sin slot de edición no debería pasar)
    slot = nextSlot(slot < available ? available : slot);
    if (slot > horizonEnd) break;
    const ttDay = slot;
    const rfDay = addDays(slot, 1);
    tasks.push({
      id: `pub-${v.id}-tt`,
      date: ttDay,
      kind: "publicar",
      label: `Publicar #${v.id} “${v.title}” en TikTok (7-9 pm)${v.id === 4 ? " — y FIJARLO en los 3 perfiles" : ""}`,
      videoId: v.id,
      platform: "tiktok",
      time: "19:00-21:00",
      loadMin: 15,
    });
    tasks.push({
      id: `pub-${v.id}-rf`,
      date: rfDay,
      kind: "publicar",
      label: `Publicar #${v.id} en Reels + FB (11 am-1 pm)`,
      videoId: v.id,
      platform: "reels",
      time: "11:00-13:00",
      loadMin: 10,
    });
    slot = addDays(ttDay, 1); // el siguiente video nuevo, otro día
  }

  // --- 3) Ritmo semanal: métricas (dom) y comunidad (jue) ---
  for (let d = nextDow(today, 0); d <= horizonEnd; d = addDays(d, 7)) {
    tasks.push({
      id: `rev-${d}`,
      date: d,
      kind: "revisar",
      label: "Revisar métricas: el mejor formato se duplica, el peor se elimina",
      detail: "Retención 3 s y registros ?ref=fundadores mandan. Anótalas en la Analítica.",
      loadMin: 15,
    });
  }
  for (let d = nextDow(today, 4); d <= horizonEnd; d = addDays(d, 7)) {
    tasks.push({
      id: `com-${d}`,
      date: d,
      kind: "comunidad",
      label: "Post de texto en tu perfil FB + compartir en 3 grupos (8-10 pm)",
      detail: "En grupos: texto sin QR y link en comentario si lo prohíben.",
      loadMin: 20,
    });
  }

  // --- 4) Piezas fijas de campaña aún vigentes ---
  for (const f of FIXED_TASKS) {
    if (f.date >= today) tasks.push({ ...f, loadMin: 10 });
  }

  tasks.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const loadByDate = new Map<string, number>();
  for (const t of tasks) loadByDate.set(t.date, (loadByDate.get(t.date) ?? 0) + t.loadMin);

  return { tasks, loadByDate, horizonEnd };
}

/**
 * Aplica los movimientos manuales (drag & drop) sobre el plan generado.
 * Un movimiento a una fecha pasada se ignora (el plan nunca vive en el ayer).
 */
export function applyMoves(schedule: Schedule, moves: Map<string, string>, today: string): Schedule {
  const tasks = schedule.tasks.map((t) => {
    const moved = moves.get(t.id);
    return moved && moved >= today ? { ...t, date: moved } : t;
  });
  tasks.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const loadByDate = new Map<string, number>();
  for (const t of tasks) loadByDate.set(t.date, (loadByDate.get(t.date) ?? 0) + t.loadMin);
  return { ...schedule, tasks, loadByDate };
}
