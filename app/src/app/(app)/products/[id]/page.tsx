import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney, fromMinor } from "@/lib/money";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import { updateProduct, addComponent, deleteComponent, updateSheetSettings, applySuggestedPrice, updateInventorySettings } from "./actions";

const INV_REASON: Record<string, string> = {
  purchase: "Compra", sale: "Venta", adjustment: "Ajuste", return: "Devolución",
  loss: "Merma", initial: "Inicial",
};

const GROUPS: {
  type: string;
  title: string;
  intro: string;
  nameLabel: string;
  qtyLabel: string;
  costLabel: string;
  addLabel: string;
  listId: string;
  suggestions: string[];
}[] = [
  {
    type: "material",
    title: "Ingredientes / materiales",
    intro: "Lo que lleva el producto.",
    nameLabel: "Ingrediente o material",
    qtyLabel: "Cantidad",
    costLabel: "Costo por unidad",
    addLabel: "Agregar ingrediente",
    listId: "sug-material",
    suggestions: ["Harina", "Azúcar", "Leche", "Leche condensada", "Huevos", "Mantequilla", "Empaque", "Etiqueta", "Bolsa"],
  },
  {
    type: "labor",
    title: "Mano de obra",
    intro: "El trabajo de hacerlo. Pon las horas y cuánto cuesta la hora.",
    nameLabel: "Tarea",
    qtyLabel: "Horas",
    costLabel: "Costo por hora",
    addLabel: "Agregar mano de obra",
    listId: "sug-labor",
    suggestions: ["Preparación", "Cocción / horneado", "Decoración", "Empaquetado", "Atención"],
  },
  {
    type: "other",
    title: "Otros costos",
    intro: "Gastos para producirlo (luz, gas, transporte…).",
    nameLabel: "Concepto",
    qtyLabel: "Cantidad",
    costLabel: "Costo",
    addLabel: "Agregar costo",
    listId: "sug-other",
    suggestions: ["Luz", "Agua", "Gas", "Transporte", "Empaque", "Comisión de venta", "Renta", "Internet"],
  },
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

  // Las 4 lecturas en paralelo (los componentes se filtran por la ficha de
  // costos del producto vía join, para no esperar a conocer su id).
  const [{ data: product }, { data: sheet }, { data: movements }, { data: componentRows }] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("cost_sheets").select("*").eq("product_id", id).maybeSingle(),
      supabase
        .from("inventory_movements")
        .select("id, direction, qty, reason, note, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("cost_components")
        .select("id, type, name, quantity, unit_cost_minor, line_total_minor, cost_sheets!inner(product_id)")
        .eq("cost_sheets.product_id", id)
        .order("created_at"),
    ]);
  if (!product) notFound();
  const moves = product.type === "product" ? (movements ?? []) : [];
  const components = sheet ? componentRows : [];

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

  // Recuperación de inversión por tanda
  const incomeIfAll = Math.round(outputQty * salePrice);
  const cleanProfit = incomeIfAll - totalCost;
  const unitsToRecover = salePrice > 0 ? Math.ceil(totalCost / salePrice) : 0;
  const recovers = unitsToRecover > 0 && unitsToRecover <= outputQty;

  const fieldCls =
    "mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900 outline-none focus:border-slate-900";

  return (
    <div>
      <Link href="/products" className="text-sm text-slate-500 hover:underline">
        ← Productos y servicios
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
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
              <input name="name" defaultValue={product.name} required className={fieldCls} />
            </div>
            <div>
              <label className="block text-slate-700">Descripción</label>
              <textarea name="description" rows={3} defaultValue={product.description ?? ""} className={fieldCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700">Unidad</label>
                <input name="unit" defaultValue={product.unit} className={fieldCls} />
              </div>
              <div>
                <label className="block text-slate-700">Precio de venta</label>
                <input name="sale_price" type="number" step="0.01" min="0" defaultValue={fromMinor(salePrice)} className={fieldCls} />
              </div>
            </div>
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
              Guardar datos
            </button>
          </form>

          {product.type === "product" && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-900">Inventario</h3>
              <form action={updateInventorySettings} className="mt-3 space-y-3 text-sm">
                <input type="hidden" name="product_id" value={product.id} />
                <label className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" name="track_inventory" defaultChecked={product.track_inventory} className="h-4 w-4 rounded border-slate-300" />
                  Controlar inventario de este producto
                </label>
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-slate-700">Stock actual</label>
                    <p className="mt-1 text-lg font-bold text-slate-900">{product.stock_qty ?? 0}</p>
                  </div>
                  <div>
                    <label className="block text-slate-700">Stock mínimo (alerta)</label>
                    <input name="min_stock" type="number" step="0.001" min="0" defaultValue={product.min_stock ?? ""} placeholder="—" className={fieldCls} />
                  </div>
                </div>
                <button className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">Guardar inventario</button>
              </form>
              <p className="mt-2 text-xs text-slate-400">Para entradas/salidas de stock usa <Link href="/inventory" className="underline">Inventario</Link>.</p>

              <h4 className="mt-5 text-sm font-semibold text-slate-700">Historial de movimientos (kardex)</h4>
              {moves.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400">Sin movimientos todavía.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 text-sm">
                  {moves.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2">
                      <span className="text-slate-600">
                        <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString("es")}</span>{" "}
                        {INV_REASON[m.reason] ?? m.reason}{m.note ? ` · ${m.note}` : ""}
                      </span>
                      <span className={`font-medium ${m.direction === "in" ? "text-green-700" : "text-red-700"}`}>
                        {m.direction === "in" ? "+" : "−"}{m.qty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* Costeo */}
        <section className="space-y-6 lg:col-span-2">
          {/* Componentes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">¿Qué necesitas para hacerlo? (costos)</h2>
            <p className="text-sm text-slate-500">
              Agrega cuántas veces quieras en cada grupo; Zentro suma todo automáticamente.
            </p>

            {GROUPS.map((g) => {
              const list = comps.filter((c) => c.type === g.type);
              const subtotal = list.reduce((s, c) => s + (c.line_total_minor ?? 0), 0);
              return (
                <div key={g.type} className="mt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{g.title}</p>
                    <span className="text-sm font-medium text-slate-700">{formatMoney(subtotal, currency)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{g.intro}</p>

                  {list.length > 0 && (
                    <ul className="mt-2 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3">
                      {list.map((c) => (
                        <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="text-slate-700">
                            {c.name}{" "}
                            <span className="text-slate-400">
                              ({c.quantity} × {formatMoney(c.unit_cost_minor, currency)})
                            </span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="font-medium text-slate-900">{formatMoney(c.line_total_minor, currency)}</span>
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

                  <datalist id={g.listId}>
                    {g.suggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <form action={addComponent} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_8rem_auto] sm:items-end">
                    <input type="hidden" name="product_id" value={product.id} />
                    <input type="hidden" name="type" value={g.type} />
                    <div>
                      <label className="block text-xs text-slate-500">{g.nameLabel}</label>
                      <input name="name" list={g.listId} placeholder="Elige o escribe" className={fieldCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">{g.qtyLabel}</label>
                      <input name="quantity" type="number" step="0.001" min="0" defaultValue="1" className={`${fieldCls} text-right`} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">{g.costLabel}</label>
                      <input name="unit_cost" type="number" step="0.01" min="0" placeholder="0.00" className={`${fieldCls} text-right`} />
                    </div>
                    <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      + {g.addLabel}
                    </button>
                  </form>
                </div>
              );
            })}

            <div className="mt-5 rounded-lg bg-slate-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Costo total de la receta</span>
                <span className="text-lg font-bold">{formatMoney(totalCost, currency)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-slate-300">Costo por unidad</span>
                <span className="text-lg font-bold">{formatMoney(unitCost, currency)}</span>
              </div>
            </div>
          </div>

          {/* Producción y margen */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Producción y ganancia</h2>
            <form action={updateSheetSettings} className="mt-4 space-y-5 text-sm">
              <input type="hidden" name="product_id" value={product.id} />

              <div>
                <label className="block font-medium text-slate-700">¿Cuántas unidades produces con esos costos?</label>
                <p className="text-xs text-slate-400">
                  Si los costos de arriba alcanzan para 8 porciones, escribe 8. Si es 1 sola unidad, deja 1.
                </p>
                <input name="output_qty" type="number" step="0.001" min="0.001" defaultValue={outputQty} className="mt-1 w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-slate-900 outline-none focus:border-slate-900" />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Margen de ganancia (%)</label>
                <p className="text-xs text-slate-400">
                  Es qué parte del precio es tu ganancia. Ej.: con 45%, de cada ₡100 vendidos, ₡45 son ganancia.
                  Define tres niveles para ver opciones de precio.
                </p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <div>
                    <label className="block text-xs text-slate-500">Mínimo</label>
                    <input name="margin_min" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginMin / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500">Recomendado</label>
                    <input name="margin_target" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginTarget / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500">Máximo</label>
                    <input name="margin_max" type="number" step="1" min="0" max="90" defaultValue={Math.round(marginMax / 100)} className="mt-1 w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right outline-none focus:border-slate-900" />
                  </div>
                </div>
              </div>

              <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">
                Guardar producción y margen
              </button>
            </form>
          </div>

          {/* Precios sugeridos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">¿A cuánto vender? (por unidad)</h2>
            {unitCost === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Agrega costos arriba y verás aquí los precios recomendados.</p>
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
                      ⚠️ Tu precio actual ({formatMoney(salePrice, currency)}) está <b>por debajo del costo</b> ({formatMoney(unitCost, currency)}): pierdes dinero en cada venta.
                    </p>
                  ) : salePrice > 0 ? (
                    <p className="text-slate-600">
                      Tu precio actual es <b>{formatMoney(salePrice, currency)}</b> → ganas {formatMoney(salePrice - unitCost, currency)} por unidad (margen {currentMargin}%).
                    </p>
                  ) : (
                    <p className="text-slate-600">Aún no fijas precio. Toca “Usar este precio” en la opción que prefieras.</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Recuperación de inversión por tanda */}
          {totalCost > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-slate-900">Inversión y recuperación (por tanda)</h2>
              <p className="text-sm text-slate-500">
                Cuánto inviertes para hacer una tanda y cuándo lo recuperas vendiendo.
              </p>
              {salePrice === 0 ? (
                <p className="mt-3 text-sm text-slate-600">Fija un precio de venta (arriba) para ver esto.</p>
              ) : (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Inversión de la tanda</span>
                    <b className="text-slate-900">{formatMoney(totalCost, currency)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Produce</span>
                    <b className="text-slate-900">{outputQty} unidad(es)</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Precio por unidad</span>
                    <b className="text-slate-900">{formatMoney(salePrice, currency)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Si vendes toda la tanda recibes</span>
                    <b className="text-slate-900">{formatMoney(incomeIfAll, currency)}</b>
                  </div>
                  <div className="mt-2 space-y-1 border-t border-slate-200 pt-3">
                    {recovers ? (
                      <p className="text-slate-700">
                        ♻️ Recuperas tu inversión al vender <b>{unitsToRecover}</b> de {outputQty}. Con eso vuelves a comprar
                        ingredientes; las {outputQty - unitsToRecover} restantes son ganancia.
                      </p>
                    ) : (
                      <p className="text-red-700">
                        ⚠️ Vendiendo toda la tanda no recuperas la inversión: el precio es muy bajo o el costo muy alto. Sube el precio o baja costos.
                      </p>
                    )}
                    <p className={cleanProfit >= 0 ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
                      Ganancia limpia si vendes todo: {formatMoney(cleanProfit, currency)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
