import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  instantFromLocal,
  localDayTime,
  closedWeeksBefore,
  formatWeekRange,
  isoWeekKey,
  isoWeekday,
  mondayOf,
  todayIn,
  weekOf,
} from "./weeks";

describe("aritmética de días", () => {
  it("suma y resta cruzando meses y años", () => {
    expect(addDays("2026-08-21", 1)).toBe("2026-08-22");
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); // bisiesto
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // no bisiesto
  });

  it("no se corre por cambio de horario de verano", () => {
    // En zonas con DST un día "dura" 23 o 25 horas; la aritmética de
    // calendario debe ignorarlo por completo.
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09"); // EE. UU. adelanta
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02"); // EE. UU. atrasa
  });

  it("rechaza fechas inválidas en vez de devolver NaN", () => {
    expect(() => addDays("21/08/2026", 1)).toThrow();
    expect(() => addDays("2026-8-21", 1)).toThrow();
  });
});

describe("isoWeekday / mondayOf", () => {
  it("lunes = 1, domingo = 7", () => {
    expect(isoWeekday("2026-08-17")).toBe(1); // lunes
    expect(isoWeekday("2026-08-21")).toBe(5); // viernes
    expect(isoWeekday("2026-08-23")).toBe(7); // domingo
  });

  it("el lunes de cualquier día de la semana es el mismo", () => {
    for (const d of ["2026-08-17", "2026-08-18", "2026-08-20", "2026-08-22", "2026-08-23"]) {
      expect(mondayOf(d)).toBe("2026-08-17");
    }
  });
});

describe("isoWeekKey", () => {
  it("coincide con ISO-8601 en los bordes de año", () => {
    // 2026-01-01 es jueves ⇒ semana 1 de 2026 (empieza el 2025-12-29).
    expect(isoWeekKey("2025-12-29")).toBe("2026-W01");
    expect(isoWeekKey("2026-01-01")).toBe("2026-W01");
    // 2021-01-01 es viernes ⇒ pertenece a la semana 53 de 2020.
    expect(isoWeekKey("2021-01-01")).toBe("2020-W53");
    expect(isoWeekKey("2020-12-31")).toBe("2020-W53");
    // 2024-12-30 es lunes ⇒ ya es la semana 1 de 2025.
    expect(isoWeekKey("2024-12-30")).toBe("2025-W01");
    expect(isoWeekKey("2026-08-17")).toBe("2026-W34");
  });

  it("todos los días de una semana comparten clave", () => {
    const keys = new Set(
      ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"].map(
        isoWeekKey,
      ),
    );
    expect([...keys]).toEqual(["2026-W34"]);
  });

  it("dos semanas consecutivas nunca comparten clave (52 semanas seguidas)", () => {
    const seen = new Set<string>();
    let d = "2025-12-01";
    for (let i = 0; i < 60; i++) {
      seen.add(isoWeekKey(d));
      d = addDays(d, 7);
    }
    expect(seen.size).toBe(60);
  });
});

describe("weekOf", () => {
  it("devuelve lunes→domingo inclusive", () => {
    expect(weekOf("2026-08-21")).toEqual({ period: "2026-W34", start: "2026-08-17", end: "2026-08-23" });
  });
});

describe("closedWeeksBefore — el corazón del arreglo", () => {
  it("nunca incluye la semana en curso", () => {
    const weeks = closedWeeksBefore("2026-08-21", 4);
    expect(weeks.map((w) => w.period)).not.toContain("2026-W34");
  });

  it("devuelve las semanas cerradas de la más antigua a la más reciente", () => {
    expect(closedWeeksBefore("2026-08-21", 3)).toEqual([
      { period: "2026-W31", start: "2026-07-27", end: "2026-08-02" },
      { period: "2026-W32", start: "2026-08-03", end: "2026-08-09" },
      { period: "2026-W33", start: "2026-08-10", end: "2026-08-16" },
    ]);
  });

  it("da EL MISMO resultado corra el lunes o el domingo de esa semana", () => {
    const lunes = closedWeeksBefore("2026-08-17", 4);
    for (const dia of ["2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"]) {
      expect(closedWeeksBefore(dia, 4)).toEqual(lunes);
    }
  });

  it("las semanas son contiguas y no se solapan", () => {
    const weeks = closedWeeksBefore("2026-08-21", 6);
    for (let i = 1; i < weeks.length; i++) {
      expect(weeks[i].start).toBe(addDays(weeks[i - 1].end, 1));
    }
    // 7 días exactos cada una.
    for (const w of weeks) expect(addDays(w.start, 6)).toBe(w.end);
  });

  it("avanza exactamente una semana cuando avanza la semana", () => {
    const antes = closedWeeksBefore("2026-08-21", 1)[0];
    const despues = closedWeeksBefore("2026-08-28", 1)[0];
    expect(antes.period).toBe("2026-W33");
    expect(despues.period).toBe("2026-W34");
    expect(despues.start).toBe(addDays(antes.start, 7));
  });
});

