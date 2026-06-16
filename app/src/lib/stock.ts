import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Descuenta del inventario los productos de una factura (solo los que tienen
 * control de inventario activado). Se llama una vez, al emitir la factura.
 */
export async function decrementStockForInvoice(supabase: SupabaseClient, invoiceId: string) {
  const { data: items } = await supabase
    .from("invoice_items")
    .select("product_id, quantity, products(track_inventory)")
    .eq("invoice_id", invoiceId);

  for (const it of (items ?? []) as unknown as {
    product_id: string | null;
    quantity: number;
    products: { track_inventory: boolean } | null;
  }[]) {
    if (it.product_id && it.products?.track_inventory && Number(it.quantity) > 0) {
      await supabase.rpc("adjust_stock", {
        p_product_id: it.product_id,
        p_direction: "out",
        p_qty: Number(it.quantity),
        p_reason: "sale",
        p_note: "Venta por factura",
      });
    }
  }
}
