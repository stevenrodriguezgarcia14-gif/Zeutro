"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeError } from "@/lib/errors";
import { STATUS_ORDER, type VideoStatus } from "@/lib/marketing/types";

const BASE = "/admin/marketing";

async function upsert(key: string, value: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_state")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  return error;
}

async function remove(key: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("marketing_state").delete().eq("key", key);
  return error;
}

function backTo(formData: FormData): string {
  const to = String(formData.get("back") ?? "");
  // Solo rutas internas del OS (evita open redirect).
  return to.startsWith(BASE) ? to : BASE;
}

function fail(formData: FormData, error: unknown): never {
  redirect(`${backTo(formData)}?error=${encodeURIComponent(safeError(error))}`);
}

function done(formData: FormData): never {
  revalidatePath(BASE, "layout");
  redirect(backTo(formData));
}

/** Fija el estado de un video (pendiente → grabado → editado → publicado). */
export async function setVideoStatus(formData: FormData) {
  const id = Number(formData.get("video_id"));
  const status = String(formData.get("status")) as VideoStatus;
  if (!id || !STATUS_ORDER.includes(status)) fail(formData, "Estado inválido.");
  const error =
    status === "pendiente" ? await remove(`video:${id}`) : await upsert(`video:${id}`, { status });
  if (error) fail(formData, error);
  done(formData);
}

/** Marca/desmarca un check (calendario, checklist o recurso). */
export async function toggleCheck(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  const checked = String(formData.get("checked") ?? "") === "1";
  const ok = key.startsWith("cal:") || key.startsWith("chk:") || key.startsWith("res:");
  if (!ok) fail(formData, "Clave inválida.");
  const error = checked ? await remove(key) : await upsert(key, { done: true });
  if (error) fail(formData, error);
  done(formData);
}

/** Reinicia un checklist completo dentro de un scope (p. ej. general o video:1). */
export async function resetChecklist(formData: FormData) {
  const scope = String(formData.get("scope") ?? "general");
  const listId = String(formData.get("list_id") ?? "");
  if (!listId) fail(formData, "Checklist inválido.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketing_state")
    .delete()
    .like("key", `chk:${scope}:${listId}:%`);
  if (error) fail(formData, error);
  done(formData);
}

/** Guarda métricas manuales de un video. */
export async function saveMetrics(formData: FormData) {
  const id = Number(formData.get("video_id"));
  if (!id) fail(formData, "Video inválido.");
  const num = (name: string) => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return undefined;
    const n = Number(raw.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const value = {
    views: num("views"),
    ret3s: num("ret3s"),
    completion: num("completion"),
    comments: num("comments"),
    shares: num("shares"),
    saves: num("saves"),
    clicks: num("clicks"),
    notes: String(formData.get("notes") ?? "").slice(0, 500) || undefined,
  };
  const error = await upsert(`metrics:${id}`, value);
  if (error) fail(formData, error);
  done(formData);
}

/** Actualiza la meta de fundadores (conseguidos, lista de espera, registros ref). */
export async function saveGoal(formData: FormData) {
  const n = (name: string) => Math.max(0, Math.floor(Number(formData.get(name) ?? 0) || 0));
  const error = await upsert("goal:funders", {
    current: n("current"),
    waitlist: n("waitlist"),
    registros: n("registros"),
  });
  if (error) fail(formData, error);
  done(formData);
}

/** Añade una idea propia al banco. */
export async function addIdea(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const pillar = String(formData.get("pillar") ?? "P1");
  const hook = String(formData.get("hook") ?? "").trim().slice(0, 200);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500);
  if (!title) fail(formData, "La idea necesita un título.");
  if (!["P1", "P2", "P3", "P4", "P5"].includes(pillar)) fail(formData, "Pilar inválido.");
  const error = await upsert(`idea:${Date.now()}`, {
    title,
    pillar,
    hook: hook || undefined,
    notes: notes || undefined,
    createdAt: new Date().toISOString(),
  });
  if (error) fail(formData, error);
  done(formData);
}

/** Elimina una idea propia. */
export async function deleteIdea(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  if (!key.startsWith("idea:")) fail(formData, "Clave inválida.");
  const error = await remove(key);
  if (error) fail(formData, error);
  done(formData);
}
