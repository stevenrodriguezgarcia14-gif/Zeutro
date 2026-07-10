// Tipos del Marketing OS (/admin/marketing).
// El contenido estático vive en videos.ts y plan.ts; el estado mutable
// (estados de video, checks, métricas, ideas propias) vive en la tabla
// marketing_state (migración 0039) como pares clave→JSON.

export type Pillar = "P1" | "P2" | "P3" | "P4" | "P5";

export type VideoStatus = "pendiente" | "grabado" | "editado" | "publicado";

export type Funnel = "frio" | "tibio" | "conversion";

export type Platform = "tiktok" | "reels" | "facebook";

/** 1=baja · 2=media · 3=alta · 4=muy alta */
export type Score = 1 | 2 | 3 | 4;

export type VideoScores = {
  viral: Score;
  facilidad: Score;
  confianza: Score;
  fundadores: Score;
  explica: Score;
};

export type Video = {
  id: number;
  title: string;
  pillar: Pillar;
  objective: string;
  problem?: string;
  hook: string;
  cta: string;
  /** Duración final del video en segundos. */
  durationSec: number;
  /** Tiempo estimado de grabación en minutos. */
  effortMin: number;
  emotions: string[];
  audience?: string;
  funnel: Funnel;
  platforms: Platform[];
  scores: VideoScores;
  /** Mini-guion (briefs) o resumen de la idea. */
  summary: string;
  /** true si existe guion segundo-a-segundo en scripts.ts */
  detailed?: boolean;
  /** Necesita material real (usuario/feedback/hito) — no inventar. */
  requiresReal?: string;
  /** Nota de cuándo conviene publicarlo. */
  timing?: string;
};

export type ScriptSegment = {
  /** Qué se ve en pantalla (tú / pantalla / inserto). */
  visual: string;
  /** Qué decir, palabra por palabra. */
  say: string;
  tone?: string;
  gesture?: string;
  gaze?: string;
  /** Cuerpo y postura en este bloque. */
  body?: string;
  /** Plano / posición / movimiento de cámara en este bloque. */
  camera?: string;
  /** Nivel de energía y velocidad al hablar. */
  energy?: string;
  /** Indicaciones de edición propias del segmento. */
  edit?: string;
  /**
   * Tiempo visual SIN hablar dentro del bloque (navegación de pantalla,
   * mostrar algo, acción), en segundos. Se suma al tiempo de habla.
   */
  actionSec?: number;
  /** Silencio dramático al FINAL del bloque, en segundos. */
  pauseAfterSec?: number;
};

/**
 * Texto en pantalla anclado a BLOQUES del guion (no a segundos escritos a
 * mano): los segundos reales se calculan con el motor de tiempos.
 */
export type ScreenText = {
  layer: "titulo" | "chip" | "subtitulos";
  text: string;
  /** Índice del bloque (0 = primero) donde aparece. */
  fromSeg: number;
  /** Índice del bloque donde desaparece (inclusive), o "fin". */
  toSeg: number | "fin";
  place: string;
  style: string;
};

export type Script = {
  videoId: number;
  badge?: string;
  general: {
    problem: string;
    audience: string;
    note?: string;
  };
  prep: {
    ropa: string;
    fondo: string;
    camara: string;
    plano: string;
    recursos: string[];
  };
  segments: ScriptSegment[];
  editSteps: string[];
  screenTexts: ScreenText[];
  rhythm: string[];
  mistakes: string[];
};

export type CalendarTask = {
  /** id estable para persistir el check: cal:<date>:<id> */
  id: string;
  date: string; // YYYY-MM-DD
  kind: "grabar" | "editar" | "publicar" | "revisar" | "campaña" | "comunidad";
  label: string;
  detail?: string;
  videoId?: number;
  platform?: Platform;
  time?: string;
};

export type ChecklistDef = {
  id: string;
  title: string;
  moment: string;
  items: string[];
};

export type ResourceItem = {
  id: string;
  group: string;
  label: string;
  detail?: string;
  path?: string;
};

export type GlossaryEntry = {
  term: string;
  meaning: string;
  how: string;
};

export type ManualSection = {
  id: string;
  title: string;
  intro?: string;
  steps: string[];
};

/** Métricas manuales por video (se llenan desde la app de cada red). */
export type VideoMetrics = {
  views?: number;
  ret3s?: number; // % retención a 3 segundos
  completion?: number; // % que termina el video
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  notes?: string;
};

export type CustomIdea = {
  title: string;
  pillar: Pillar;
  hook?: string;
  notes?: string;
  createdAt: string;
};

export const STATUS_ORDER: VideoStatus[] = ["pendiente", "grabado", "editado", "publicado"];

export const PILLAR_INFO: Record<Pillar, { name: string; mix: string; role: string }> = {
  P1: { name: "Dolor / espejo", mix: "30%", role: "Detener el scroll de desconocidos — convierte frío" },
  P2: { name: "Construyendo Zentro", mix: "25%", role: "Confianza y comunidad — la serie que se sigue" },
  P3: { name: "Demo / momento dinero", mix: "20%", role: "Tangibilizar el SaaS — “quiero eso”" },
  P4: { name: "Historia personal", mix: "15%", role: "Conexión emocional — por qué existes tú y Zentro" },
  P5: { name: "Comunidad / feedback", mix: "10%", role: "Prueba social viva — “este fundador escucha”" },
};
