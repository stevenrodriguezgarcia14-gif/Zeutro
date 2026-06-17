import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { getPurchasesOverview } from "@/lib/purchasesOverview";
import { ModuleHelp } from "@/components/ModuleHelp";

export default async function CashflowPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const horizonDate = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

  const [{ data: accounts }, { data: invoices }, { data: opps }, { data: expenses }] = await Promise.all([
    supabase.from("accounts").select("current_balance_minor").eq("is_active", true),
    supabase.from("invoices").select("balance_minor, due_date").in("status", ["issued", "partially_paid", "overdue"]).gt("balance_minor", 0),
    supabase.from("opportunities").select("amount_minor, expected_close_date, stages(probability_bps)").eq("status", "open"),
    supabase.from("expenses").select("amount_minor, expense_date").eq("payment_status", "pending"),
  ]);

  const saldo = (accounts ?? []).reduce((s, a) => s + (a.current_balance_minor ?? 0), 0);
  const invs = (invoices ?? []) as { balance_minor: number; due_date: string }[];
  const oppList = (opps ?? []) as unknown as { amount_minor: number; expected_close_date: string | null; stages: { probability_bps: number } | null }[];
  const exps = (expenses ?? []) as { amount_minor: number; expense_date: string }[];

  const porCobrar = invs.reduce((s, i) => s + i.balance_minor, 0);
  const pipelinePond = oppList.reduce((s, o) => s + Math.round((o.amount_minor * (o.stages?.probability_bps ?? 0)) / 10000), 0);
  const porPagar = exps.reduce((s, e) => s + e.amount_minor, 0);
  const compras = await getPurchasesOverview();

  function projection(days: number) {
    const limit = horizonDate(days);
    const inInv = invs.filter((i) => i.due_date <= limit).reduce((s, i) => s + i.balance_minor, 0);
    const inPipe = oppList
      .filter((o) => o.expected_close_date && o.expected_close_date <= limit)
      .reduce((s, o) => s + Math.round((o.amount_minor * (o.stages?.probability_bps ?? 0)) / 10000), 0);
    const out = exps.filter((e) => e.expense_date <= limit).reduce((s, e) => s + e.amount_minor, 0);
    return saldo + inInv + inPipe - out;
  }

  const p30 = projection(30);
  const p60 = projection(60);
  const p90 = projection(90);
  const anyNegative = [p30, p60, p90].some((p) => p < 0);

  function Card({ title, value }: { title: string; value: number }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-2 text-2xl font-bold ${value < 0 ? "text-red-600" : "text-slate-900"}`}>{formatMoney(value, currency)}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Flujo de caja</h1>
      <p className="mt-1 text-sm text-slate-500">Cuánto dinero tendrás, sumando cobros esperados y restando pagos pendientes.</p>
      <div className="mt-4"><ModuleHelp slug="cashflow" /></div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Saldo proyectado</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card title="Hoy (en cuentas)" value={saldo} />
        <Card title="En 30 días" value={p30} />
        <Card title="En 60 días" value={p60} />
        <Card title="En 90 días" value={p90} />
      </div>

      {anyNegative && (
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          ⚠️ Tu proyección llega a quedar en negativo. Acelera cobros (mira Cobranzas) o pospón pagos para no quedarte sin caja.
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">¿De dónde sale la proyección?</h2>
      <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">Saldo actual en cuentas</span><b className="text-slate-900">{formatMoney(saldo, currency)}</b></div>
        <div className="flex justify-between"><span className="text-slate-600">+ Por cobrar (facturas)</span><b className="text-green-700">{formatMoney(porCobrar, currency)}</b></div>
        <div className="flex justify-between"><span className="text-slate-600">+ Ventas probables (embudo ponderado)</span><b className="text-green-700">{formatMoney(pipelinePond, currency)}</b></div>
        <div className="flex justify-between"><span className="text-slate-600">− Por pagar (gastos pendientes)</span><b className="text-red-700">{formatMoney(porPagar, currency)}</b></div>
      </div>
      {compras.count > 0 && (
        <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Inventario de compras por vender (potencial)</span>
            <b className="text-slate-500">{formatMoney(compras.valorPorVender, currency)}</b>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Informativo: es dinero potencial si vendes toda tu mercancía. <b>No</b> está incluido en la proyección de arriba porque no tiene fecha de venta.
          </p>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Nota: asumimos que cada factura se cobra en su fecha de vencimiento y que las ventas del embudo entran en su fecha de
        cierre estimada, ajustadas por la probabilidad de cada etapa. Si una venta del embudo ya la facturaste, ciérrala como
        ganada para no contarla dos veces.
      </p>
    </div>
  );
}
