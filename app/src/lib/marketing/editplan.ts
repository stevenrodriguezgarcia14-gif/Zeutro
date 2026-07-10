import type { MediaAsset, MediaUse, Script } from "./types";
import { scriptTimeline } from "./timing";

// ============================================================================
// PLAN DE EDICIÓN PASO A PASO — se GENERA del guion (no se escribe a mano).
//
// Convierte cada guion en un tutorial de línea de tiempo para CapCut Desktop:
// qué importar, en qué orden montar, qué pausas conservar (y por qué), qué
// clip entra en qué frase, subtítulos, música con sus subidas/bajadas, SFX,
// cortinilla y exportación. Cada paso lleva su PORQUÉ: se aprende editando.
// ============================================================================

export type EditStep = {
  title: string;
  /** Qué hacer, exactamente. */
  action: string;
  /** La razón de la decisión (educativa). */
  why?: string;
  /** Receta tap-por-tap vinculada (ancla en la lista de recetas). */
  recipeId?: string;
  /** Sub-lista opcional (archivos, pausas, textos...). */
  items?: string[];
};

const lastWords = (s: string, n = 5) => {
  const clean = s.replace(/\([^)]*\)/g, "").trim().replace(/[.…]$/, "");
  const w = clean.split(/\s+/);
  return w.slice(Math.max(0, w.length - n)).join(" ");
};

function whyForEdit(edit: string): string | undefined {
  const e = edit.toLowerCase();
  if (e.includes("zoom")) return "El zoom dirige la mirada a la palabra clave en el instante exacto: es un dedo señalando sin manos.";
  if (e.includes("música a cero") || e.includes("se corta") || e.includes("sin música")) return "Quitar la música hace retumbar la frase: el silencio es el subrayado más fuerte que existe.";
  if (e.includes("chip")) return "Los chips acumulados hacen VISIBLE el peso del argumento: quien mira sin sonido también lo siente crecer.";
  if (e.includes("cha-ching") || e.includes("cash")) return "El sonido anclado al frame exacto convierte un banner en una emoción: oído + vista a la vez.";
  if (e.includes("whoosh")) return "Un solo sonido de transición (cara→pantalla) le dice al cerebro “cambiamos de escenario” sin gastar tiempo.";
  if (e.includes("pantalla") || e.includes("inserto") || e.includes("captura")) return "La prueba visual entra mientras la voz explica: ver + oír lo mismo duplica la retención del mensaje.";
  if (e.includes("texto")) return "El 85% mira sin sonido: el texto grande es el titular que sostiene la historia en mute.";
  if (e.includes("silencio")) return "Ese silencio está contado en el tiempo del guion: es tensión, no un error.";
  return undefined;
}