describe("todayIn — zona horaria del negocio", () => {
  it("usa el día local, no el de UTC", () => {
    // Lunes 2026-08-24 a las 02:00 UTC todavía es DOMINGO 23 en México.
    const instante = new Date("2026-08-24T02:00:00Z");
    expect(todayIn("America/Mexico_City", instante)).toBe("2026-08-23");
    expect(todayIn("UTC", instante)).toBe("2026-08-24");
  });

  it("a las 13:00 UTC (hora del cron) el día local ya es el correcto en América", () => {
    const cron = new Date("2026-08-24T13:00:00Z"); // lunes
    for (const tz of ["America/Mexico_City", "America/Costa_Rica", "America/Bogota", "America/Santiago", "UTC"]) {
      expect(todayIn(tz, cron)).toBe("2026-08-24");
    }
  });

  it("la semana cerrada depende de la zona: la del domingo aún no cerró", () => {
    const instante = new Date("2026-08-24T02:00:00Z");
    const enMexico = closedWeeksBefore(todayIn("America/Mexico_City", instante), 1)[0];
    const enUtc = closedWeeksBefore(todayIn("UTC", instante), 1)[0];
    expect(enMexico.period).toBe("2026-W33"); // domingo 23 ⇒ la semana 34 sigue abierta
    expect(enUtc.period).toBe("2026-W34"); // lunes 24 ⇒ la semana 34 ya cerró
  });

  it("una zona horaria basura no revienta: cae al default", () => {
    const instante = new Date("2026-08-21T18:00:00Z");
    expect(todayIn("Marte/Olympus", instante)).toBe(todayIn("America/Mexico_City", instante));
    expect(todayIn("", instante)).toBe(todayIn("America/Mexico_City", instante));
    expect(todayIn(null, instante)).toBe(todayIn("America/Mexico_City", instante));
  });
});

describe("formatWeekRange", () => {
  it("mismo mes y meses distintos", () => {
    expect(formatWeekRange(weekOf("2026-08-21"))).toBe("17–23 ago");
    expect(formatWeekRange(weekOf("2026-10-01"))).toBe("28 sep – 4 oct");
  });

  it("dos semanas distintas nunca producen el mismo texto", () => {
    const a = formatWeekRange(closedWeeksBefore("2026-08-21", 1)[0]);
    const b = formatWeekRange(closedWeeksBefore("2026-08-28", 1)[0]);
    expect(a).not.toBe(b);
  });
});

describe("addMonths — recorte de fin de mes", () => {
  it("31 de enero + 1 mes es fin de febrero, no marzo", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29"); // bisiesto
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("cruza el año en ambos sentidos", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
    expect(addMonths("2026-08-21", -12)).toBe("2025-08-21");
  });

  it("una tarea mensual nunca se salta un mes al repetirse doce veces", () => {
    let d = "2026-01-31";
    const meses: string[] = [];
    for (let i = 0; i < 12; i++) {
      d = addMonths(d, 1);
      meses.push(d.slice(0, 7));
    }
    expect(meses).toEqual([
      "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07",
      "2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01",
    ]);
  });
});

describe("localDayTime / instantFromLocal — citas", () => {
  it("una cita de la tarde no salta al día siguiente", () => {
    // 2026-08-26T01:00:00Z = 25 de agosto, 19:00 en México.
    expect(localDayTime("2026-08-26T01:00:00Z", "America/Mexico_City")).toEqual({
      date: "2026-08-25",
      time: "19:00",
    });
  });

  it("medianoche local se muestra como 00:00, no 24:00", () => {
    expect(localDayTime("2026-08-25T06:00:00Z", "America/Mexico_City").time).toBe("00:00");
  });

  it("guardar y volver a leer devuelve exactamente la hora que escribió el usuario", () => {
    for (const tz of ["America/Mexico_City", "America/Costa_Rica", "America/Santiago", "Europe/Madrid", "UTC"]) {
      for (const [fecha, hora] of [
        ["2026-08-25", "14:00"],
        ["2026-01-15", "09:30"],
        ["2026-07-04", "23:45"],
        ["2026-11-02", "00:15"],
      ]) {
        const guardado = instantFromLocal(fecha, hora, tz);
        expect(localDayTime(guardado, tz)).toEqual({ date: fecha, time: hora });
      }
    }
  });

  it("una hora inválida no revienta ni guarda basura", () => {
    expect(localDayTime("no-es-fecha", "UTC")).toEqual({ date: "", time: "" });
    expect(() => instantFromLocal("2026-13-99", "14:00", "UTC")).not.toThrow();
  });
});
