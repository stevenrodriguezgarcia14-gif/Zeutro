/**
 * Fechas de calendario y semanas ISO — sin dependencias, puro y testeable.
 *
 * Por qué existe: los importes del negocio viven en columnas `date`
 * (payments.paid_at, expenses.expense_date, quick_sales.sold_at,
 * invoices.due_date), o sea DÍAS de calendario del negocio, no instantes.
 * Mezclar eso con `new Date()` y UTC produce ventanas corridas, solapadas o
 * dependientes de la hora a la que se ejecute el cron. Aquí todo se maneja
 * como texto "YYYY-MM-DD" y la única conversión instante → día ocurre en
 * `todayIn()`, que respeta la zona horaria configurada del negocio.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** Zona horaria por defecto: la misma que el default de organizations.timezone. */
export const DEFAULT_TIMEZONE = "America/Mexico_City";

export type Week = {
  /** Clave ISO de la semana (YYYY-Www). Se usa como identificador de período. */
  period: string;
  /** Lunes de la semana (YYYY-MM-DD), inclusive. */
  start: string;
  /** Domingo de la semana (YYYY-MM-DD), inclusive. */
  end: string;
};

function toUtc(date: string): Date {
  if (!DATE_RE.test(date)) throw new RangeError(`Fecha inválida: ${date}`);
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(ms)) throw new RangeError(`Fecha inválida: ${date}`);
  return new Date(ms);
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * El día de calendario ("YYYY-MM-DD") que es "hoy" en una zona horaria.
 * Si la zona es inválida o desconocida cae al default en vez de reventar:
 * un cron nunca debe morir por un dato de configuración de un solo negocio.
 */
export function todayIn(timezone: string | null | undefined, instant: Date = new Date()): string {
  const tz = timezone?.trim() || DEFAULT_TIMEZONE;
  try {
    return formatIn(tz, instant);
  } catch {
    return formatIn(DEFAULT_TIMEZONE, instant);
  }
}

function formatIn(timeZone: string, instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const out = `${get("year")}-${get("month")}-${get("day")}`;
  if (!DATE_RE.test(out)) throw new RangeError(`No se pudo formatear la fecha en ${timeZone}`);
  return out;
}

/**
 * Día y hora LOCALES del negocio para un instante (una columna timestamptz).
 *
 * Sin esto, `new Date(x).toISOString().slice(0,10)` pone una cita de las 7 de
 * la tarde en el día siguiente, y `toLocaleTimeString()` en el servidor usa la
 * zona del servidor (UTC en Vercel) y la muestra como la 1 de la mañana.
 */