export function buildEditPlan(script: Script, assets: { asset: MediaAsset; use: MediaUse }[]): EditStep[] {
  const tl = scriptTimeline(script);
  const steps: EditStep[] = [];
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

  // Bloques hablados (los que grabas tú) vs pantalla
  const camBlocks = script.segments.map((s, i) => ({ s, i })).filter(({ s }) => /tú|tu cara/i.test(s.visual));
  const readyAssets = assets.filter((a) => a.asset.status === "listo" && a.use.videoId !== 0);
  const pendingAssets = assets.filter((a) => a.asset.status === "pendiente" && a.use.videoId !== 0);
  const cortinilla = assets.find((a) => a.asset.id === "cortinilla");

  // 1 · Proyecto
  steps.push({
    title: "Crea el proyecto en 9:16",
    action: "CapCut Desktop → “Crear proyecto” → fija la proporción 9:16 ANTES de montar nada (panel derecho → Proporción).",
    why: "Si montas en horizontal y cambias después, todos los textos y zooms se desalinean.",
    recipeId: "proyecto",
  });

  // 2 · Importar
  const importItems = [
    `Tus ${camBlocks.length || script.segments.length} bloques grabados (en el orden del guion)`,
    ...readyAssets.map(({ asset }) => `${asset.file} — Biblioteca/${asset.path.replace(/^Biblioteca\//, "")}`.replace("Biblioteca/clips-app", "clips-app")),
    ...(cortinilla?.asset.file ? [`${cortinilla.asset.file} — la firma de cierre (ya generada)`] : []),
  ];
  steps.push({
    title: "Importa TODO de una sola vez",
    action: "Pestaña Multimedia → Importar → OneDrive → Marketing-Assets-Zentro → Biblioteca. Selecciona con Ctrl+click:",
    items: importItems,
    why: "Tener todo en el panel antes de empezar evita salir del flujo a mitad de edición (el cambio de contexto es donde se pierde el tiempo).",
    recipeId: "proyecto",
  });
  if (pendingAssets.length > 0) {
    steps.push({
      title: "⚠️ Antes de seguir: falta material",
      action: "Este guion usa recursos que aún no existen — consíguelos primero (la tarjeta ámbar de arriba dice cómo):",
      items: pendingAssets.map(({ asset, use }) => `${asset.name} — entra en: ${use.cue}`),
    });
  }

  // 3 · Pista principal
  steps.push({
    title: "Monta la pista principal",
    action: `Arrastra tus bloques grabados a la línea de tiempo en el orden del guion (bloque 1 → ${script.segments.length}). Los clips de pantalla y la cortinilla todavía NO.`,
    why: "Primero la columna vertebral (tu voz), luego los adornos: si insertas pantallas antes de limpiar, cada corte las desalinea.",
    recipeId: "pista-principal",
  });

  // 4 · Limpieza con pausas protegidas
  const pauses = script.segments
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.pauseAfterSec)
    .map(({ s }) => `CONSERVA ${fmt(s.pauseAfterSec!)} s de silencio tras «${lastWords(s.say)}»`);
  steps.push({
    title: "Limpia errores — protege las pausas del guion",
    action: "Ctrl+B divide en el cabezal, Supr borra el pedazo. Elimina SOLO errores, muletillas y aire no planeado." + (pauses.length ? " Estas pausas NO se tocan:" : ""),
    items: pauses.length ? pauses : undefined,
    why: pauses.length
      ? "Esos silencios están contados en el tiempo real del video: son los que crean tensión antes de la frase clave. Recortarlos “para que quede ágil” mata el énfasis."
      : "El ritmo viene de saltar de frase a frase sin aire muerto.",
    recipeId: "cortes",
  });

  // 5 · Recursos en su frase exacta
  if (readyAssets.length > 0) {
    steps.push({
      title: "Inserta los clips de la Biblioteca en su frase",
      action: "Cada recurso va en una pista ENCIMA de la principal, alineado con la frase que lo llama (ya vienen en 1080×1920: no hay que ajustar nada):",
      items: readyAssets.map(
        ({ asset, use }) =>
          `${asset.file} → cuando dices ${use.cue}${use.holdSec ? ` · en pantalla ~${use.holdSec} s` : ""}${asset.durationSec && use.holdSec && asset.durationSec > use.holdSec + 2 ? ` (el archivo dura ${asset.durationSec} s: recorta el tramo bueno con Ctrl+B)` : ""}`,
      ),
      why: "La prueba visual debe aparecer EXACTAMENTE cuando la voz la menciona: un desfase de 1 s rompe la ilusión de que “la app hace lo que dices”.",
      recipeId: "inserto",
    });
  }

  // 6 · Direcciones de edición bloque a bloque
  const blockSteps = script.segments
    .map((seg, i) => ({ seg, i }))
    .filter(({ seg }) => seg.edit);
  if (blockSteps.length > 0) {
    steps.push({
      title: "Aplica la edición bloque a bloque (en orden)",
      action: "Con la pista limpia, recorre el video bloque por bloque y aplica lo que pide cada uno:",
      items: blockSteps.map(({ seg, i }) => {
        const why = whyForEdit(seg.edit!);
        return `Bloque ${i + 1} (seg ${fmt(tl[i].from)}–${fmt(tl[i].to)}): ${seg.edit}${why ? ` — Por qué: ${why}` : ""}`;
      }),
      recipeId: "zoom",
    });
  }

  // 7 · Subtítulos
  const subLayer = script.screenTexts.find((t) => t.layer === "subtitulos");
  steps.push({
    title: "Genera y corrige los subtítulos",
    action: `Texto → Subtítulos automáticos → Español → Generar. Corrige TODOS (escribirá “centro” en vez de “Zentro”). Estilo de marca: negrita, blanco, contorno negro, centro-bajo.${subLayer ? ` ${subLayer.style}.` : ""}`,
    why: "El 85% del video se ve sin sonido: los subtítulos no son un extra, son la mitad del video. Las palabras en verde son el subrayado de marca (máx 1-3 por pantalla).",
    recipeId: "subtitulos",
  });

  // 8 · Textos grandes
  const titles = script.screenTexts.filter((t) => t.layer !== "subtitulos");
  if (titles.length > 0) {
    steps.push({
      title: "Coloca los textos grandes (titulares y chips)",
      action: "Texto → Texto predeterminado → una pista encima de todo. Cada uno en su rango:",
      items: titles.map((t) => {
        const from = tl[t.fromSeg]?.from ?? 0;
        const to = t.toSeg === "fin" ? "fin" : (tl[t.toSeg]?.to ?? 0);
        return `“${t.text}” · seg ${fmt(from)} → ${to === "fin" ? "fin" : fmt(to as number)} · ${t.place} · ${t.style}`;
      }),
      why: "El titular resume la idea para quien mira en mute; el subtítulo transcribe. Conviven porque hacen trabajos distintos.",
      recipeId: "texto-grande",
    });
  }

  // 9 · Música y SFX (de las notas del guion)
  const isMusic = (s: string) => /úsica|piano|lofi|volumen/i.test(s);
  const isSfx = (s: string) => /sfx|pop\b|whoosh|cha-ching|cash|teclas|notificaci|tick-tock|chasquido|sonido/i.test(s);
  const musicNotes = script.editSteps.filter((s) => isMusic(s) && !isSfx(s));
  const sfxNotes = script.editSteps.filter((s) => isSfx(s));
  const otherNotes = script.editSteps.filter((s) => !isMusic(s) && !isSfx(s));
  if (musicNotes.length > 0) {
    steps.push({
      title: "Música (con sus subidas y bajadas)",
      action: "Audio → Música → busca el término del guion y ponla DEBAJO de tu voz (≈ −25 dB). Este video pide:",
      items: musicNotes,
      why: "La música al volumen correcto se SIENTE pero no se ESCUCHA; y sus silencios programados son parte del guion, no un descuido.",
      recipeId: "musica",
    });
  }
  if (sfxNotes.length > 0) {
    steps.push({
      title: "Efectos de sonido",
      action: "Audio → Efectos de sonido. Alinea cada uno AL FRAME con su evento visual:",
      items: sfxNotes,
      why: "Un pop cuando aparece un texto le dice al cerebro “esto es nuevo, míralo”. Más de 5 por video y se vuelve ruido.",
      recipeId: "sfx",
    });
  }
  if (otherNotes.length > 0) {
    steps.push({
      title: "Ajustes finos de ESTE video",
      action: "Las decisiones particulares de este guion, en orden:",
      items: otherNotes,
    });
  }

  // 10 · Cortinilla
  steps.push({
    title: "Cierra con la cortinilla oficial",
    action: "Arrastra cortinilla_9x16.mp4 al FINAL de la pista principal (trae sus propios fundidos; sin transición extra). Desvanece la música sobre ella.",
    why: "El mismo cierre en TODOS los videos construye reconocimiento: a la tercera vez, el espectador sabe que es Zentro antes de leer el handle.",
    recipeId: "cortinilla",
  });

  // 11 · Exportar
  steps.push({
    title: "Exporta y haz la prueba del silencio",
    action: "Exportar (arriba-derecha) → 1080p · 30 fps · MP4/H.264 · tasa recomendada. Antes: borra el clip “CapCut” del final si aparece. Después: mira el video completo EN MUTE.",
    why: "Si la historia se entiende sin sonido, está lista para el 85% que la verá así. Si no, faltan textos: vuelve al paso de titulares.",
    recipeId: "exportar",
  });

  return steps;
}
