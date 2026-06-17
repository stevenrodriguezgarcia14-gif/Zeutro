import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { getPurchasesOverview } from "@/lib/purchasesOverview";
import { ModuleHelp } from "@/components/ModuleHelp";

function Card({ title, value, tone = "default", hint }: { title: string; value: string; tone?: "default" | "good" | "bad"; hint?: string }) {
  const cls = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${cls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function ProfitabilityPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const monthStart = new Date().toISOString().slice(0, 7) + "-01";

  const [{ data: payments }, { data: expenses }, { data: items }, { data: products }] = await Promise.all([
    supabase.from("payments").select("amount_minor, paid_at"),
    supabase.from("expenses").select("amount_minor, expense_date, category"),
    supabase.from("invoice_items").select("product_id, quantity, unit_price_minor, invoices!inner(status)"),
    supabase.from("products").select("id, name, cost_price_minor"),
  ]);

  const compras = await getPurchasesOverview();
  const pays = payments ?? [];
  const exps = expenses ?? [];

  // Rentabilidad por producto: ventas (facturas no borrador/anuladas) × costo del producto
  type ProdRow = { id: string; name: string; cost: number; units: number; revenue: number };
  const prodMap = new Map<string, ProdRow>();
  for (const p of products ?? []) {
    prodMap.set(p.id, { id: p.id, name: p.name, cost: p.cost_price_minor ?? 0, units: 0, revenue: 0 });
  }
  for (const it of (items ?? []) as unknown as {
    product_id: string | null;
    quantity: number;
    unit_price_minor: number;
    invoices: { status: string } | null;
  }[]) {
    const status = it.invoices?.status;
    if (!it.product_id || !status || status === "draft" || status === "void") continue;
    const row = prodMap.get(it.product_id);
    if (!row) continue;
    row.units += Number(it.quantity) || 0;
    row.revenue += Math.round((Number(it.quantity) || 0) * (it.unit_price_minor ?? 0));
  }
  const prodRows = [...prodMap.values()]
    .filter((r) => r.units > 0)
    .map((r) => {
      const cost = Math.round(r.units * r.cost);
      const profit = r.revenue - cost;
      const margin = r.revenue > 0 ? Math.round((profit / r.revenue) * 100) : 0;
      return { ...r, totalCost: cost, profit, margin };
    })
    .sort((a, b) => b.profit - a.profit);

  // Compras para reventa es su propio centro de ganancia (se vende registrando
  // unidades vendidas, no por factura), así que lo integramos al total sin doble
  // conteo: + ingreso recuperado y + costo de la mercancía vendida.
  const comprasCostoVendido = Math.max(0, compras.recuperado - compras.ganancia);
  const incomeTotal = pays.reduce((s, p) => s + (p.amount_minor ?? 0), 0) + compras.recuperado;
  const expenseTotal = exps.reduce((s, e) => s + (e.amount_minor ?? 0), 0) + comprasCostoVendido;
  const netTotal = incomeTotal - expenseTotal;

  const incomeMonth = pays.filter((p) => p.paid_at >= monthStart).reduce((s, p) => s + (p.amount_minor ?? 0), 0);
  const expenseMonth = exps.filter((e) => e.expense_date >= monthStart).reduce((s, e) => s + (e.amount_minor ?? 0), 0);
  const netMonth = incomeMonth - expenseMonth;

  // ¿En qué se va el dinero? (gastos por categoría)
  const byCat = new Map<string, number>();
  for (const e of exps) {
    const k = e.category?.trim() || "Sin categoría";
    byCat.set(k, (byCat.get(k) ?? 0) + (e.amount_minor ?? 0));
  }
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const recovered = netTotal >= 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rentabilidad</h1>
      <p className="mt-1 text-sm text-slate-500">Tu inversión, lo recuperado y tu ganancia real.</p>
      <div className="mt-4"><ModuleHelp slug="profitability" /></div>

      {/* Acumulado (todo el tiempo) */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-400">Desde el inicio</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos (cobrado)" value={formatMoney(incomeTotal, currency)} tone="good" hint="Cobrado en facturas + reventa de compras" />
        <Card title="Invertido / gastado" value={formatMoney(expenseTotal, currency)} tone="bad" hint="Gastos + costo de la mercancía vendida" />
        <Card title="Ganancia neta" value={formatMoney(netTotal, currency)} tone={netTotal >= 0 ? "good" : "bad"} hint="Ingresos − gastos (incluye reventa)" />
      </div>

      {/* Estado de recuperación */}
      <div className={`mt-4 rounded-2xl border p-5 ${recovered ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
        {recovered ? (
          <p className="text-green-800">
            ✅ Ya recuperaste todo lo que invertiste y llevas <b>{formatMoney(netTotal, currency)}</b> de ganancia limpia acumulada.
          </p>
        ) : (
          <p className="text-amber-800">
            ⏳ Aún no recuperas tu inversión: te faltan <b>{formatMoney(Math.abs(netTotal), currency)}</b> por cobrar para igualar lo invertido.
          </p>
        )}
      </div>

      {/* Compras para reventa */}
      {compras.count > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Compras para reventa</h2>
          <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card title="Invertido" value={formatMoney(compras.invertido, currency)} />
            <Card title="Recuperado" value={formatMoney(compras.recuperado, currency)} tone="good" />
            <Card title="Ganancia" value={formatMoney(compras.ganancia, currency)} tone={compras.ganancia >= 0 ? "good" : "bad"} />
            <Card title="ROI" value={`${compras.roi}%`} tone={compras.roi >= 0 ? "good" : "bad"} />
            <Card title="Capital en mercancía" value={formatMoney(compras.capitalEnMercancia, currency)} hint="Invertido aún no recuperado" />
            <Card title="Sin vender" value={`${compras.mercanciaSinVender} u`} hint="Unidades en stock" />
          </div>
        </>
      )}

      {/* Rentabilidad por producto */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Rentabilidad por producto</h2>
      <p className="mt-1 text-xs text-slate-400">
        Según lo vendido en facturas (sin contar borradores) y el costo configurado de cada producto. Te muestra cuáles dejan
        más dinero, no solo cuáles se venden más.
      </p>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {prodRows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Aún no hay ventas con productos para analizar. Emite facturas eligiendo productos del catálogo y aquí verás cuáles
            son rentables.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium text-right">Vendidas</th>
                <th className="px-4 py-2 font-medium text-right">Ingreso</th>
                <th className="px-4 py-2 font-medium text-right">Costo</th>
                <th className="px-4 py-2 font-medium text-right">Ganancia</th>
                <th className="px-4 py-2 font-medium text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prodRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-slate-900">
                    {r.name}
                    {r.cost === 0 && (
                      <span className="ml-1 text-xs text-amber-600" title="Configura el costo de este producto para una ganancia real">
                        ⚠️ sin costo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{r.units}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{formatMoney(r.revenue, currency)}</td>
                  <td className="px-4 py-2 text-right text-slate-700">{formatMoney(r.totalCost, currency)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${r.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatMoney(r.profit, currency)}
                  </td>
                  <td className={`px-4 py-2 text-right ${r.profit >= 0 ? "text-slate-600" : "text-red-700"}`}>{r.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Este mes */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Este mes</h2>
      <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title="Ingresos del mes" value={formatMoney(incomeMonth, currency)} tone="good" />
        <Card title="Gastos del mes" value={formatMoney(expenseMonth, currency)} tone="bad" />
        <Card title="Utilidad del mes" value={formatMoney(netMonth, currency)} tone={netMonth >= 0 ? "good" : "bad"} />
      </div>

      {/* ¿En qué se va el dinero? */}
      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">¿En qué se va el dinero?</h2>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-5">
        {cats.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has registrado gastos.</p>
        ) : (
          <ul className="space-y-2">
            {cats.map(([cat, amount]) => {
              const pct = expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0;
              return (
                <li key={cat}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-900">{formatMoney(amount, currency)} <span className="text-slate-400">({pct}%)</span></span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-700" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Tip: registra tu inversión inicial (equipo, capital) como un <b>Gasto</b> (ej. categoría “Equipo” o
        “Inversión”) para que aquí se vea cuánto te falta recuperar.
      </p>
    </div>
  );
}
