"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

async function ensureSheet(supabase: SupabaseClient, orgId: string, productId: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from("cost_sheets")
    .select("id")
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("cost_sheets")
    .insert({ organization_id: orgId, product_id: productId })
    .select("id")
    .single();
  return created?.id ?? null;
}

/** Recalcula el costo unitario del producto a partir de su hoja de costo. */
async function recompute(supabase: SupabaseClient, productId: string) {
  const { data: sheet } = await supabase
    .from("cost_sheets")
    .select("id, output_qty")
    .eq("product_id", productId)
    .maybeSingle();
  if (!sheet) return;
  const { data: comps } = await supabase
    .from("cost_components")
    .select("line_total_minor")
    .eq("cost_sheet_id", sheet.id);
  const total = (comps ?? []).reduce((s, c) => s + (c.line_total_minor ?? 0), 0);
  const qty = Number(sheet.output_qty) || 1;
  const unit = Math.round(total / qty);
  await supabase.from("products").update({ cost_price_minor: unit }).eq("id", productId);
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("product_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const unit = String(formData.get("unit") ?? "unidad").trim() || "unidad";
  const sale_price_minor = toMinor(String(formData.get("sale_price") ?? "0"));

  if (!name) redirect(`/products/${id}?error=${encodeURIComponent("El nombre es obligatorio.")}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ name, description, unit, sale_price_minor })
    .eq("id", id);
  if (error) redirect(`/products/${id}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  redirect(`/products/${id}?ok=1`);
}

export async function applySuggestedPrice(formData: FormData) {
  const id = String(formData.get("product_id") ?? "");
  const price_minor = parseInt(String(formData.get("price_minor") ?? "0"), 10) || 0;
  const supabase = await createClient();
  await supabase.from("products").update({ sale_price_minor: price_minor }).eq("id", id);
  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  redirect(`/products/${id}?ok=1`);
}

export async function saveProductImage(productId: string, url: string) {
  const supabase = await createClient();
  await supabase.from("products").update({ image_url: url }).eq("id", productId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
}

export async function addComponent(formData: FormData) {
  const product_id = String(formData.get("product_id") ?? "");
  const type = String(formData.get("type") ?? "material");
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unit_cost_minor = toMinor(String(formData.get("unit_cost") ?? "0"));

  if (!name) redirect(`/products/${product_id}?error=${encodeURIComponent("Escribe el nombre del componente.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();

  const sheetId = await ensureSheet(supabase, org.id, product_id);
  if (!sheetId) redirect(`/products/${product_id}?error=${encodeURIComponent("No se pudo crear la hoja de costo.")}`);

  const { error } = await supabase.from("cost_components").insert({
    organization_id: org.id,
    cost_sheet_id: sheetId,
    type,
    name,
    quantity,
    unit_cost_minor,
  });
  if (error) redirect(`/products/${product_id}?error=${encodeURIComponent(error.message)}`);

  await recompute(supabase, product_id);
  revalidatePath(`/products/${product_id}`);
  redirect(`/products/${product_id}`);
}

export async function deleteComponent(formData: FormData) {
  const product_id = String(formData.get("product_id") ?? "");
  const component_id = String(formData.get("component_id") ?? "");
  const supabase = await createClient();
  await supabase.from("cost_components").delete().eq("id", component_id);
  await recompute(supabase, product_id);
  revalidatePath(`/products/${product_id}`);
  redirect(`/products/${product_id}`);
}

export async function updateSheetSettings(formData: FormData) {
  const product_id = String(formData.get("product_id") ?? "");
  const output_qty = Number(formData.get("output_qty") ?? 1) || 1;
  const margin_min_bps = Math.round((Number(formData.get("margin_min") ?? 25) || 0) * 100);
  const margin_target_bps = Math.round((Number(formData.get("margin_target") ?? 45) || 0) * 100);
  const margin_max_bps = Math.round((Number(formData.get("margin_max") ?? 65) || 0) * 100);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();

  const sheetId = await ensureSheet(supabase, org.id, product_id);
  if (!sheetId) redirect(`/products/${product_id}?error=${encodeURIComponent("No se pudo crear la hoja de costo.")}`);

  const { error } = await supabase
    .from("cost_sheets")
    .update({ output_qty, margin_min_bps, margin_target_bps, margin_max_bps })
    .eq("id", sheetId);
  if (error) redirect(`/products/${product_id}?error=${encodeURIComponent(error.message)}`);

  await recompute(supabase, product_id);
  revalidatePath(`/products/${product_id}`);
  redirect(`/products/${product_id}?ok=1`);
}
