import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney, fromMinor } from "@/lib/money";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { updateProduct, addComponent, deleteComponent, updateSheetSettings, applySuggestedPrice } from "./actions";

const GROUPS: { type: string; label: string; help: string }[] = [
  { type: "material", label: "Ingredientes / materiales", help: "Ej. leche condensada, harina, empaque…" },
  { type: "labor", label: "Mano de obra", help: "Ej. horas de trabajo × costo por hora" },
  { type: "other", label: "Otros costos", help: "Ej. luz, gas, transporte, comisiones" },
];

function priceFor(unitCost: number, marginBps: number) {
  const m = marginBps / 10000;
  if (m >= 0.95) return { price: unitCost, profit: 0, marginBps };
  const price = Math.round(unitCost / (1 - m));
  return { price, profit: price - unitCost, marginBps };
}

export default async function ProductCostingPage({
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

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  const { data: sheet } = await supabase
    .from("cost_sheets")
    .select("*")
    .eq("product_id", id)
    .maybeSingle();

  const { data: components } = sheet
    ? await supabase
        .from("cost_components")
        .select("id, type, name, quantity, unit_cost_minor, line_total_minor")
        .eq("cost_sheet_id", sheet.id)
        .order("created_at")
    : { data: [] as never[] };

  const comps = components ?? [];
  const totalCost = comps.reduce((s, c) => s + (c.line_total_minor ?? 0), 0);
  const outputQty = sheet ? Number(sheet.output_qty) || 1 : 1;
  const unitCost = Math.round(totalCost / outputQty);

  const marginMin = sheet?.margin_min_bps ?? 2500;
  const marginTarget = sheet?.margin_target_bps ?? 4500;
  const marginMax = sheet?.margin_max_bps ?? 6500;
  const pMin = priceFor(unitCost, marginMin);
  const pRec = priceFor(unitCost, marginTarget);
  const pMax = priceFor(unitCost, marginMax);

  const salePrice = product.sale_price_minor ?? 0;
  const currentMargin = salePrice > 0 ? Math.round(((salePrice - unitCost) / salePrice) * 100) : null;
  const sellingBelowCost = salePrice > 0 && salePrice < unitCost;

  return (
    <div>
      <Link href="/products" className="text-sm text-slate-500 hover:underline">
        ← Productos y servicios
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {product.type === "product" ? "Producto" : product.type === "bundle" ? "Paquete" : "Servicio"}
        </span>
      </div>

      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Cambios guardados.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Datos del producto */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Datos del producto</h2>
          <div className="mt-4">
            <ProductImageUploader productId={product.id} currentUrl={product.image_url ?? null} />
          </div>
          <form action={updateProduct} className="mt-4 space-y-3 text-sm">
            <input type="hidden" name="product_id" value={product.id} />
            <div>
              <label className="block text-slate-700">Nombre</label>
              <input name="name" defaultValue={product.name} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
            </div>
            <div>
              <label className="block text-slate-700">Descripción</label>
              <textarea name="description" rows={3} defaultValue={product.description ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700">Unidad</label>
                <input name="unit" defaultValue={product.unit} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700">Precio de venta</label>
                <input name="sale_price" type="number" step="0.01" min="0" defaultValue={fromMinor(salePrice)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              </div>
            </div>
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">Guardar datos</button>
          </form>
        </section>

        {/* Costeo */}
        <section className="lg:col-span-2 space-y-6">
          {/* Componentes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Costo del producto</h2>
            <p className="text-sm text-slate-500">Agrega lo que necesitas para producirlo; Zentro suma todo.</p>

            {GROUPS.map((g) => {
              const list = comps.filter((c) => c.type === g.type);
              const subtotal = list.reduce((s, c) => s + (c.line_total_minor ?? 0), 0);
              return (
                <div key={g.type} className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">{g.label}</p>
                    <span className="text-sm text-slate-500">{formatMoney(subtotal, currency)}</span>
                  </div>
                  {list.length > 0 && (
                    <ul className="mt-1 divide-y divide-slate-100">
                      {list.map((c) => (
                        <li key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                          <span className="text-slate-700">
                            {c.name} <span className="text-slate-400">({c.quantity} × {formatMoney(c.unit_cost_minor, currency)})</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="text-slate-900">{formatMoney(c.line_total_minor, currency)}</span>
                            <form action={deleteComponent}>
                              <input type="hidden" name="product_id" value={product.id} />
                              <input type="hidden" name="component_id" value={c.id} />
                              <button className="text-slate-400 hover:text-red-600" aria-label="Quitar">✕</button>
                            </form>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form action={addComponent} className="mt-2 flex flex-wrap items-end gap-2 text-sm">
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="type" value={g.type} />
                    <input name="name" placeholder={g.help} className="min-w-40 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 outline-none focus:border-slate-900" />
                    <input name="quantity" type="number" step="0.001" min="0" defaultValue="1" title="Cantidad" className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                    <input name="unit_cost" type="number" step="0.01" min="0" placeholder="costo" title="Costo unitario" className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">+ Agregar</button>
                  </form>
                </div>
              );
            })}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <form action={updateSheetSettings} className="flex flex-wrap items-end gap-2 text-sm">
                <input type="hidden" name="product_id" value={product.id} />
                <div>
                  <label className="block text-slate-700">Rinde (unidades)</label>
                  <input name="output_qty" type="number" step="0.001" min="0.001" defaultValue={outputQty} className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700">Margen mín %</label>
                  <input name="margin_min" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginMin / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700">Recom. %</label>
                  <input name="margin_target" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginTarget / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700">Máx %</label>
                  <input name="margin_max" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginMax / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                </div>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">Actualizar</button>
              </form>
              <div className="text-right">
                <p className="text-sm text-slate-500">Costo total</p>
                <p className="text-xl font-bold text-slate-900">{formatMoney(totalCost, currency)}</p>
                <p className="text-xs text-slate-400">Costo por unidad: <b>{formatMoney(unitCost, currency)}</b></p>
              </div>
            </div>
          </div>

          {/* Precios sugeridos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Precios sugeridos (por unidad)</h2>
            {unitCost === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Agrega costos arriba para ver los precios recomendados.</p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Mínimo", p: pMin, cls: "border-slate-200" },
                    { label: "Recomendado", p: pRec, cls: "border-green-400 ring-1 ring-green-300" },
                    { label: "Máximo", p: pMax, cls: "border-slate-200" },
                  ].map((x) => (
                    <div key={x.label} className={`rounded-xl border p-4 ${x.cls}`}>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{x.label}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(x.p.price, currency)}</p>
                      <p className="mt-1 text-sm text-green-700">Ganas {formatMoney(x.p.profit, currency)}</p>
                      <p className="text-xs text-slate-400">Margen {Math.round(x.p.marginBps / 100)}%</p>
                      <form action={applySuggestedPrice} className="mt-3">
                        <input type="hidden" name="product_id" value={product.id} />
                        <input type="hidden" name="price_minor" value={x.p.price} />
                        <button className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Usar este precio
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                  {sellingBelowCost ? (
                    <p className="text-red-700">
                      ⚠️ Tu precio actual ({formatMoney(salePrice, currency)}) está <b>por debajo del costo</b> ({formatMoney(unitCost, currency)}): estás perdiendo dinero en cada venta.
                    </p>
                  ) : salePrice > 0 ? (
                    <p className="text-slate-600">
                      Tu precio actual es <b>{formatMoney(salePrice, currency)}</b> → ganas {formatMoney(salePrice - unitCost, currency)} por unidad (margen {currentMargin}%).
                    </p>
                  ) : (
                    <p className="text-slate-600">Aún no has fijado un precio de venta. Usa uno de los sugeridos como referencia.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
