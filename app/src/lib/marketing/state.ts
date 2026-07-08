import { createClient } from "@/lib/supabase/server";
import type { CustomIdea, VideoMetrics, VideoStatus } from "./types";

// Lectura del estado mutable del Marketing OS (tabla marketing_state).
// Si la migración 0039 no está aplicada, todo degrada a estado vacío
// y las páginas muestran un aviso (nunca se rompen).

export type MarketingState = {
  /** true si la tabla no existe todavía (migración pendiente). */
  unavailable: boolean;
  videoStatus: Map<number, VideoStatus>;
  /** claves completas con done=true (cal:..., chk:..., res:...) */
  checks: Set<string>;
  metrics: Map<number, VideoMetrics>;
  goal: { current: number; waitlist: number; registros: number };
  ideas: { key: string; idea: CustomIdea }[];
};

export async function loadMarketingState(): Promise<MarketingState> {
  const empty: MarketingState = {
    unavailable: false,
    videoStatus: new Map(),
    checks: new Set(),
    metrics: new Map(),
    goal: { current: 0, waitlist: 0, registros: 0 },
    ideas: [],
  };

  const supabase = await createClient();
  const { data, error } = await supabase.from("marketing_state").select("key, value");
  if (error) return { ...empty, unavailable: true };

  for (const row of data ?? []) {
    const key = row.key as string;
    const value = (row.value ?? {}) as Record<string, unknown>;
    if (key.startsWith("video:")) {
      const id = Number(key.slice(6));
      const status = value.status as VideoStatus | undefined;
      if (id && status) empty.videoStatus.set(id, status);
    } else if (key.startsWith("cal:") || key.startsWith("chk:") || key.startsWith("res:")) {
      if (value.done) empty.checks.add(key);
    } else if (key.startsWith("metrics:")) {
      const id = Number(key.slice(8));
      if (id) empty.metrics.set(id, value as VideoMetrics);
    } else if (key === "goal:funders") {
      empty.goal = {
        current: Number(value.current ?? 0),
        waitlist: Number(value.waitlist ?? 0),
        registros: Number(value.registros ?? 0),
      };
    } else if (key.startsWith("idea:")) {
      empty.ideas.push({ key, idea: value as unknown as CustomIdea });
    }
  }
  empty.ideas.sort((a, b) => (a.key < b.key ? 1 : -1));
  return empty;
}

export function statusOf(state: MarketingState, videoId: number): VideoStatus {
  return state.videoStatus.get(videoId) ?? "pendiente";
}
