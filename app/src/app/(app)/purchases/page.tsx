import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { computePurchase, type PItem } from "@/lib/purchases";
import { ModuleHelp } from "@/components/ModuleHelp";

export default async function PurchasesPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const [{ data: purchases }, { data: items }, { data: expenses }] = await Promise.all([
    supabase.from("purchases").select("*").order("purchase_date", { ascending: false }),
    supabase.from("purchase_items").select("id, purchase_id, name, category, sku, quantity, unit_cost_minor, sale_price_minor, units_sold"),
    supabase.from("purchase_expenses").select("purchase_id, amount_minor"),
  ]);

  const purs = purchases ?? [];
  const itemsByP = new Map<string, PItem[]>();
  for (const it of (items ?? []) as (PItem & { purchase_id: string })[]) {
    const arr = itemsByP.get(it.purchase_id) ?? [];
    arr.push(it);
    itemsByP.set(it.purchase_id, arr);
  }
  const expByP = new Map<string, number>();
  for (const e of (expenses ?? []) as { purchase_id: string; amount_minor: number }[]) {
    expByP.set(e.purchase_id, (expByP.get(e.purchase_id) ?? 0) + e.amount_minor);
  }

  const rows = purs.map((p) => {
    const c = computePurchase(itemsByP.get(p.id) ?? [], expByP.get(p.id) ?? 0, {
      min: p.margin_min_bps, target: p.margin_target_bps, max: p.margin_max_bps,
    });
    return { p, t: c.totals };
  });

  const totalInvertido = rows.reduce((s, r) => s + r.t.inversion, 0);
  const totalRecuperado = rows.reduce((s, r) => s + r.t.recuperado, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compras</h1>
          <p className="mt-1 text-sm text-slate-500">Tus compras para revender: inversión, recuperación y ganancia.</p>
        </div>
        <Link href="/purchases/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ Nueva compra</Link>
      </div>
      <div className="mt-4"><ModuleHelp slug="purchases" /></div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Invertido (todas)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalInvertido, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Recuperado (todas)</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{formatMoney(totalRecuperado, currency)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no registras compras. Crea tu primera (ej. "Compra Shein Junio").</p>
          <Link href="/purchases/new" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Crear la primera</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map(({ p, t }) => (
            <Link key={p.id} href={`/purchases/${p.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{p.name}</p>
                {t.recovered ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Recuperada</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t.pctRecuperado}% recuperado</span>
                )}
              </div>
              <p className="text-xs text-slate-400">{p.purchase_date}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><p className="text-xs text-slate-400">Invertido</p><p className="font-medium text-slate-900">{formatMoney(t.inversion, currency)}</p></div>
                <div><p className="text-xs text-slate-400">Recuperado</p><p className="font-medium text-green-700">{formatMoney(t.recuperado, currency)}</p></div>
                <div><p className="text-xs text-slate-400">ROI</p><p className={`font-medium ${t.roi >= 0 ? "text-slate-900" : "text-red-600"}`}>{t.roi}%</p></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
