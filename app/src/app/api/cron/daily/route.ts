import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendMail, brandedEmail, escapeHtml } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { report } from "@/lib/log";
import {
  addDays,
  closedMonthsBefore,
  closedWeeksBefore,
  formatMonthName,
  formatWeekRange,
  todayIn,
  type Period,
} from "@/lib/weeks";

/**
 * Cron diario (Vercel Cron): el corazón de "Zentro actúa por ti".
 *  1. Aviso preventivo "tu factura vence mañana" y recordatorios de cobranza
 *     los días 1, 5, 9 y 13 de atraso (máx. 4, para cobrar sin acosar).
 *  2. Resumen de cada SEMANA cerrada y de cada MES cerrado, al dueño.
 *
 * Cómo se decide qué período resumir (y por qué así):
 *  - Un resumen habla siempre de un período YA CERRADO: la semana lunes→domingo
 *    que terminó, o el mes que terminó, medidos en la ZONA HORARIA del negocio
 *    (`organizations.timezone`), no en UTC. Nunca es una ventana móvil
 *    "los últimos 7 días desde ahora": esa se corre, se solapa un día con la
 *    ventana anterior y cambia según la hora a la que corra el job.
 *  - Cada corrida revisa los últimos N períodos cerrados y procesa los que
 *    todavía no estén en `reminder_log`. Por eso el job es idempotente
 *    (correrlo diez veces no manda dos correos) Y se auto-recupera: si el
 *    lunes falló el envío, el martes sale el mismo resumen de la misma semana.
 *  - `reminder_log` es la fuente de verdad de "qué períodos ya se procesaron".
 *    La fila se inserta ANTES de enviar (reserva el turno: dos ejecuciones
 *    simultáneas no pueden duplicar) y `sent` distingue "enviado" de
 *    "revisado, no había nada que contar".
 *  - Un período SIN movimiento no genera correo. Antes sí lo generaba, porque
 *    la condición miraba el saldo por cobrar histórico (que nunca es 0 si
 *    alguna vez quedó una factura sin pagar): eso hacía llegar cada lunes un
 *    correo idéntico con cifras de semanas viejas.
 *
 * Seguridad: si CRON_SECRET está configurado se exige `Authorization: Bearer`.
 * Sin SUPABASE_SECRET_KEY el endpoint responde "no configurado" sin fallar.
 */
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentro-ten-phi.vercel.app";

/** Días de atraso en los que se recuerda (1º, luego cada 4 días, máx. 4 avisos). */
const REMINDER_DAYS = new Set([1, 5, 9, 13]);

/** Cuántos períodos cerrados hacia atrás se revisan en cada corrida. */
const CATCHUP_WEEKS = 4;
const CATCHUP_MONTHS = 2;

/**
 * Primer día que este motor puede resumir. Los períodos anteriores se marcan
 * como procesados SIN enviar: así estrenar el arreglo no dispara un lote de
 * correos retroactivos a todos los negocios.
 */
const SUMMARY_EPOCH = "2026-08-17";

/** Tope de páginas por consulta: 200 000 filas. Evita un bucle infinito. */
const PAGE_SIZE = 1000;
const MAX_PAGES = 200;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") ?? "").includes("vercel-cron");
}

type Org = {
  id: string;
  name: string;
  base_currency: string;
  timezone: string | null;
  weekly_summary: boolean;
  created_at: string;
};

type Owner = { organization_id: string; email: string };

type InvoiceRow = {
  id: string;
  number: string;
  due_date: string;
  balance_minor: number;
  payment_link: string | null;
  organization_id: string;
  customers: { legal_name: string; email: string | null } | null;
  organizations: { name: string; base_currency: string; auto_reminders: boolean; timezone: string | null } | null;
};

type MovementRow = { organization_id: string; amount_minor: number; on: string };

