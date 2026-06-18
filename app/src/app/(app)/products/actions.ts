"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "service");
  const unit = String(formData.get("unit") ?? "unidad").trim() || "unidad";
  const description = String(formData.get("description") ?? "").trim() || null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const priceRaw = String(formData.get("sale_price") ?? "").trim();
  const costRaw = String(formData.get("cost_price") ?? "").trim();
  const trackInventory = formData.get("track_inventory") === "on";
  const stockRaw = String(formData.get("stock_qty") ?? "").trim();

  if (!name) {
    redirect(`/products/new?error=${encodeURIComponent("El nombre es obligatorio.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Solo los servicios y productos sin receta capturan precio/costo aquí; un
  // fabricante puede dejarlos en 0 y usar la hoja de costos en la ficha.
  const sale_price_minor = priceRaw ? toMinor(priceRaw) : 0;
  const cost_price_minor = costRaw ? toMinor(costRaw) : null;
  // El inventario solo aplica a productos físicos.
  const track = type === "product" ? trackInventory : false;
  const stock_qty = track && stockRaw ? Number(stockRaw) : 0;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: org.id,
      type,
      name,
      unit,
      description,
      sku,
      sale_price_minor,
      cost_price_minor,
      track_inventory: track,
      stock_qty,
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect(`/products/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear.")}`);
  }

  revalidatePath("/products");
  revalidatePath("/inventory");
  // Llevar a la ficha para subir foto y afinar costos/precio
  redirect(`/products/${product.id}`);
}