export function localDayTime(
  instant: string | Date,
  timezone: string | null | undefined,
): { date: string; time: string } {
  const when = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(when.getTime())) return { date: "", time: "" };
  const tz = timezone?.trim() || DEFAULT_TIMEZONE;
  const render = (timeZone: string) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(when);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour"); // en-CA usa 24 para medianoche
    return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${hour}:${get("minute")}` };
  };
  try {
    return render(tz);
  } catch {
    return render(DEFAULT_TIMEZONE);
  }
}

/**
 * Instante UTC (ISO) de una hora de pared del negocio: "el 25 de agosto a las
 * 14:00 EN SU ZONA". El inverso exacto de `localDayTime`.
 *
 * `new Date("2026-08-25T14:00:00")` interpreta la hora en la zona del SERVIDOR
 * (UTC en Vercel): una cita de las 2 de la tarde se guardaba como 14:00 UTC,
 * o sea las 8 de la mañana en México. Aquí se resuelve el desfase real de la
 * zona en ese momento (incluye horario de verano) iterando: el desfase depende
 * del instante, y el instante del desfase.
 */
export function instantFromLocal(
  date: string,
  time: string,
  timezone: string | null | undefined,
): string {
  const naive = Date.parse(`${date}T${time.length === 5 ? time : "00:00"}:00Z`);
  if (Number.isNaN(naive)) return new Date().toISOString();
  let guess = naive;
  for (let i = 0; i < 3; i++) {
    const rendered = localDayTime(new Date(guess), timezone);
    const asIfUtc = Date.parse(`${rendered.date}T${rendered.time}:00Z`);
    if (Number.isNaN(asIfUtc)) break;
    const offset = asIfUtc - Math.floor(guess / 60_000) * 60_000;
    const next = naive - offset;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess).toISOString();
}

/** Suma (o resta) días de calendario a una fecha "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  return toDateString(new Date(toUtc(date).getTime() + days * DAY_MS));
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function isoWeekday(date: string): number {
  return toUtc(date).getUTCDay() || 7;
}

/** Lunes de la semana que contiene `date`. */
export function mondayOf(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/**
 * Clave de semana ISO-8601 ("YYYY-Www"). El año es el del jueves de esa
 * semana, por eso el 1 de enero puede caer en la W52/W53 del año anterior.
 */
export function isoWeekKey(date: string): string {
  const thursday = toUtc(addDays(date, 4 - isoWeekday(date)));
  const year = thursday.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.floor((thursday.getTime() - jan1) / (7 * DAY_MS)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** La semana ISO completa (lunes→domingo) que contiene `date`. */
export function weekOf(date: string): Week {
  const start = mondayOf(date);
  return { period: isoWeekKey(start), start, end: addDays(start, 6) };
}

/**
 * Las `count` últimas semanas COMPLETAS respecto a `today`, de la más antigua
 * a la más reciente. "Completa" = ya terminó (su domingo es anterior a hoy),
 * así el resumen de una semana nunca se calcula con la semana a medias.
 *
 * Es la pieza que hace al job independiente del día en que corra: se ejecute
 * lunes, miércoles o dos veces el mismo día, las semanas cerradas son las
 * mismas y sus fechas no se mueven.
 */
export function closedWeeksBefore(today: string, count: number): Week[] {
  const currentMonday = mondayOf(today);
  const weeks: Week[] = [];
  for (let i = count; i >= 1; i--) {
    const start = addDays(currentMonday, -7 * i);
    weeks.push({ period: isoWeekKey(start), start, end: addDays(start, 6) });
  }
  return weeks;
}

export type Period = {
  /** Identificador del período (YYYY-Www para semanas, YYYY-MM para meses). */
  period: string;
  /** Primer día del período (YYYY-MM-DD), inclusive. */
  start: string;
  /** Último día del período (YYYY-MM-DD), inclusive. */
  end: string;
};

/**
 * Suma meses de calendario recortando al último día válido: 31 de enero + 1
 * mes es 28/29 de febrero, no el 2 o 3 de marzo (que es lo que hace el
 * `setMonth` de JavaScript, y por eso una tarea mensual creada un día 31
 * terminaba saltando al mes siguiente).
 */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const total = (y * 12 + (m - 1)) + months;
  const year = Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const ultimoDia = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d, ultimoDia);
  return `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Primer día del mes que contiene `date`. */
export function firstOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/**
 * Los `count` últimos meses COMPLETOS respecto a `today`, del más antiguo al
 * más reciente. Mismo contrato que `closedWeeksBefore`: nunca incluye el mes
 * en curso, así que el resumen mensual jamás se calcula a mes medio.
 */
export function closedMonthsBefore(today: string, count: number): Period[] {
  const out: Period[] = [];
  let end = addDays(firstOfMonth(today), -1); // último día del mes anterior
  for (let i = 0; i < count; i++) {
    const start = firstOfMonth(end);
    out.unshift({ period: start.slice(0, 7), start, end });
    end = addDays(start, -1);
  }
  return out;
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MONTHS_ES_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Nombre del mes para el asunto del correo: "2026-07" → "julio de 2026". */
export function formatMonthName(period: string): string {
  const [year, month] = period.split("-");
  const name = MONTHS_ES_LONG[Number(month) - 1];
  if (!name) throw new RangeError(`Período de mes inválido: ${period}`);
  return `${name} de ${year}`;
}

/** Rango legible para el asunto del correo: "17–23 ago" o "29 sep – 5 oct". */
export function formatWeekRange(week: Week): string {
  const a = toUtc(week.start);
  const b = toUtc(week.end);
  const dayA = a.getUTCDate();
  const dayB = b.getUTCDate();
  const monthA = MONTHS_ES[a.getUTCMonth()];
  const monthB = MONTHS_ES[b.getUTCMonth()];
  return monthA === monthB ? `${dayA}–${dayB} ${monthB}` : `${dayA} ${monthA} – ${dayB} ${monthB}`;
}
