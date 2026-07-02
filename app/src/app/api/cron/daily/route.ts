import { createClient } from "@supabase/supabase-js";
import { sendMail, brandedEmail, escapeHtml } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { report } from "@/lib/log";

/**
 * Cron diario (Vercel Cron, gratis): el corazón de "Zentro actúa por ti".
 *  1. Recordatorios de cobranza: correo al cliente por cada factura vencida,
 *     los días 1, 5, 9 y 13 de atraso (máx. 4, para cobrar sin acosar).
 *  2. Los lunes: resumen semanal al dueño de cada negocio.
 *
 * Seguridad y robustez:
 *  - Si CRON_SECRET está configurado, se exige `Authorization: Bearer <secret>`
 *    (Vercel lo envía solo). Si no, solo se acepta el user-agent del cron.
 *  - Todo es idempotente por diseño: reminder_log tiene unicidad por
 *    factura/día y por negocio/semana, así que invocarlo N veces no duplica
 *    ni un solo correo.
 *  - Sin SUPABASE_SECRET_KEY el endpoint responde "no configurado" sin fallar.
 */
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentro-ten-phi.vercel.app";

/** Días de atraso en los que se recuerda (1º, luego cada 4 días, máx. 4 avisos). */
const REMINDER_DAYS = new Set([1, 5, 9, 13]);

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.get("authorization") === `Bearer ${secret}`;
  return (req.headers.get("user-agent") ?? "").includes("vercel-cron");
}

type OverdueRow = {
  id: string;
  number: string;
  due_date: string;
  balance_minor: number;
  payment_link: string | null;
  organization_id: string;
  customers: { legal_name: string; email: string | null } | null;
  organizations: { name: string; base_currency: string; auto_reminders: boolean } | null;
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

/** Semana ISO (YYYY-Www) para la idempotencia del resumen semanal. */
function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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
  const today = now.toISOString().slice(0, 10);
  const result = { ok: true, reminders: 0, summaries: 0, skipped: 0, errors: 0 };

  // ---------- 1) Recordatorios de cobranza ----------
  const { data: overdue, error: qErr } = await db
    .from("invoices")
    .select(
      "id, number, due_date, balance_minor, payment_link, organization_id, customers(legal_name, email), organizations(name, base_currency, auto_reminders)",
    )
    .gt("balance_minor", 0)
    .lt("due_date", today)
    .in("status", ["issued", "partially_paid", "overdue"]);
  if (qErr) report("cron.overdue", qErr);

  for (const inv of (overdue ?? []) as unknown as OverdueRow[]) {
    const org = inv.organizations;
    const cust = inv.customers;
    if (!org?.auto_reminders || !cust?.email) { result.skipped++; continue; }
    const late = daysBetween(inv.due_date, today);
    if (!REMINDER_DAYS.has(late)) { result.skipped++; continue; }

    // Reclamo idempotente: si ya existe el registro de hoy, otro proceso lo envió.
    const { error: claimErr } = await db.from("reminder_log").insert({
      organization_id: inv.organization_id,
      kind: "collection",
      invoice_id: inv.id,
      recipient: cust.email,
      period: today,
    });
    if (claimErr) { result.skipped++; continue; }

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

  // ---------- 2) Resumen semanal (lunes) ----------
  // ?force=weekly permite probarlo manualmente sin esperar al lunes (la
  // idempotencia por semana evita duplicados de todos modos).
  const forceWeekly = new URL(req.url).searchParams.get("force") === "weekly";
  if (now.getUTCDay() === 1 || forceWeekly) {
    const week = isoWeek(now);
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

    const [{ data: owners }, { data: orgs }, { data: pays }, { data: qs }, { data: exps }, { data: invs }] =
      await Promise.all([
        db.rpc("org_owner_emails"),
        db.from("organizations").select("id, name, base_currency, weekly_summary"),
        db.from("payments").select("organization_id, amount_minor, paid_at").gte("paid_at", weekAgo),
        db.from("quick_sales").select("organization_id, amount_minor, sold_at").gte("sold_at", weekAgo),
        db.from("expenses").select("organization_id, amount_minor, expense_date").gte("expense_date", weekAgo),
        db.from("invoices").select("organization_id, balance_minor, due_date, status").gt("balance_minor", 0).in("status", ["issued", "partially_paid", "overdue"]),
      ]);

    const sum = (rows: { organization_id: string; amount_minor: number }[] | null, orgId: string) =>
      (rows ?? []).filter((r) => r.organization_id === orgId).reduce((s, r) => s + (r.amount_minor ?? 0), 0);

    for (const org of orgs ?? []) {
      if (!org.weekly_summary) continue;
      const cobrado = sum(pays as never, org.id) + sum(qs as never, org.id);
      const gastado = sum(exps as never, org.id);
      const pendientes = (invs ?? []).filter((i) => i.organization_id === org.id);
      const porCobrar = pendientes.reduce((s, i) => s + (i.balance_minor ?? 0), 0);
      const vencidas = pendientes.filter((i) => i.due_date < today).length;
      if (cobrado === 0 && gastado === 0 && porCobrar === 0) continue; // sin actividad, sin correo

      for (const owner of (owners ?? []).filter((o: { organization_id: string }) => o.organization_id === org.id)) {
        const { error: claimErr } = await db.from("reminder_log").insert({
          organization_id: org.id,
          kind: "weekly",
          recipient: owner.email,
          period: week,
        });
        if (claimErr) continue; // ya enviado esta semana

        const fm = (v: number) => formatMoney(v, org.base_currency);
        const html = brandedEmail(
          `Tu semana en ${org.name}`,
          `<p>Así le fue a <b>${escapeHtml(org.name)}</b> en los últimos 7 días:</p>
           <table style="width:100%;font-size:14px;border-collapse:collapse">
             <tr><td style="padding:6px 0;color:#475569">Cobrado esta semana</td><td align="right" style="font-weight:bold;color:#047857">${fm(cobrado)}</td></tr>
             <tr><td style="padding:6px 0;color:#475569">Gastado esta semana</td><td align="right" style="font-weight:bold;color:#b91c1c">${fm(gastado)}</td></tr>
             <tr><td style="padding:6px 0;color:#475569">Por cobrar (total)</td><td align="right" style="font-weight:bold">${fm(porCobrar)}</td></tr>
             <tr><td style="padding:6px 0;color:#475569">Facturas vencidas</td><td align="right" style="font-weight:bold">${vencidas}</td></tr>
           </table>
           ${vencidas > 0 ? `<p style="margin-top:12px">Tienes <b>${vencidas} factura(s) vencida(s)</b>: tu prioridad de hoy es cobrarlas.</p>` : `<p style="margin-top:12px">Sin facturas vencidas. ¡Buen trabajo!</p>`}`,
          "Abrir mi panel",
          `${APP_URL}/priorities`,
        );
        const sent = await sendMail(owner.email, `📊 Tu semana en ${org.name} — resumen Zentro`, html);
        if (sent) {
          result.summaries++;
        } else {
          await db.from("reminder_log").delete().eq("organization_id", org.id).eq("period", week).eq("kind", "weekly").eq("recipient", owner.email);
          result.errors++;
        }
      }
    }
  }

  return Response.json(result);
}
