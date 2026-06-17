"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function adjustStock(formData: FormData) {
  const product_id = String(formData.get("product_id") ?? "");
  const direction = String(formData.get("direction") ?? "in");
  const qty = Number(formData.get("qty") ?? 0) || 0;
  const reason = String(formData.get("reason") ?? "adjustment");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (qty <= 0) redirect(`/inventory?error=${encodeURIComponent("La cantidad debe ser mayor a 0.")}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: product_id, p_direction: direction, p_qty: qty, p_reason: reason, p_note: note,
  });
  if (error) redirect(`/inventory?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/inventory");
  redirect("/inventory");
}

/** Crea un producto del catálogo a partir de un ítem de compra y le carga el stock. */
export async function sendPurchaseItemToInventory(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const item_id = String(formData.get("item_id") ?? "");
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: item } = await supabase
    .from("purchase_items")
    .select("name, sku, quantity, unit_cost_minor, sale_price_minor, product_id")
    .eq("id", item_id)
    .single();
  if (!item) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent("Producto no encontrado.")}`);

  // Idempotencia: si este ítem ya se envió al inventario, no crear un duplicado.
  if (item.product_id) {
    redirect(`/purchases/${purchase_id}?error=${encodeURIComponent("Este producto ya está en tu inventario.")}`);
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: org.id,
      type: "product",
      name: item.name,
      sku: item.sku,
      unit: "unidad",
      sale_price_minor: item.sale_price_minor ?? 0,
      cost_price_minor: item.unit_cost_minor ?? 0,
      track_inventory: true,
      stock_qty: 0,
      created_by: user?.id,
    })
    .select("id")
    .single();
  if (error || !product) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent(error?.message ?? "No se pudo crear el producto.")}`);

  // Marcar el ítem como ya enviado (enlace), para que no se pueda duplicar.
  await supabase.from("purchase_items").update({ product_id: product.id }).eq("id", item_id);

  await supabase.rpc("adjust_stock", {
    p_product_id: product.id, p_direction: "in", p_qty: Number(item.quantity) || 0, p_reason: "purchase", p_note: "Desde compra",
  });
  revalidatePath("/inventory");
  redirect(`/purchases/${purchase_id}?ok=1`);
}
