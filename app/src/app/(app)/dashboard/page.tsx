import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

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

  const [{ count: customersCount }, { data: invoices }, { data: payments }, { data: expenses }, { data: accounts }] =
    await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("balance_minor, status, due_date"),
      supabase.from("payments").select("amount_minor, paid_at").gte("paid_at", monthStart),
      supabase.from("expenses").select("amount_minor, expense_date").gte("expense_date", monthStart),
      supabase.from("accounts").select("current_balance_minor").eq("is_active", true),
    ]);

  const today = new Date().toISOString().slice(0, 10);
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">¿Qué está pasando en tu negocio, {org?.name}?</p>

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
        <Card title="Clientes" value={String(customersCount ?? 0)} />
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
