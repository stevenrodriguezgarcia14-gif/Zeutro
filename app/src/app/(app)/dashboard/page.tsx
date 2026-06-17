import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { getPurchasesOverview } from "@/lib/purchasesOverview";
import { getActivation } from "@/lib/activation";

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
  const [{ count: customersCount }, { data: invoices }, { data: payments }, { data: expenses }, { data: accounts }, { data: tasks }, { data: opps }, { count: projectsCount }] =
    await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("balance_minor, status, due_date"),
      supabase.from("payments").select("amount_minor, paid_at").gte("paid_at", monthStart),
      supabase.from("expenses").select("amount_minor, expense_date").gte("expense_date", monthStart),
      supabase.from("accounts").select("current_balance_minor").eq("is_active", true),
      supabase.from("tasks").select("due_date, status").not("status", "in", "(done,cancelled)"),
      supabase.from("opportunities").select("amount_minor, stages(probability_bps)").eq("status", "open"),
      supabase.from("projects").select("*", { count: "exact", head: true }).in("status", ["planning", "active", "on_hold"]),
    ]);

  const inv = invoices ?? [];
  const outstanding = inv
    .filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((s, i) => s + (i.balance_minor ?? 0), 0);
  const overdueCount = inv.filter(
    (i) => i.balance_minor > 0 && i.due_date < today && i.status !== "paid" && i.status !== "void",
  ).length;

  const incomeMonth = (payments ?? []).reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const expenseMonth = (expenses ?? []).reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const profitMonth = incomeMonth - expenseMonth;
  const cashTotal = (accounts ?? []).reduce((s, a) => s + (a.current_balance_minor ?? 0), 0);
  const [compras, activation] = await Promise.all([
    getPurchasesOverview(),
    getActivation(org?.business_type),
  ]);

  // Operación de hoy
  const taskList = (tasks ?? []) as { due_date: string | null; status: string }[];
  const tasksOverdue = taskList.filter((t) => t.due_date && t.due_date < today).length;
  const tasksToday = taskList.filter((t) => t.due_date === today).length;
  const tasksPending = taskList.length;
  const oppList = (opps ?? []) as unknown as { amount_minor: number; stages: { probability_bps: number } | null }[];
  const pipelineValue = oppList.reduce((s, o) => s + Math.round((o.amount_minor * (o.stages?.probability_bps ?? 0)) / 10000), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">¿Qué está pasando en tu negocio, {org?.name}?</p>

      {/* Activación: guía de primeros pasos (desaparece al completar) */}
      {activation.pct < 100 && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Pon a punto tu Zentro</p>
              <p className="text-sm text-slate-600">Vas {activation.pct}% — {activation.doneCount} de {activation.total} pasos para arrancar.</p>
            </div>
            <Link href="/guide" className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Centro de Orientación →
            </Link>
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

      {/* Dinero del mes: ¿gano o pierdo? */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Este mes (cobrado vs. gastado)
      </h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos cobrados" value={formatMoney(incomeMonth, currency)} tone="good" hint="Pagos recibidos este mes" />
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
