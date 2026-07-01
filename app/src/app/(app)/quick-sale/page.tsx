import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";
import { createQuickSale, deleteQuickSale } from "./actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { SubmitButton } from "@/components/SubmitButton";

const METHODS: Record<string, string> = { cash: "Efectivo", transfer: "Transferencia", card: "Tarjeta", check: "Cheque", gateway: "Pasarela", other: "Otro" };

export default async function QuickSalePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";

  const [{ data: sales }, { data: accounts }, { data: products }, { data: orgTax }] = await Promise.all([
    supabase.from("quick_sales").select("id, description, amount_minor, method, sold_at").order("sold_at", { ascending: false }).limit(50),
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
    supabase.from("products").select("id, name").eq("track_inventory", true).eq("is_active", true).order("name"),
    supabase.from("organizations").select("quick_sale_tax_bps").eq("id", org?.id ?? "").maybeSingle(),
  ]);
  const rows = sales ?? [];
  const accs = accounts ?? [];
  const prods = (products ?? []) as { id: string; name: string }[];
  // IVA por defecto del negocio (0 = sin IVA). El monto se captura IVA-incluido.
  const defaultTaxPct = ((orgTax?.quick_sale_tax_bps ?? 0) as number) / 100;
  // Si solo hay una cuenta, precárgala para que el saldo no se quede estancado (C5).
  const defaultAccount = accs.length === 1 ? accs[0].id : "";
  const totalToday = rows.filter((r) => r.sold_at === today).reduce((s, r) => s + r.amount_minor, 0);
  const totalMonth = rows.filter((r) => r.sold_at >= monthStart).reduce((s, r) => s + r.amount_minor, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Venta rápida</h1>
      <p className="mt-1 text-sm text-slate-500">Registra una venta de contado en segundos, sin factura ni cliente.</p>
      <div className="mt-4"><ModuleHelp slug="quicksale" /></div>

      {ok === "1" && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ Venta registrada.</p>}
      {ok === "del" && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">Venta eliminada.</p>}
      {error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Vendido hoy</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{formatMoney(totalToday, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Vendido este mes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(totalMonth, currency)}</p>
        </div>
      </div>

      <form action={createQuickSale} className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Monto *</label>
            <input name="amount" type="number" step="0.01" min="0" required placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input name="sold_at" type="date" defaultValue={today}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">¿Qué vendiste? (opcional)</label>
          <input name="description" placeholder="Ej. 10 helados de vainilla"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Cómo te pagaron</label>
            <select name="method" defaultValue="cash" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-900">
              {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Entra a la cuenta {defaultAccount ? "" : "(opcional)"}</label>
            <select name="account_id" defaultValue={defaultAccount} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-900">
              <option value="">— No actualizar saldo —</option>
              {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        {defaultTaxPct > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">IVA incluido en el monto (%)</label>
            <input name="tax_pct" type="number" step="0.01" min="0" defaultValue={defaultTaxPct}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
            <p className="mt-1 text-xs text-slate-400">El monto que escribiste ya incluye este IVA. Déjalo en 0 si esta venta no lleva IVA. Tu ganancia se calcula sin el IVA.</p>
          </div>
        )}
        {prods.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Producto del inventario (opcional)</label>
              <select name="product_id" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-slate-900">
                <option value="">— No descontar inventario —</option>
                {prods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Cantidad vendida</label>
              <input name="qty" type="number" step="0.001" min="0" placeholder="1"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              <p className="mt-1 text-xs text-slate-400">Si eliges producto, se descuenta del inventario.</p>
            </div>
          </div>
        )}
        <SubmitButton pendingText="Registrando venta…">Registrar venta</SubmitButton>
      </form>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Últimas ventas</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aún no registras ventas rápidas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Concepto</th>
                <th className="px-4 py-2 font-medium">Método</th>
                <th className="px-4 py-2 font-medium text-right">Monto</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-slate-600">{r.sold_at}</td>
                  <td className="px-4 py-2 text-slate-700">{r.description ?? "Venta"}</td>
                  <td className="px-4 py-2 text-slate-500">{METHODS[r.method] ?? r.method}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-900">{formatMoney(r.amount_minor, currency)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteQuickSale}>
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmSubmit message="¿Eliminar esta venta? Si actualizó una cuenta o descontó inventario, se revertirá." className="text-xs text-slate-300 hover:text-red-600">
                        ✕
                      </ConfirmSubmit>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
