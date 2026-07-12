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
import { StatTile } from "@/components/charts/StatTile";
import { ChartCard, ChartEmpty, TwinTable } from "@/components/charts/ChartCard";
import { MoneyColumns, type MonthMoney } from "@/components/charts/MoneyColumns";
import { ProfitColumns } from "@/components/charts/ProfitColumns";
import { TopBars, type TopBarRow } from "@/components/charts/TopBars";
import { ReceivablesBar } from "@/components/charts/ReceivablesBar";
import { CHART } from "@/components/charts/theme";

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

/** Agrupa y suma en un Map; devuelve el top-N como filas de barra. */
function topN(map: Map<string, number>, n: number): TopBarRow[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export default async function DashboardPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthStart = `${month}-01`;
  const nowD = new Date();
  const prevMonthStart = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - 1, 1))
    .toISOString()
    .slice(0, 10);

  const today = new Date().toISOString().slice(0, 10);
  const dayOfMonth = today.slice(8, 10);

  // Últimos 6 meses (para las gráficas de evolución) y 90 días (rankings).
  const fmtMonth = new Intl.DateTimeFormat("es", { month: "short", timeZone: "UTC" });
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - i, 1));
    months.push({ key: d.toISOString().slice(0, 7), label: fmtMonth.format(d).replace(".", "") });
  }
  const sixStart = `${months[0].key}-01`;
  const d90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  // Todo el tablero en UNA sola tanda paralela.
  const [
    { count: customersCount }, { data: invoices }, { data: allocRows }, { data: expenses }, { data: accounts },
    { data: tasks }, { data: opps }, { count: projectsCount }, { data: qsRows },
    compras, activation, { data: acadProgress }, { data: payRows }, { data: itemRows },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("invoices").select("balance_minor, status, due_date"),
    // Cobrado NETO de IVA: asignaciones de pago proporcionales al subtotal de su factura.
    supabase
      .from("payment_allocations")
      .select("amount_minor, payments!inner(paid_at), invoices(subtotal_minor, total_minor)")
      .gte("payments.paid_at", sixStart),
    supabase.from("expenses").select("amount_minor, expense_date, category").gte("expense_date", sixStart),
    supabase.from("accounts").select("current_balance_minor").eq("is_active", true),
    supabase.from("tasks").select("due_date, status").not("status", "in", "(done,cancelled)"),
    supabase.from("opportunities").select("amount_minor, stages(probability_bps)").eq("status", "open"),
    supabase.from("projects").select("*", { count: "exact", head: true }).in("status", ["planning", "active", "on_hold"]),
    supabase
      .from("quick_sales")
      .select("amount_minor, tax_rate_bps, sold_at, product_id, products(name)")
      .gte("sold_at", sixStart),
    getPurchasesOverview(),
    getActivation(org?.business_type),
    supabase.from("academy_progress").select("kind, item_slug"),
    // Rankings 90 días: quién paga y qué se vende.
    supabase.from("payments").select("amount_minor, paid_at, customers(legal_name)").gte("paid_at", d90),
    supabase
      .from("invoice_items")
      .select("line_total_minor, products(name), invoices!inner(issue_date, status)")
      .not("product_id", "is", null)
      .gte("invoices.issue_date", d90),
  ]);

  const inv = invoices ?? [];
  const openInvoices = inv.filter((i) => i.status !== "paid" && i.status !== "void" && (i.balance_minor ?? 0) > 0);
  const outstanding = openInvoices.reduce((s, i) => s + (i.balance_minor ?? 0), 0);
  const overdueCount = openInvoices.filter((i) => i.due_date < today).length;

  const allAllocs = (allocRows ?? []) as unknown as {
    amount_minor: number;
    payments: { paid_at: string } | null;
    invoices: { subtotal_minor: number; total_minor: number } | null;
  }[];
  const netOfAlloc = (a: (typeof allAllocs)[number]) => {
    const i = a.invoices;
    const ratio = i && i.total_minor > 0 ? i.subtotal_minor / i.total_minor : 1;
    return Math.round((a.amount_minor ?? 0) * ratio);
  };
  const monthAllocs = allAllocs.filter((a) => (a.payments?.paid_at ?? "") >= monthStart);
  // Mes pasado "a esta misma fecha": comparar peras con peras.
  const prevAllocs = allAllocs.filter((a) => {
    const d = a.payments?.paid_at ?? "";
    return d >= prevMonthStart && d < monthStart && d.slice(8, 10) <= dayOfMonth;
  });
  const invoiceNetMonth = monthAllocs.reduce((s, a) => s + netOfAlloc(a), 0);

  const allQs = (qsRows ?? []) as unknown as {
    amount_minor: number;
    tax_rate_bps: number;
    sold_at: string;
    product_id: string | null;
    products: { name: string } | null;
  }[];
  const netOfQs = (v: (typeof allQs)[number]) => netOfTaxInclusive(v.amount_minor ?? 0, v.tax_rate_bps);
  const monthQs = allQs.filter((v) => v.sold_at >= monthStart);
  const prevQs = allQs.filter((v) => v.sold_at >= prevMonthStart && v.sold_at < monthStart && v.sold_at.slice(8, 10) <= dayOfMonth);

  const incomeMonth = invoiceNetMonth + monthQs.reduce((s, v) => s + netOfQs(v), 0);
  const prevIncomeToDate = prevAllocs.reduce((s, a) => s + netOfAlloc(a), 0) + prevQs.reduce((s, v) => s + netOfQs(v), 0);
  const incomeDeltaPct =
    prevIncomeToDate > 0 ? Math.round(((incomeMonth - prevIncomeToDate) / prevIncomeToDate) * 100) : null;

  const invoiceGrossMonth = monthAllocs.reduce((s, a) => s + (a.amount_minor ?? 0), 0);
  const qsTaxMonth = monthQs.reduce((s, v) => s + ((v.amount_minor ?? 0) - netOfQs(v)), 0);
  const hasTaxMonth = invoiceGrossMonth - invoiceNetMonth > 0 || qsTaxMonth > 0;

  const allExp = (expenses ?? []) as { amount_minor: number; expense_date: string; category: string | null }[];
  const expenseMonth = allExp.filter((e) => e.expense_date >= monthStart).reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const profitMonth = incomeMonth - expenseMonth;
  const cashTotal = (accounts ?? []).reduce((s, a) => s + (a.current_balance_minor ?? 0), 0);
  const hideActivation = (await cookies()).get("zentro_hide_activation")?.value === "1";

  // ---- Series de 6 meses: entra vs. sale, y utilidad ----
  const byMonth = new Map(months.map((m) => [m.key, { ingresos: 0, gastos: 0 }]));
  for (const a of allAllocs) {
    const k = (a.payments?.paid_at ?? "").slice(0, 7);
    const b = byMonth.get(k);
    if (b) b.ingresos += netOfAlloc(a);
  }
  for (const v of allQs) {
    const b = byMonth.get(v.sold_at.slice(0, 7));
    if (b) b.ingresos += netOfQs(v);
  }
  for (const e of allExp) {
    const b = byMonth.get(e.expense_date.slice(0, 7));
    if (b) b.gastos += e.amount_minor ?? 0;
  }
  const moneySeries: MonthMoney[] = months.map((m) => ({ label: m.label, ...byMonth.get(m.key)! }));
  const profitSeries = moneySeries.map((m) => ({ label: m.label, utilidad: m.ingresos - m.gastos }));
  const hasSeries = moneySeries.some((m) => m.ingresos > 0 || m.gastos > 0);

  // ---- Sparkline: ingresos cobrados por semana, últimas 12 semanas ----
  const weeks = new Array<number>(12).fill(0);
  const nowT = Date.parse(`${today}T00:00:00Z`);
  const weekIdx = (d: string) => {
    const i = Math.floor((nowT - Date.parse(`${d}T00:00:00Z`)) / (7 * 86400000));
    return i >= 0 && i < 12 ? 11 - i : -1;
  };
  for (const a of allAllocs) {
    const i = weekIdx(a.payments?.paid_at ?? "");
    if (i >= 0) weeks[i] += netOfAlloc(a);
  }
  for (const v of allQs) {
    const i = weekIdx(v.sold_at);
    if (i >= 0) weeks[i] += netOfQs(v);
  }

  // ---- Estado de los cobros (facturas abiertas por urgencia) ----
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const bucket = (rows: typeof openInvoices) => ({
    total: rows.reduce((s, i) => s + (i.balance_minor ?? 0), 0),
    count: rows.length,
  });
  const receivables = {
    vencida: bucket(openInvoices.filter((i) => i.due_date < today)),
    porVencer: bucket(openInvoices.filter((i) => i.due_date >= today && i.due_date <= in7)),
    alDia: bucket(openInvoices.filter((i) => i.due_date > in7)),
  };

  // ---- Rankings 90 días ----
  const payList = (payRows ?? []) as unknown as { amount_minor: number; customers: { legal_name: string } | null }[];
  const custMap = new Map<string, number>();
  for (const p of payList) {
    const name = p.customers?.legal_name;
    if (name) custMap.set(name, (custMap.get(name) ?? 0) + (p.amount_minor ?? 0));
  }
  const topClientes = topN(custMap, 5);

  const itemList = (itemRows ?? []) as unknown as {
    line_total_minor: number;
    products: { name: string } | null;
    invoices: { issue_date: string; status: string } | null;
  }[];
  const prodMap = new Map<string, number>();
  for (const it of itemList) {
    const st = it.invoices?.status;
    if (!it.products?.name || st === "draft" || st === "void") continue;
    prodMap.set(it.products.name, (prodMap.get(it.products.name) ?? 0) + (it.line_total_minor ?? 0));
  }
  for (const v of allQs) {
    if (v.sold_at < d90 || !v.products?.name) continue;
    prodMap.set(v.products.name, (prodMap.get(v.products.name) ?? 0) + (v.amount_minor ?? 0));
  }
  const topProductos = topN(prodMap, 5);

  const catMap = new Map<string, number>();
  for (const e of allExp) {
    if (e.expense_date < d90) continue;
    const cat = e.category?.trim() || "Sin categoría";
    catMap.set(cat, (catMap.get(cat) ?? 0) + (e.amount_minor ?? 0));
  }
  const topCategorias = topN(catMap, 5);

  const acadPassed = new Set((acadProgress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const acadCerts = (acadProgress ?? []).filter((p) => p.kind === "certification").length;
  const learn = learnSummary(acadPassed, activation.data, acadCerts);
  const learnDone = learn.scenariosPassed + learn.actionsDone;
  const learnTotal = learn.scenariosTotal + learn.actionsTotal;
  const learnPct = learnTotal ? Math.round((learnDone / learnTotal) * 100) : 0;

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

      {!isNewOrg && (
      <>
      {/* KPIs del mes: la foto en 5 segundos */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Este mes (cobrado vs. gastado)
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Ingresos cobrados"
          value={formatMoney(incomeMonth, currency)}
          delta={incomeDeltaPct !== null ? `${incomeDeltaPct >= 0 ? "↑" : "↓"} ${Math.abs(incomeDeltaPct)}%` : undefined}
          deltaGood={(incomeDeltaPct ?? 0) >= 0}
          hint={(hasTaxMonth ? "Cobrado este mes, sin IVA" : "Cobrado este mes") + (incomeDeltaPct !== null ? " · vs mes pasado a esta fecha" : "")}
          spark={weeks}
        />
        <StatTile label="Gastos" value={formatMoney(expenseMonth, currency)} hint="Salidas registradas este mes" />
        <StatTile
          label="Utilidad del mes"
          value={formatMoney(profitMonth, currency)}
          delta={incomeMonth === 0 && expenseMonth === 0 ? undefined : profitMonth >= 0 ? "ganando 🎉" : "en pérdida ⚠️"}
          deltaGood={profitMonth >= 0}
          hint={incomeMonth === 0 && expenseMonth === 0 ? "Sin movimientos este mes todavía" : "Ingresos cobrados menos gastos"}
        />
        <StatTile label="Dinero en cuentas" value={formatMoney(cashTotal, currency)} hint="Bancos + efectivo" />
      </div>

      {/* Evolución: ¿crezco y gano? */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Así va tu negocio</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          question="¿Entra más de lo que sale?"
          period="Últimos 6 meses · cobrado real vs. gastos"
          table={
            hasSeries ? (
              <TwinTable
                headers={["Mes", "Ingresos", "Gastos"]}
                rows={moneySeries.map((m) => [m.label, formatMoney(m.ingresos, currency), formatMoney(m.gastos, currency)])}
              />
            ) : undefined
          }
        >
          {hasSeries ? (
            <MoneyColumns data={moneySeries} currency={currency} />
          ) : (
            <ChartEmpty
              message="Aún no hay movimientos para dibujar tu historia"
              hint="Registra ventas y gastos; esta gráfica cobra vida sola."
            />
          )}
        </ChartCard>

        <ChartCard
          question="¿Ganaste o perdiste cada mes?"
          period="Últimos 6 meses · utilidad = cobrado − gastado"
          table={
            hasSeries ? (
              <TwinTable
                headers={["Mes", "Utilidad"]}
                rows={profitSeries.map((m) => [m.label, `${m.utilidad < 0 ? "−" : ""}${formatMoney(Math.abs(m.utilidad), currency)}`])}
              />
            ) : undefined
          }
        >
          {hasSeries ? (
            <ProfitColumns data={profitSeries} currency={currency} />
          ) : (
            <ChartEmpty
              message="Sin datos de utilidad todavía"
              hint="Cuando registres cobros y gastos verás aquí tus meses en verde (o en rojo)."
            />
          )}
        </ChartCard>
      </div>

      {/* Dinero por cobrar + en qué se va el dinero */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          question="¿Cuánto te deben y cuánto peligra?"
          period="Facturas abiertas hoy, por urgencia"
          table={
            outstanding > 0 ? (
              <TwinTable
                headers={["Estado", "Monto", "Facturas"]}
                rows={[
                  ["Al día", formatMoney(receivables.alDia.total, currency), receivables.alDia.count],
                  ["Vence pronto (≤7 días)", formatMoney(receivables.porVencer.total, currency), receivables.porVencer.count],
                  ["Vencido", formatMoney(receivables.vencida.total, currency), receivables.vencida.count],
                ]}
              />
            ) : undefined
          }
        >
          {outstanding > 0 ? (
            <ReceivablesBar data={receivables} currency={currency} />
          ) : (
            <ChartEmpty
              message="No tienes facturas abiertas por cobrar"
              hint="Cuando emitas facturas, aquí verás cuáles están al día y cuáles peligran."
            />
          )}
        </ChartCard>

        <ChartCard
          question="¿En qué se va el dinero?"
          period="Gastos por categoría · últimos 90 días"
          table={
            topCategorias.length > 0 ? (
              <TwinTable
                headers={["Categoría", "Gastado"]}
                rows={topCategorias.map((c) => [c.name, formatMoney(c.value, currency)])}
              />
            ) : undefined
          }
        >
          {topCategorias.length > 0 ? (
            <TopBars data={topCategorias} currency={currency} color={CHART.out} />
          ) : (
            <ChartEmpty
              message="Sin gastos registrados en 90 días"
              hint="Anota tus gastos con categoría y verás a dónde se va cada peso."
            />
          )}
        </ChartCard>
      </div>

      {/* Rankings: a quién cuidar y qué empujar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          question="¿Quiénes son tus mejores clientes?"
          period="Cobrado por cliente · últimos 90 días"
          table={
            topClientes.length > 0 ? (
              <TwinTable
                headers={["Cliente", "Cobrado"]}
                rows={topClientes.map((c) => [c.name, formatMoney(c.value, currency)])}
              />
            ) : undefined
          }
        >
          {topClientes.length > 0 ? (
            <TopBars data={topClientes} currency={currency} color={CHART.in} />
          ) : (
            <ChartEmpty
              message="Aún no hay cobros de clientes en 90 días"
              hint="Registra pagos de facturas y sabrás a quién cuidar más."
            />
          )}
        </ChartCard>

        <ChartCard
          question="¿Qué es lo que más vendes?"
          period="Ingreso por producto · últimos 90 días"
          table={
            topProductos.length > 0 ? (
              <TwinTable
                headers={["Producto", "Vendido"]}
                rows={topProductos.map((p) => [p.name, formatMoney(p.value, currency)])}
              />
            ) : undefined
          }
        >
          {topProductos.length > 0 ? (
            <TopBars data={topProductos} currency={currency} color={CHART.in} />
          ) : (
            <ChartEmpty
              message="Sin ventas ligadas a productos todavía"
              hint="Elige el producto al registrar ventas y verás cuál es tu estrella."
            />
          )}
        </ChartCard>
      </div>

      {/* Pendientes */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Pendientes</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Por cobrar" value={formatMoney(outstanding, currency)} hint={overdueCount > 0 ? `${overdueCount} factura(s) vencida(s)` : "Saldo de facturas abiertas"} />
        {compras.count > 0 && (
          <Card title="Capital en mercancía" value={formatMoney(compras.capitalEnMercancia, currency)} hint="Compras por recuperar" />
        )}
        <Card title="Clientes" value={String(customersCount ?? 0)} />
      </div>

      {/* Operación de hoy */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Operación de hoy</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/tasks" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Tareas vencidas</p>
          <p className={`mt-2 text-2xl font-bold ${tasksOverdue > 0 ? "text-red-600" : "text-slate-900"}`}>{tasksOverdue}</p>
          <p className="mt-1 text-xs text-slate-400">{tasksToday} para hoy · {tasksPending} pendientes</p>
        </Link>
        <Link href="/sales" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Ventas en proceso</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{oppList.length}</p>
          <p className="mt-1 text-xs text-slate-400">≈ {formatMoney(pipelineValue, currency)} probable</p>
        </Link>
        <Link href="/projects" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Proyectos activos</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{projectsCount ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">En curso o planeación</p>
        </Link>
        <Link href="/calendar" className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
          <p className="text-sm text-slate-500">Agenda</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">📅</p>
          <p className="mt-1 text-xs text-slate-400">Ver calendario</p>
        </Link>
      </div>

      </>
      )}

      {/* Tu aprendizaje (Academia) */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Tu aprendizaje</h2>
      <Link href="/academy" className="mt-2 block rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Academia Zentro</p>
            <p className="text-xs text-slate-500">{learnDone}/{learnTotal} desafíos · {learn.routesComplete}/{learn.routesTotal} rutas · {learn.certsEarned} credencial(es)</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-emerald-600">{learnPct}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${learnPct}%` }} />
        </div>
      </Link>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/priorities" className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
          Ver qué hacer hoy →
        </Link>
        <Link href="/cashflow" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
          Flujo de caja
        </Link>
        <Link href="/sales" className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50">
          Embudo de ventas
        </Link>
      </div>
    </div>
  );
}