/**
 * Lee TODAS las filas de una consulta, no las primeras 1000.
 * PostgREST corta en `max-rows` sin avisar: con un usuario de prueba nunca se
 * nota, con diez negocios reales el resumen saldría con cifras incompletas y
 * nadie se enteraría. El orden por id hace la paginación estable.
 */
async function fetchAll<T>(
  scope: string,
  make: () => { range: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }> },
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await make().range(from, from + PAGE_SIZE - 1);
    if (error) {
      report(scope, error);
      break;
    }
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

/** Suma los movimientos de un negocio dentro de un período cerrado. */
function sumIn(rows: MovementRow[], orgId: string, p: Period): number {
  let total = 0;
  for (const r of rows) {
    if (r.organization_id === orgId && r.on >= p.start && r.on <= p.end) total += r.amount_minor ?? 0;
  }
  return total;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return Response.json({ ok: true, configured: false, hint: "Falta SUPABASE_SECRET_KEY en Vercel" });
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const now = new Date();
  const params = new URL(req.url).searchParams;
  const force = params.get("force"); // "weekly" | "monthly" (pruebas manuales)
  const result = {
    ok: true,
    reminders: 0,
    upcoming: 0,
    summaries: 0,
    monthlies: 0,
    quietPeriods: 0,
    skipped: 0,
    errors: 0,
  };

  const orgs = await fetchAll<Org>("cron.orgs", () =>
    db.from("organizations").select("id, name, base_currency, timezone, weekly_summary, created_at").order("id"),
  );
  /** "Hoy" de cada negocio, en su propia zona horaria. */
  const orgToday = new Map(orgs.map((o) => [o.id, todayIn(o.timezone, now)]));

  await sendCollectionReminders(db, now, orgToday, result);
  await sendUpcomingNotices(db, now, orgToday, result);
  await sendPeriodSummaries(db, orgs, orgToday, force, result);

  return Response.json(result);
}

