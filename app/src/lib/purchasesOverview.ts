import { createClient } from "@/lib/supabase/server";
import { computePurchase, type PItem } from "@/lib/purchases";

export type PurchasesOverview = {
  count: number;
  invertido: number;
  recuperado: number;
  ganancia: number;
  capitalEnMercancia: number; // inversión aún no recuperada
  mercanciaSinVender: number; // unidades restantes
  valorPorVender: number; // unidades restantes × precio de venta (potencial)
  roi: number; // %
};

/** Agrega todas las compras del negocio activo para los reportes financieros. */
export async function getPurchasesOverview(): Promise<PurchasesOverview> {
  const supabase = await createClient();
  const [{ data: purchases }, { data: items }, { data: expenses }] = await Promise.all([
    supabase.from("purchases").select("id, margin_min_bps, margin_target_bps, margin_max_bps"),
    supabase.from("purchase_items").select("id, purchase_id, name, category, sku, quantity, unit_cost_minor, sale_price_minor, units_sold"),
    supabase.from("purchase_expenses").select("purchase_id, amount_minor"),
  ]);

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

  let invertido = 0, recuperado = 0, ganancia = 0, capitalEnMercancia = 0, mercanciaSinVender = 0, valorPorVender = 0;
  for (const p of (purchases ?? []) as { id: string; margin_min_bps: number; margin_target_bps: number; margin_max_bps: number }[]) {
    const c = computePurchase(itemsByP.get(p.id) ?? [], expByP.get(p.id) ?? 0, {
      min: p.margin_min_bps, target: p.margin_target_bps, max: p.margin_max_bps,
    });
    invertido += c.totals.inversion;
    recuperado += c.totals.recuperado;
    ganancia += c.totals.ganancia;
    capitalEnMercancia += c.totals.pendiente;
    mercanciaSinVender += c.totals.unitsLeft;
    for (const it of c.items) {
      if (it.sale_price_minor > 0) valorPorVender += Math.round(it.unitsLeft * it.sale_price_minor);
    }
  }

  return {
    count: (purchases ?? []).length,
    invertido,
    recuperado,
    ganancia,
    capitalEnMercancia,
    mercanciaSinVender,
    valorPorVender,
    roi: invertido > 0 ? Math.round((ganancia / invertido) * 100) : 0,
  };
}
