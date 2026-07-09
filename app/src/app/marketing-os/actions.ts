"use server";

import { createClient } from "@/lib/supabase/server";
import { safeError } from "@/lib/errors";
import { STATUS_ORDER, type Pillar, type VideoMetrics, type VideoStatus } from "@/lib/marketing/types";

// Actions v2 del Marketing OS: NO redirigen ni revalidan — retornan {ok} de
// inmediato para que el cliente haga optimistic UI (la interfaz cambia al
// instante y aquí solo se confirma/persiste). RLS (solo platform admin)
// protege cada escritura.

export type ActionResult = { ok: true } | { ok: false; error: string };

async function upsert(key: string, value: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_state")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: safeError(error) } : { ok: true };
}

async function removeKey(key: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("marketing_state").delete().eq("key", key);
  return error ? { ok: false, error: safeError(error) } : { ok: true };
}

/** Marca/desmarca un check persistente (cal:, chk:, res:). */
export async function toggleKey(key: string, done: boolean): Promise<ActionResult> {
  if (!/^(cal|chk|res):/.test(key)) return { ok: false, error: "Clave inválida." };
  return done ? upsert(key, { done: true }) : removeKey(key);
}

/** Fija el estado de un video. */
export async function setStatus(videoId: number, status: VideoStatus): Promise<ActionResult> {
  if (!Number.isInteger(videoId) || !STATUS_ORDER.includes(status)) {
    return { ok: false, error: "Estado inválido." };
  }
  return status === "pendiente" ? removeKey(`video:${videoId}`) : upsert(`video:${videoId}`, { status });
}

/** Reprograma una tarea del calendario (drag & drop). null = volver a su fecha original. */
export async function moveTask(taskId: string, date: string | null): Promise<ActionResult> {
  if (!taskId || (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
    return { ok: false, error: "Fecha inválida." };
  }
  return date === null ? removeKey(`calmove:${taskId}`) : upsert(`calmove:${taskId}`, { date });
}

/** Reinicia un checklist completo dentro de un scope. */
export async function resetChecklist(scope: string, listId: string): Promise<ActionResult> {
  if (!listId || !/^[\w:-]+$/.test(scope + listId)) return { ok: false, error: "Checklist inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_state")
    .delete()
    .like("key", `chk:${scope}:${listId}:%`);
  return error ? { ok: false, error: safeError(error) } : { ok: true };
}

/** Guarda métricas manuales de un video. */
export async function saveMetrics(videoId: number, metrics: VideoMetrics): Promise<ActionResult> {
  if (!Number.isInteger(videoId)) return { ok: false, error: "Video inválido." };
  const clean: Record<string, unknown> = {};
  for (const k of ["views", "ret3s", "completion", "comments", "shares", "saves", "clicks"] as const) {
    const v = metrics[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) clean[k] = v;
  }
  if (metrics.notes) clean.notes = String(metrics.notes).slice(0, 500);
  return upsert(`metrics:${videoId}`, clean);
}

/** Actualiza la meta de fundadores. */
export async function saveGoal(goal: { current: number; waitlist: number; registros: number }): Promise<ActionResult> {
  const n = (x: number) => Math.max(0, Math.floor(Number(x) || 0));
  return upsert("goal:funders", { current: n(goal.current), waitlist: n(goal.waitlist), registros: n(goal.registros) });
}

/** Añade una idea propia. Devuelve la clave creada para pintarla al instante. */
export async function addIdea(idea: { title: string; pillar: Pillar; hook?: string; notes?: string }): Promise<ActionResult & { key?: string }> {
  const title = (idea.title ?? "").trim().slice(0, 140);
  if (!title) return { ok: false, error: "La idea necesita un título." };
  if (!["P1", "P2", "P3", "P4", "P5"].includes(idea.pillar)) return { ok: false, error: "Pilar inválido." };
  const key = `idea:${Date.now()}`;
  const res = await upsert(key, {
    title,
    pillar: idea.pillar,
    hook: idea.hook?.trim().slice(0, 200) || undefined,
    notes: idea.notes?.trim().slice(0, 500) || undefined,
    createdAt: new Date().toISOString(),
  });
  return res.ok ? { ok: true, key } : res;
}

/** Elimina una idea propia. */
export async function deleteIdea(key: string): Promise<ActionResult> {
  if (!key.startsWith("idea:")) return { ok: false, error: "Clave inválida." };
  return removeKey(key);
}
