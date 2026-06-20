import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { getPurchasesOverview } from "@/lib/purchasesOverview";
import { getActivation } from "@/lib/activation";
import { learnSummary } from "@/lib/academia";
import { netOfTaxInclusive } from "@/lib/income";
import { dismissActivation } from "../org-actions";

function Card({
  title,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "bad";
}) {
  const valueCls =
    tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthStart = `${month}-01`;

  const today = new Date().toISOString().slice(0, 10);
  const [{ count: customersCount }, { data: invoices }, { data: payments }, { data: expenses }, { data: accounts }, { data: tasks }, { data: opps }, { count: projectsCount }, { data: qsRows }] =
    await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("balance_minor, status, due_date"),
      // Cobrado del mes NETO de IVA: asignaciones de pago proporcionales al subtotal de su factura.
      supabase
        .from("payment_allocations")
        .select("amount_minor, payments!inner(paid_at), invoices(subtotal_minor, total_minor)")
        .gte("payments.paid_at", monthStart),
      supabase.from("expenses").select("amount_minor, expense_date").gte("expense_date", monthStart),
      supabase.from("accounts").select("current_balance_minor").eq("is_active", true),
      supabase.from("tasks").select("due_date, status").not("status", "in", "(done,cancelled)"),
      supabase.from("opportunities").select("amount_minor, stages(probability_bps)").eq("status", "open"),
      supabase.from("projects").select("*", { count: "exact", head: true }).in("status", ["planning", "active", "on_hold"]),
      supabase.from("quick_sales").select("amount_minor, tax_rate_bps").gte("sold_at", monthStart),
    ]);

  const inv = invoices ?? [];
  const outstanding = inv
    .filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((s, i) => s + (i.balance_minor ?? 0), 0);
  const overdueCount = inv.filter(
    (i) => i.balance_minor > 0 && i.due_date < today && i.status !== "paid" && i.status !== "void",
  ).length;

  const monthAllocs = (payments ?? []) as unknown as {
    amount_minor: number;
    invoices: { subtotal_minor: number; total_minor: number } | null;
  }[];
  const invoiceNetMonth = monthAllocs.reduce((s, a) => {
    const inv = a.invoices;
    const ratio = inv && inv.total_minor > 0 ? inv.subtotal_minor / inv.total_minor : 1;
    return s + Math.round((a.amount_minor ?? 0) * ratio);
  }, 0);
  const incomeMonth = invoiceNetMonth + (qsRows ?? []).reduce((s, v) => s + netOfTaxInclusive(v.amount_minor ?? 0, v.tax_rate_bps), 0);
  // ¿Hubo IVA este mes? (facturas con impuesto o ventas rápidas con tasa). Si no,
  // no etiquetamos "sin IVA" para no confundir a negocios que no cobran IVA.
  const invoiceGrossMonth = monthAllocs.reduce((s, a) => s + (a.amount_minor ?? 0), 0);
  const qsTaxMonth = (qsRows ?? []).reduce((s, v) => s + ((v.amount_minor ?? 0) - netOfTaxInclusive(v.amount_minor ?? 0, v.tax_rate_bps)), 0);
  const hasTaxMonth = invoiceGrossMonth - invoiceNetMonth > 0 || qsTaxMonth > 0;
  const expenseMonth = (expenses ?? []).reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const profitMonth = incomeMonth - expenseMonth;
  const cashTotal = (accounts ?? []).reduce((s, a) => s + (a.current_balance_minor ?? 0), 0);
  const [compras, activation, { data: acadProgress }] = await Promise.all([
    getPurchasesOverview(),
    getActivation(org?.business_type),
    supabase.from("academy_progress").select("kind, item_slug"),
  ]);
  const hideActivation = (await cookies()).get("zentro_hide_activation")?.value === "1";

  const acadPassed = new Set((acadProgress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const acadCerts = (acadProgress ?? []).filter((p) => p.kind === "certification").length;
  const learn = learnSummary(acadPassed, activation.data, acadCerts);
  const learnPct = learn.scenariosTotal ? Math.round((learn.scenariosPassed / learn.scenariosTotal) * 100) : 0;

  // Operación de hoy
  const taskList = (tasks ?? []) as { due_date: string | null; status: string }[];
  const tasksOverdue = taskList.filter((t) => t.due_date && t.due_date < today).length;
  const tasksToday = taskList.filter((t) => t.due_date === today).length;
  const tasksPending = taskList.length;
  const oppList = (opps ?? []) as unknown as { amount_minor: number; stages: { probability_bps: number } | null }[];
  const pipelineValue = oppList.reduce((s, o) => s + Math.round((o.amount_minor * (o.stages?.probability_bps ?? 0)) / 10000), 0);

  // Organización recién creada y sin datos: evitar abrumar con tarjetas en cero.
  const isNewOrg =
    (customersCount ?? 0) === 0 && inv.length === 0 && incomeMonth === 0 && expenseMonth === 0 &&
    cashTotal === 0 && taskList.length === 0 && oppList.length === 0 && (projectsCount ?? 0) === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">¿Qué está pasando en tu negocio, {org?.name}?</p>

      {/* Activación: guía de primeros pasos (desaparece al completar o al ocultar) */}
      {activation.pct < 100 && !hideActivation && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Pon a punto tu Zentro</p>
              <p className="text-sm text-slate-600">Vas {activation.pct}% — {activation.doneCount} de {activation.total} pasos para arrancar.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <form action={dismissActivation}>
                <button className="rounded-lg px-2 py-2 text-xs text-slate-500 hover:bg-white" title="No mostrar más (sigue disponible en el Centro de Orientación)">Ocultar</button>
              </form>
              <Link href="/guide" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Centro de Orientación →
              </Link>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${activation.pct}%` }} />
          </div>
          {activation.suggestions[0] && (
            <Link href={activation.suggestions[0].href} className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-white p-3 hover:shadow-sm">
              <span>
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-600">Tu siguiente paso</span>
                <span className="block text-sm font-medium text-slate-900">{activation.suggestions[0].title}</span>
              </span>
              <span className="ml-3 shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white">{activation.suggestions[0].cta}</span>
            </Link>
          )}
        </div>
      )}

      {isNewOrg && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-semibold text-slate-900">¡Bienvenido a Zentro, {org?.name}!</p>
          <p className="mt-1 text-sm text-slate-500">
            Aquí verás el dinero, las ventas y los pendientes de tu negocio. Por ahora está vacío: da tu primer paso y los números aparecerán solos.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/quick-sale" className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              Registrar mi primera venta →
            </Link>
            <Link href="/guide" className="inline-block rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Ver el Centro de Orientación
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">Anota una venta de contado en segundos y verás cómo se mueven tus números.</p>
        </div>
      )}

      {/* Dinero del mes: ¿gano o pierdo? */}
      {!isNewOrg && (
      <>
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Este mes (cobrado vs. gastado)
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos cobrados" value={formatMoney(incomeMonth, currency)} tone="good" hint={hasTaxMonth ? "Cobrado este mes, sin IVA" : "Cobrado este mes"} />
        <Card title="Gastos" value={formatMoney(expenseMonth, currency)} tone="bad" hint="Salidas registradas este mes" />
        <Card
          title="Utilidad del mes"
          value={formatMoney(profitMonth, currency)}
          tone={profitMonth >= 0 ? "good" : "bad"}
          hint={profitMonth >= 0 ? "Vas ganando 🎉" : "Vas en pérdida ⚠️"}
        />
      </div>

      {/* Operación */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Pendientes</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Dinero en cuentas" value={formatMoney(cashTotal, currency)} hint="Bancos + efectivo" />
        <Card title="Por cobrar" value={formatMoney(outstanding, currency)} hint="Saldo de facturas abiertas" />
        <Card title="Facturas vencidas" value={String(overdueCount)} hint="Requieren cobranza" />
        {compras.count > 0 && (
          <Card title="Capital en mercancía" value={formatMoney(compras.capitalEnMercancia, currency)} hint="Compras por recuperar" />
        )}
        <Card title="Clientes" value={String(customersCount ?? 0)} />
      </div>

      {/* Operación de hoy */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Operación de hoy</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a href="/tasks" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Tareas vencidas</p>
          <p className={`mt-2 text-2xl font-bold ${tasksOverdue > 0 ? "text-red-600" : "text-slate-900"}`}>{tasksOverdue}</p>
          <p className="mt-1 text-xs text-slate-400">{tasksToday} para hoy · {tasksPending} pendientes</p>
        </a>
        <a href="/sales" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Ventas en proceso</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{oppList.length}</p>
          <p className="mt-1 text-xs text-slate-400">≈ {formatMoney(pipelineValue, currency)} probable</p>
        </a>
        <a href="/projects" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Proyectos activos</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{projectsCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">En curso o planeación</p>
        </a>
        <a href="/calendar" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Agenda</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">📅</p>
          <p className="mt-1 text-xs text-slate-400">Ver calendario</p>
        </a>
      </div>

      </>
      )}

      {/* Tu aprendizaje (Academia) */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Tu aprendizaje</h2>
      <a href="/academy" className="mt-2 block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Academia Zentro</p>
            <p className="text-xs text-slate-500">{learn.scenariosPassed}/{learn.scenariosTotal} desafíos · {learn.routesComplete}/{learn.routesTotal} rutas · {learn.certsEarned} credencial(es)</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-emerald-600">{learnPct}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${learnPct}%` }} />
        </div>
      </a>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <a href="/priorities" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
          Ver qué hacer hoy →
        </a>
        <a href="/cashflow" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
          Flujo de caja
        </a>
        <a href="/sales" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
          Embudo de ventas
        </a>
      </div>
    </div>
  );
}
