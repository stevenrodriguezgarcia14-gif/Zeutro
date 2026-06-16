import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney, fromMinor } from "@/lib/money";
import { computePurchase, type PItem } from "@/lib/purchases";
import { addExpense, deleteExpense, addItem, updateItem, deleteItem, updateMargins, setPurchaseStatus } from "../actions";
import { sendPurchaseItemToInventory } from "@/app/(app)/inventory/actions";

const EXP_TYPES: { v: string; l: string }[] = [
  { v: "envio", l: "Envío" },
  { v: "casillero", l: "Casillero" },
  { v: "transporte", l: "Transporte" },
  { v: "aduanas", l: "Aduanas" },
  { v: "impuestos", l: "Impuestos" },
  { v: "comision_bancaria", l: "Comisión bancaria" },
  { v: "comision_plataforma", l: "Comisión de plataforma" },
  { v: "other", l: "Otro" },
];
const EXP_LABEL: Record<string, string> = Object.fromEntries(EXP_TYPES.map((t) => [t.v, t.l]));

function Card({ title, value, tone = "default" }: { title: string; value: string; tone?: "default" | "good" | "bad" }) {
  const cls = tone === "good" ? "text-green-600" : tone === "bad" ? "text-red-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className={`mt-1 text-lg font-bold ${cls}`}>{value}</p>
    </div>
  );
}