// =====================================================================
// 1) Recordatorios de cobranza (factura ya vencida)
// =====================================================================
async function sendCollectionReminders(
  db: SupabaseClient,
  now: Date,
  orgToday: Map<string, string>,
  result: { reminders: number; skipped: number; errors: number },
) {
  // La ventana de la consulta se abre un día a cada lado del día UTC porque
  // el "hoy" de cada negocio depende de su zona horaria; el filtro fino
  // (REMINDER_DAYS) se aplica después, ya con la fecha local correcta.
  const utcToday = now.toISOString().slice(0, 10);
  const rows = await fetchAll<InvoiceRow>("cron.overdue", () =>
    db
      .from("invoices")
      .select(
        "id, number, due_date, balance_minor, payment_link, organization_id, customers(legal_name, email), organizations(name, base_currency, auto_reminders, timezone)",
      )
      .gt("balance_minor", 0)
      .lt("due_date", addDays(utcToday, 1))
      .gte("due_date", addDays(utcToday, -20))
      .in("status", ["issued", "partially_paid", "overdue"])
      .order("id"),
  );

  for (const inv of rows) {
    const org = inv.organizations;
    const cust = inv.customers;
    if (!org?.auto_reminders || !cust?.email) {
      result.skipped++;
      continue;
    }
    const today = orgToday.get(inv.organization_id) ?? utcToday;
    const late = Math.round(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${inv.due_date}T00:00:00Z`)) / 86_400_000,
    );
    if (!REMINDER_DAYS.has(late)) {
      result.skipped++;
      continue;
    }

    // Reclamo idempotente: si ya existe el registro de hoy, otro proceso lo envió.
    const { error: claimErr } = await db.from("reminder_log").insert({
      organization_id: inv.organization_id,
      kind: "collection",
      invoice_id: inv.id,
      recipient: cust.email,
      period: today,
    });
    if (claimErr) {
      result.skipped++;
      continue;
    }

    const amount = formatMoney(inv.balance_minor, org.base_currency);
    const orgName = escapeHtml(org.name);
    const html = brandedEmail(
      `Recordatorio de pago — Factura ${inv.number}`,
      `<p>Hola ${escapeHtml(cust.legal_name)},</p>
       <p>Te escribimos de parte de <b>${orgName}</b>. La factura <b>${escapeHtml(inv.number)}</b> por <b>${amount}</b> venció hace ${late} día(s) y sigue pendiente de pago.</p>
       <p>Si ya realizaste el pago, ignora este mensaje. ¡Gracias!</p>
       <p style="color:#94a3b8;font-size:12px">Enviado automáticamente por Zentro a nombre de ${orgName}.</p>`,
      inv.payment_link ? "Pagar ahora" : undefined,
      inv.payment_link ?? undefined,
    );
    const sent = await sendMail(cust.email, `Recordatorio de pago — Factura ${inv.number} · ${org.name}`, html);
    if (sent) {
      result.reminders++;
    } else {
      // Libera el reclamo para reintentar en el próximo día programado.
      await db.from("reminder_log").delete().eq("invoice_id", inv.id).eq("period", today).eq("kind", "collection");
      result.errors++;
    }
  }
}

// =====================================================================
// 1b) Aviso preventivo: "tu factura vence mañana"
// Prevención > cobranza: un recordatorio amable ANTES del vencimiento evita
// el atraso en lugar de perseguirlo (North Star: dinero cobrado a tiempo).
// =====================================================================
async function sendUpcomingNotices(
  db: SupabaseClient,
  now: Date,
  orgToday: Map<string, string>,
  result: { upcoming: number; skipped: number; errors: number },
) {
  const utcToday = now.toISOString().slice(0, 10);
  const rows = await fetchAll<InvoiceRow>("cron.dueSoon", () =>
    db
      .from("invoices")
      .select(
        "id, number, due_date, balance_minor, payment_link, organization_id, customers(legal_name, email), organizations(name, base_currency, auto_reminders, timezone)",
      )
      .gt("balance_minor", 0)
      .gte("due_date", utcToday)
      .lte("due_date", addDays(utcToday, 2))
      .in("status", ["issued", "partially_paid"])
      .order("id"),
  );

  for (const inv of rows) {
    const org = inv.organizations;
    const cust = inv.customers;
    if (!org?.auto_reminders || !cust?.email) {
      result.skipped++;
      continue;
    }
    const today = orgToday.get(inv.organization_id) ?? utcToday;
    if (inv.due_date !== addDays(today, 1)) {
      result.skipped++;
      continue;
    }

    // Idempotente: 1 aviso por factura y fecha de vencimiento.
    const { error: claimErr } = await db.from("reminder_log").insert({
      organization_id: inv.organization_id,
      kind: "upcoming",
      invoice_id: inv.id,
      recipient: cust.email,
      period: inv.due_date,
    });
    if (claimErr) {
      result.skipped++;
      continue;
    }

    const amount = formatMoney(inv.balance_minor, org.base_currency);
    const orgName = escapeHtml(org.name);
    const html = brandedEmail(
      `Tu factura ${inv.number} vence mañana`,
      `<p>Hola ${escapeHtml(cust.legal_name)},</p>
       <p>Te escribimos de parte de <b>${orgName}</b>. Un recordatorio amable: la factura <b>${escapeHtml(inv.number)}</b> por <b>${amount}</b> vence <b>mañana ${inv.due_date}</b>.</p>
       <p>Pagando a tiempo evitas recordatorios de cobranza. Si ya realizaste el pago, ignora este mensaje. ¡Gracias!</p>
       <p style="color:#94a3b8;font-size:12px">Enviado automáticamente por Zentro a nombre de ${orgName}.</p>`,
      inv.payment_link ? "Pagar ahora" : undefined,
      inv.payment_link ?? undefined,
    );
    const sent = await sendMail(cust.email, `Tu factura ${inv.number} vence mañana · ${org.name}`, html);
    if (sent) {
      result.upcoming++;
    } else {
      await db.from("reminder_log").delete().eq("invoice_id", inv.id).eq("period", inv.due_date).eq("kind", "upcoming");
      result.errors++;
    }
  }
}

// =====================================================================
// 2) Resúmenes de períodos cerrados (semana y mes)
// =====================================================================
type SummaryResult = { summaries: number; monthlies: number; quietPeriods: number; skipped: number; errors: number };

async function sendPeriodSummaries(
  db: SupabaseClient,
  orgs: Org[],
  orgToday: Map<string, string>,
  force: string | null,
  result: SummaryResult,
) {
  const active = orgs.filter((o) => o.weekly_summary);
  if (active.length === 0) return;

  // Qué períodos cerrados le tocan a cada negocio (en SU zona horaria).
  // `force` limita a un solo período para que una prueba manual no dispare
  // un lote de correos atrasados.
  const plan = new Map<string, { weeks: Period[]; months: Period[] }>();
  for (const org of active) {
    const today = orgToday.get(org.id)!;
    const weeks = closedWeeksBefore(today, force === "weekly" ? 1 : CATCHUP_WEEKS);
    const months = closedMonthsBefore(today, force === "monthly" ? 1 : CATCHUP_MONTHS);
    plan.set(org.id, { weeks, months });
  }

  const bounds = [...plan.values()].flatMap((p) => [...p.weeks, ...p.months]);
  if (bounds.length === 0) return;
  const rangeStart = bounds.reduce((a, p) => (p.start < a ? p.start : a), bounds[0].start);
  const rangeEnd = bounds.reduce((a, p) => (p.end > a ? p.end : a), bounds[0].end);

  // Un solo barrido de datos para todos los negocios y todos los períodos.
  const [payments, sales, expenses, issued, unpaid, owners] = await Promise.all([
    fetchAll<{ organization_id: string; amount_minor: number; paid_at: string }>("cron.payments", () =>
      db
        .from("payments")
        .select("organization_id, amount_minor, paid_at")
        .gte("paid_at", rangeStart)
        .lte("paid_at", rangeEnd)
        .order("id"),
    ),
    fetchAll<{ organization_id: string; amount_minor: number; sold_at: string }>("cron.sales", () =>
      db
        .from("quick_sales")
        .select("organization_id, amount_minor, sold_at")
        .gte("sold_at", rangeStart)
        .lte("sold_at", rangeEnd)
        .order("id"),
    ),
    fetchAll<{ organization_id: string; amount_minor: number; expense_date: string }>("cron.expenses", () =>
      db
        .from("expenses")
        .select("organization_id, amount_minor, expense_date")
        .gte("expense_date", rangeStart)
        .lte("expense_date", rangeEnd)
        .order("id"),
    ),
    fetchAll<{ organization_id: string; total_minor: number; issue_date: string }>("cron.issued", () =>
      db
        .from("invoices")
        .select("organization_id, total_minor, issue_date")
        .gte("issue_date", rangeStart)
        .lte("issue_date", rangeEnd)
        .order("id"),
    ),
    fetchAll<{ organization_id: string; balance_minor: number; due_date: string }>("cron.unpaid", () =>
      db
        .from("invoices")
        .select("organization_id, balance_minor, due_date")
        .gt("balance_minor", 0)
        .in("status", ["issued", "partially_paid", "overdue"])
        .order("id"),
    ),
    fetchAll<Owner>("cron.owners", () => db.rpc("org_owner_emails")),
  ]);

  const pay: MovementRow[] = payments.map((r) => ({ ...r, on: r.paid_at }));
  const sal: MovementRow[] = sales.map((r) => ({ ...r, on: r.sold_at }));
  const exp: MovementRow[] = expenses.map((r) => ({ ...r, on: r.expense_date }));
  const iss: MovementRow[] = issued.map((r) => ({ organization_id: r.organization_id, amount_minor: r.total_minor, on: r.issue_date }));

  const ownersByOrg = new Map<string, string[]>();
  for (const o of owners) {
    if (!o.email) continue;
    const list = ownersByOrg.get(o.organization_id) ?? [];
    if (!list.includes(o.email)) list.push(o.email); // un dueño, un correo
    ownersByOrg.set(o.organization_id, list);
  }

  for (const org of active) {
    const owner = ownersByOrg.get(org.id) ?? [];
    if (owner.length === 0) {
      result.skipped++;
      continue;
    }
    const createdOn = String(org.created_at).slice(0, 10);
    const today = orgToday.get(org.id)!;
    const { weeks, months } = plan.get(org.id)!;

    const snapshot = () => {
      const rows = unpaid.filter((i) => i.organization_id === org.id);
      return {
        porCobrar: rows.reduce((s, i) => s + (i.balance_minor ?? 0), 0),
        vencidas: rows.filter((i) => i.due_date < today).length,
      };
    };

    for (const week of weeks) {
      if (week.end < createdOn) continue; // el negocio aún no existía
      const claimed = await claim(db, org.id, "weekly", week.period, owner);
      if (claimed.length === 0) continue; // esta semana ya se procesó

      const cobrado = sumIn(pay, org.id, week) + sumIn(sal, org.id, week);
      const gastado = sumIn(exp, org.id, week);
      const facturado = sumIn(iss, org.id, week);
      if (week.end < SUMMARY_EPOCH || (cobrado === 0 && gastado === 0 && facturado === 0)) {
        result.quietPeriods++; // queda registrada como procesada, sin correo
        continue;
      }

      const { porCobrar, vencidas } = snapshot();
      const fm = (v: number) => formatMoney(v, org.base_currency);
      const rango = formatWeekRange(week);
      const html = brandedEmail(
        `Tu semana en ${org.name} — ${rango}`,
        `<p>Así le fue a <b>${escapeHtml(org.name)}</b> del <b>${week.start}</b> al <b>${week.end}</b>:</p>
         <table style="width:100%;font-size:14px;border-collapse:collapse">
           <tr><td style="padding:6px 0;color:#475569">Cobrado en la semana</td><td align="right" style="font-weight:bold;color:#047857">${fm(cobrado)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Gastado en la semana</td><td align="right" style="font-weight:bold;color:#b91c1c">${fm(gastado)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Facturado en la semana</td><td align="right" style="font-weight:bold">${fm(facturado)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Por cobrar (hoy)</td><td align="right" style="font-weight:bold">${fm(porCobrar)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Facturas vencidas (hoy)</td><td align="right" style="font-weight:bold">${vencidas}</td></tr>
         </table>
         ${
           vencidas > 0
             ? `<p style="margin-top:12px">Tienes <b>${vencidas} factura(s) vencida(s)</b>: tu prioridad de hoy es cobrarlas.</p>`
             : `<p style="margin-top:12px">Sin facturas vencidas. ¡Buen trabajo!</p>`
         }`,
        "Abrir mi panel",
        `${APP_URL}/priorities`,
      );
      await deliver(db, org.id, "weekly", week.period, claimed, `📊 Tu semana en ${org.name} (${rango})`, html, result, "summaries");
    }

    for (const month of months) {
      if (month.end < createdOn) continue;
      const claimed = await claim(db, org.id, "monthly", month.period, owner);
      if (claimed.length === 0) continue;

      const cobrado = sumIn(pay, org.id, month) + sumIn(sal, org.id, month);
      const gastado = sumIn(exp, org.id, month);
      const facturado = sumIn(iss, org.id, month);
      if (month.end < SUMMARY_EPOCH || (cobrado === 0 && gastado === 0 && facturado === 0)) {
        result.quietPeriods++;
        continue;
      }

      const prev = { period: "", start: `${addDays(month.start, -1).slice(0, 7)}-01`, end: addDays(month.start, -1) };
      const cobradoAntes = sumIn(pay, org.id, prev) + sumIn(sal, org.id, prev);
      const utilidad = cobrado - gastado;
      const delta = cobradoAntes > 0 ? Math.round(((cobrado - cobradoAntes) / cobradoAntes) * 100) : null;
      const deltaLine =
        delta === null
          ? ""
          : delta >= 0
            ? `<p style="margin-top:12px">Cobraste <b style="color:#047857">${delta}% más</b> que el mes anterior. ¡Sigue así!</p>`
            : `<p style="margin-top:12px">Cobraste <b style="color:#b91c1c">${Math.abs(delta)}% menos</b> que el mes anterior. Revisa tu Centro de Prioridades para recuperar el ritmo.</p>`;

      const { porCobrar, vencidas } = snapshot();
      const fm = (v: number) => formatMoney(v, org.base_currency);
      const nombreMes = formatMonthName(month.period);
      const html = brandedEmail(
        `Tu mes en ${org.name} — ${nombreMes}`,
        `<p>Así cerró <b>${escapeHtml(org.name)}</b> en ${nombreMes}:</p>
         <table style="width:100%;font-size:14px;border-collapse:collapse">
           <tr><td style="padding:6px 0;color:#475569">Cobrado en el mes</td><td align="right" style="font-weight:bold;color:#047857">${fm(cobrado)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Gastado en el mes</td><td align="right" style="font-weight:bold;color:#b91c1c">${fm(gastado)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Utilidad del mes</td><td align="right" style="font-weight:bold;color:${utilidad >= 0 ? "#047857" : "#b91c1c"}">${fm(utilidad)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Por cobrar (hoy)</td><td align="right" style="font-weight:bold">${fm(porCobrar)}</td></tr>
           <tr><td style="padding:6px 0;color:#475569">Facturas vencidas (hoy)</td><td align="right" style="font-weight:bold">${vencidas}</td></tr>
         </table>
         ${deltaLine}`,
        "Ver mi rentabilidad",
        `${APP_URL}/profitability`,
      );
      await deliver(db, org.id, "monthly", month.period, claimed, `📈 Tu mes en ${org.name} — ${nombreMes}`, html, result, "monthlies");
    }
  }
}

/**
 * Reserva el período para cada destinatario ANTES de enviar y devuelve solo
 * los que se reservaron. El índice único de `reminder_log` hace de candado:
 * si dos ejecuciones coinciden, una gana la fila y la otra recibe error, así
 * que es imposible mandar el mismo resumen dos veces. Se guarda `sent=false`
 * y se sube a `true` al confirmar el envío.
 */
async function claim(
  db: SupabaseClient,
  organization_id: string,
  kind: "weekly" | "monthly",
  period: string,
  recipients: string[],
): Promise<string[]> {
  const got: string[] = [];
  for (const recipient of recipients) {
    const { error } = await db
      .from("reminder_log")
      .insert({ organization_id, kind, period, recipient, sent: false });
    if (!error) got.push(recipient);
  }
  return got;
}

/** Envía y confirma; si el envío falla libera la reserva para reintentar mañana. */
async function deliver(
  db: SupabaseClient,
  organization_id: string,
  kind: "weekly" | "monthly",
  period: string,
  recipients: string[],
  subject: string,
  html: string,
  result: SummaryResult,
  counter: "summaries" | "monthlies",
) {
  for (const recipient of recipients) {
    const sent = await sendMail(recipient, subject, html);
    if (sent) {
      await db
        .from("reminder_log")
        .update({ sent: true })
        .eq("organization_id", organization_id)
        .eq("kind", kind)
        .eq("period", period)
        .eq("recipient", recipient);
      result[counter]++;
    } else {
      await db
        .from("reminder_log")
        .delete()
        .eq("organization_id", organization_id)
        .eq("kind", kind)
        .eq("period", period)
        .eq("recipient", recipient);
      result.errors++;
    }
  }
}
