import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { adjustStock } from "./actions";

type Prod = {
  id: string;
  name: string;
  sku: string | null;
  stock_qty: number;
  min_stock: number | null;
  sale_price_minor: number;
  track_inventory: boolean;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, sku, stock_qty, min_stock, sale_price_minor, track_inventory")
    .eq("type", "product")
    .order("name");

  const rows = (data ?? []) as Prod[];
  const lowStock = rows.filter((p) => p.min_stock != null && p.stock_qty <= p.min_stock);
  const stockValue = rows.reduce((s, p) => s + Math.round((p.stock_qty || 0) * (p.sale_price_minor || 0)), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Inventario</h1>
      <p className="mt-1 text-sm text-slate-500">Existencias de tus productos. El stock entra desde Compras o ajustes.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Productos</p><p className="mt-2 text-2xl font-bold text-slate-900">{rows.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Valor del inventario (a precio venta)</p><p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(stockValue, currency)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Bajo stock</p><p className="mt-2 text-2xl font-bold text-amber-600">{lowStock.length}</p></div>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Bajo stock: {lowStock.map((p) => p.name).join(", ")}. Conviene reabastecer.
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          No tienes productos físicos. Crea productos tipo "Producto" o envíalos desde una Compra.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Mín.</th>
                <th className="px-4 py-3 font-medium">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const low = p.min_stock != null && p.stock_qty <= p.min_stock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/products/${p.id}`} className="font-medium text-slate-900 hover:underline">{p.name}</Link>
                      {p.sku && <span className="ml-2 text-xs text-slate-400">{p.sku}</span>}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${low ? "text-amber-600" : "text-slate-900"}`}>{p.stock_qty}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{p.min_stock ?? "—"}</td>
                    <td className="px-4 py-3">
                      <form action={adjustStock} className="flex items-center gap-1">
                        <input type="hidden" name="product_id" value={p.id} />
                        <select name="direction" defaultValue="in" className="rounded-lg border border-slate-300 px-1.5 py-1 text-xs outline-none focus:border-slate-900">
                          <option value="in">Entra</option>
                          <option value="out">Sale</option>
                        </select>
                        <input name="qty" type="number" step="0.001" min="0" placeholder="cant." className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs outline-none focus:border-slate-900" />
                        <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">OK</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