export default async function PurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const { data: purchase } = await supabase.from("purchases").select("*").eq("id", id).single();
  if (!purchase) notFound();

  const [{ data: items }, { data: expenses }] = await Promise.all([
    supabase.from("purchase_items").select("id, name, category, sku, quantity, unit_cost_minor, sale_price_minor, units_sold").eq("purchase_id", id).order("created_at"),
    supabase.from("purchase_expenses").select("id, type, description, amount_minor").eq("purchase_id", id).order("created_at"),
  ]);

  const expList = (expenses ?? []) as { id: string; type: string; description: string | null; amount_minor: number }[];
  const totalExpenses = expList.reduce((s, e) => s + e.amount_minor, 0);
  const { items: pi, totals } = computePurchase((items ?? []) as PItem[], totalExpenses, {
    min: purchase.margin_min_bps, target: purchase.margin_target_bps, max: purchase.margin_max_bps,
  });

  const alerts: string[] = [];
  if (!totals.recovered && totals.inversion > 0) alerts.push(`Compra no recuperada: te faltan ${formatMoney(totals.pendiente, currency)} por recuperar.`);
  if (pi.some((it) => it.noPrice)) alerts.push("Hay productos sin precio de venta.");
  if (pi.some((it) => it.negativeMargin)) alerts.push("Hay productos con precio por debajo del costo real (margen negativo).");
  if (pi.some((it) => it.noMovement && !it.noPrice)) alerts.push("Hay productos con precio pero sin ventas registradas.");

  return (
    <div>
      <Link href="/purchases" className="text-sm text-slate-500 hover:underline">← Compras</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{purchase.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{purchase.purchase_date}{purchase.description ? ` · ${purchase.description}` : ""}</p>
        </div>
        <form action={setPurchaseStatus}>
          <input type="hidden" name="purchase_id" value={purchase.id} />
          <input type="hidden" name="status" value={purchase.status === "open" ? "closed" : "open"} />
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {purchase.status === "open" ? "Cerrar compra" : "Reabrir"}
          </button>
        </form>
      </div>

      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Guardado.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Dashboard de la compra */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card title="Invertido" value={formatMoney(totals.inversion, currency)} />
        <Card title="Recuperado" value={formatMoney(totals.recuperado, currency)} tone="good" />
        <Card title="Pendiente" value={formatMoney(totals.pendiente, currency)} tone={totals.pendiente > 0 ? "bad" : "good"} />
        <Card title="Ganancia" value={formatMoney(totals.ganancia, currency)} tone={totals.ganancia >= 0 ? "good" : "bad"} />
        <Card title="ROI" value={`${totals.roi}%`} tone={totals.roi >= 0 ? "good" : "bad"} />
        <Card title="Vendidos / restan" value={`${totals.unitsSold} / ${totals.unitsLeft}`} />
      </div>
      <div className="mt-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-green-600" style={{ width: `${Math.min(totals.pctRecuperado, 100)}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-400">{totals.pctRecuperado}% de la inversión recuperada</p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-1 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {alerts.map((a, i) => <p key={i}>⚠️ {a}</p>)}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gastos asociados */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Gastos asociados</h2>
          <p className="text-xs text-slate-400">Envío, aduanas, comisiones… se reparten entre los productos por su valor.</p>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {expList.length === 0 && <li className="py-2 text-slate-500">Sin gastos.</li>}
            {expList.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <span className="text-slate-700">{EXP_LABEL[e.type] ?? e.type}{e.description ? ` · ${e.description}` : ""}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-900">{formatMoney(e.amount_minor, currency)}</span>
                  <form action={deleteExpense}><input type="hidden" name="purchase_id" value={purchase.id} /><input type="hidden" name="expense_id" value={e.id} /><button className="text-slate-400 hover:text-red-600">✕</button></form>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
            <span className="text-slate-600">Total gastos</span><span className="text-slate-900">{formatMoney(totalExpenses, currency)}</span>
          </div>
          <form action={addExpense} className="mt-3 space-y-2 text-sm">
            <input type="hidden" name="purchase_id" value={purchase.id} />
            <select name="type" defaultValue="envio" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-900">
              {EXP_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
            <input name="description" placeholder="Detalle (opcional)" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-900" />
            <input name="amount" type="number" step="0.01" min="0" placeholder="Monto" className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
            <button className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">+ Agregar gasto</button>
          </form>

          {/* Márgenes */}
          <form action={updateMargins} className="mt-5 border-t border-slate-200 pt-4 text-sm">
            <input type="hidden" name="purchase_id" value={purchase.id} />
            <p className="font-medium text-slate-700">Márgenes para precios sugeridos (%)</p>
            <div className="mt-2 flex gap-2">
              <label className="flex-1 text-xs text-slate-500">Mín<input name="margin_min" type="number" defaultValue={Math.round(purchase.margin_min_bps / 100)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm outline-none focus:border-slate-900" /></label>
              <label className="flex-1 text-xs text-slate-500">Recom.<input name="margin_target" type="number" defaultValue={Math.round(purchase.margin_target_bps / 100)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm outline-none focus:border-slate-900" /></label>
              <label className="flex-1 text-xs text-slate-500">Máx<input name="margin_max" type="number" defaultValue={Math.round(purchase.margin_max_bps / 100)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm outline-none focus:border-slate-900" /></label>
            </div>
            <button className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">Actualizar márgenes</button>
          </form>
        </section>

        {/* Productos */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Productos de la compra</h2>
            <form action={addItem} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-end">
              <input type="hidden" name="purchase_id" value={purchase.id} />
              <div><label className="block text-xs text-slate-500">Producto</label><input name="name" placeholder="Nombre" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-900" /></div>
              <div><label className="block text-xs text-slate-500">Cantidad</label><input name="quantity" type="number" step="0.001" min="0" defaultValue="1" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" /></div>
              <div><label className="block text-xs text-slate-500">Costo unit.</label><input name="unit_cost" type="number" step="0.01" min="0" placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" /></div>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">+ Agregar</button>
            </form>
          </div>

          <div className="mt-4 space-y-3">
            {pi.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">Agrega los productos que compraste.</p>}
            {pi.map((it) => (
              <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{it.name}</p>
                    <p className="text-xs text-slate-400">{it.quantity} u × {formatMoney(it.unit_cost_minor, currency)} + envío {formatMoney(it.alloc, currency)}</p>
                  </div>
                  <form action={deleteItem}><input type="hidden" name="purchase_id" value={purchase.id} /><input type="hidden" name="item_id" value={it.id} /><button className="text-slate-400 hover:text-red-600">✕</button></form>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div><p className="text-xs text-slate-400">Costo real/u</p><p className="font-medium text-slate-900">{formatMoney(it.realUnitCost, currency)}</p></div>
                  <div><p className="text-xs text-slate-400">Mín</p><p className="text-slate-700">{formatMoney(it.pMin.price, currency)}</p></div>
                  <div><p className="text-xs text-slate-400">Recomendado</p><p className="font-semibold text-green-700">{formatMoney(it.pRec.price, currency)}</p></div>
                  <div><p className="text-xs text-slate-400">Premium</p><p className="text-slate-700">{formatMoney(it.pMax.price, currency)}</p></div>
                </div>
                {it.negativeMargin && <p className="mt-1 text-xs text-red-600">⚠️ Tu precio está por debajo del costo real.</p>}
                <form action={updateItem} className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3 text-sm">
                  <input type="hidden" name="purchase_id" value={purchase.id} />
                  <input type="hidden" name="item_id" value={it.id} />
                  <div><label className="block text-xs text-slate-500">Precio de venta</label><input name="sale_price" type="number" step="0.01" min="0" defaultValue={fromMinor(it.sale_price_minor)} className="mt-1 w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" /></div>
                  <div><label className="block text-xs text-slate-500">Vendidas</label><input name="units_sold" type="number" step="0.001" min="0" defaultValue={it.units_sold} className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" /></div>
                  <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">Guardar</button>
                  <span className="ml-auto text-xs text-slate-500">Ganancia: <b className={it.profit >= 0 ? "text-green-700" : "text-red-600"}>{formatMoney(it.profit, currency)}</b></span>
                </form>
                <form action={sendPurchaseItemToInventory} className="mt-2">
                  <input type="hidden" name="purchase_id" value={purchase.id} />
                  <input type="hidden" name="item_id" value={it.id} />
                  <button className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline">📦 Agregar al inventario (catálogo)</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
