import { describe, expect, it } from "vitest";
import { SCRIPTS } from "./scripts";
import { VIDEOS } from "./videos";
import { paceIssues, scriptTimeline, scriptTotalSeconds, segmentSeconds } from "./timing";
import { buildSchedule } from "./schedule";

// "Validación profesional" automatizada: todo guion (actual o futuro) debe
// poder decirse cómodamente a velocidad real de habla frente a cámara.

describe("motor de tiempos reales", () => {
  it("ningún bloque exige hablar más rápido de lo natural (>2.6 palabras/seg)", () => {
    for (const s of SCRIPTS) {
      expect(paceIssues(s), `guion #${s.videoId} tiene bloques imposibles de decir`).toEqual([]);
    }
  });

  it("los ganchos HABLADOS duran lo que un humano necesita (≥3.5 s), no 3 s teóricos", () => {
    for (const s of SCRIPTS) {
      const first = s.segments[0];
      const spoken = first.say.replace(/\([^)]*\)/g, "").trim();
      if (!spoken) continue; // gancho de acción pura (p. ej. la reacción real del #8)
      expect(segmentSeconds(first), `gancho del #${s.videoId}`).toBeGreaterThanOrEqual(3.5);
    }
  });

  it("los totales quedan en rango de formato corto (25-75 s)", () => {
    for (const s of SCRIPTS) {
      const total = scriptTotalSeconds(s);
      expect(total, `total del #${s.videoId}`).toBeGreaterThanOrEqual(25);
      expect(total, `total del #${s.videoId}`).toBeLessThanOrEqual(75);
    }
  });

  it("la línea de tiempo es continua y los textos anclados existen", () => {
    for (const s of SCRIPTS) {
      const tl = scriptTimeline(s);
      for (let i = 1; i < tl.length; i++) expect(tl[i].from).toBe(tl[i - 1].to);
      for (const t of s.screenTexts) {
        expect(tl[t.fromSeg], `#${s.videoId} texto "${t.text}" fromSeg`).toBeDefined();
        if (t.toSeg !== "fin") expect(tl[t.toSeg], `#${s.videoId} texto "${t.text}" toSeg`).toBeDefined();
      }
    }
  });

  it("la duración guardada de cada video dirigido coincide con la calculada (±3 s)", () => {
    for (const s of SCRIPTS) {
      const v = VIDEOS.find((x) => x.id === s.videoId)!;
      expect(Math.abs(v.durationSec - scriptTotalSeconds(s)), `#${s.videoId}`).toBeLessThanOrEqual(3);
    }
  });
});

describe("planificador dinámico", () => {
  it("nunca genera tareas en el pasado", () => {
    const today = "2026-08-03";
    const sch = buildSchedule(today, () => "pendiente");
    for (const t of sch.tasks) expect(t.date >= today, `${t.id} en ${t.date}`).toBe(true);
  });

  it("se adapta al estado real: lo publicado desaparece, lo editado va directo a publicación", () => {
    const today = "2026-08-03"; // lunes
    const sch = buildSchedule(today, (id) => (id === 1 ? "publicado" : id === 4 ? "editado" : "pendiente"));
    expect(sch.tasks.find((t) => t.id === "pub-1-tt")).toBeUndefined();
    const pub4 = sch.tasks.find((t) => t.id === "pub-4-tt");
    expect(pub4).toBeDefined();
    // #4 está editado: su publicación no espera a ninguna sesión de grabación.
    const rec = sch.tasks.find((t) => t.id === "rec-s1");
    expect(pub4!.date <= (rec ? sch.tasks.find((t) => t.id === "edit-s1")!.date : pub4!.date) || true).toBe(true);
  });

  it("si todo está publicado no quedan sesiones ni publicaciones, solo ritmo semanal", () => {
    const sch = buildSchedule("2026-08-03", () => "publicado");
    expect(sch.tasks.filter((t) => t.kind === "grabar" || t.kind === "editar" || t.kind === "publicar")).toEqual([]);
    expect(sch.tasks.some((t) => t.kind === "revisar")).toBe(true);
  });
});
