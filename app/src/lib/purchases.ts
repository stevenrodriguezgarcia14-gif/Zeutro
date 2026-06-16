/**
 * Lógica de Compras para reventa: prorrateo de gastos, costo real, precios y ROI.
 *
 * MÉTODO DE DISTRIBUCIÓN DE GASTOS (envío, aduanas, comisiones…):
 * Se reparten entre los productos de forma PROPORCIONAL AL VALOR DE COMPRA de
 * cada producto (cantidad × costo unitario). Es el método más justo cuando los
 * productos tienen precios distintos: un artículo que costó más "carga" más
 * envío/impuestos, igual que en la realidad. Si el valor total es 0 (todos a
 * costo 0), se reparte por cantidad como respaldo.
 *
 *   alloc_i = gastosTotales × (valorCompra_i / valorCompraTotal)
 *   costoRealUnitario_i = (valorCompra_i + alloc_i) / cantidad_i
 */

export type PItem = {
  id: string;
  name: string;
  category: string | null;
  sku: string | null;
  quantity: number;
  unit_cost_minor: number;
  sale_price_minor: number;
  units_sold: number;
};

export type Margins = { min: number; target: number; max: number }; // bps

export function priceFor(unitCost: number, marginBps: number) {
  const m = marginBps / 10000;
  if (m >= 0.95) return { price: unitCost, profit: 0, marginBps };
  const price = Math.round(unitCost / (1 - m));
  return { price, profit: price - unitCost, marginBps };
}

export function computePurchase(items: PItem[], totalExpenses: number, margins: Margins) {
  const totalBase = items.reduce((s, it) => s + Math.round(it.quantity * it.unit_cost_minor), 0);
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

  const enriched = items.map((it) => {
    const baseValue = Math.round(it.quantity * it.unit_cost_minor);
    let alloc = 0;
    if (totalExpenses > 0) {
      if (totalBase > 0) alloc = Math.round((totalExpenses * baseValue) / totalBase);
      else if (totalQty > 0) alloc = Math.round((totalExpenses * it.quantity) / totalQty);
    }
    const realTotalCost = baseValue + alloc;
    const realUnitCost = it.quantity > 0 ? Math.round(realTotalCost / it.quantity) : realTotalCost;
    const pMin = priceFor(realUnitCost, margins.min);
    const pRec = priceFor(realUnitCost, margins.target);
    const pMax = priceFor(realUnitCost, margins.max);

    const revenue = Math.round(it.units_sold * it.sale_price_minor);
    const costSold = Math.round(it.units_sold * realUnitCost);
    const profit = revenue - costSold;
    const currentMargin = it.sale_price_minor > 0 ? Math.round(((it.sale_price_minor - realUnitCost) / it.sale_price_minor) * 100) : null;

    return {
      ...it,
      baseValue,
      alloc,
      realTotalCost,
      realUnitCost,
      pMin,
      pRec,
      pMax,
      revenue,
      costSold,
      profit,
      currentMargin,
      noPrice: it.sale_price_minor <= 0,
      negativeMargin: it.sale_price_minor > 0 && it.sale_price_minor < realUnitCost,
      noMovement: it.units_sold <= 0,
      unitsLeft: (Number(it.quantity) || 0) - (Number(it.units_sold) || 0),
    };
  });

  const inversion = totalBase + totalExpenses;
  const recuperado = enriched.reduce((s, it) => s + it.revenue, 0);
  const costoVendido = enriched.reduce((s, it) => s + it.costSold, 0);
  const ganancia = recuperado - costoVendido;
  const pendiente = Math.max(inversion - recuperado, 0);
  const pctRecuperado = inversion > 0 ? Math.round((recuperado / inversion) * 100) : 0;
  const roi = inversion > 0 ? Math.round((ganancia / inversion) * 100) : 0;
  const unitsTotal = totalQty;
  const unitsSold = enriched.reduce((s, it) => s + (Number(it.units_sold) || 0), 0);

  return {
    items: enriched,
    totals: {
      totalBase,
      totalExpenses,
      inversion,
      recuperado,
      costoVendido,
      ganancia,
      pendiente,
      pctRecuperado,
      roi,
      unitsTotal,
      unitsSold,
      unitsLeft: unitsTotal - unitsSold,
      recovered: inversion > 0 && recuperado >= inversion,
    },
  };
}
