"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createPurchase(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const purchase_date = String(formData.get("purchase_date") ?? "") || new Date().toISOString().slice(0, 10);
  const description = String(formData.get("description") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) redirect(`/purchases/new?error=${encodeURIComponent("Ponle un nombre a la compra.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: purchase, error } = await supabase
    .from("purchases")
    .insert({ organization_id: org.id, name, purchase_date, description, notes, currency: org.base_currency, created_by: user?.id })
    .select("id")
    .single();
  if (error || !purchase) redirect(`/purchases/new?error=${encodeURIComponent(safeError(error, "Error"))}`);

  revalidatePath("/purchases");
  redirect(`/purchases/${purchase.id}`);
}

export async function addExpense(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const type = String(formData.get("type") ?? "other");
  const description = String(formData.get("description") ?? "").trim() || null;
  const amount_minor = toMinor(String(formData.get("amount") ?? "0"));
  if (amount_minor <= 0) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent("El monto del gasto debe ser mayor a 0.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_expenses").insert({ organization_id: org.id, purchase_id, type, description, amount_minor });
  if (error) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}`);
}

export async function deleteExpense(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const id = String(formData.get("expense_id") ?? "");
  const supabase = await createClient();
  await supabase.from("purchase_expenses").delete().eq("id", id);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}`);
}

export async function addItem(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unit_cost_minor = toMinor(String(formData.get("unit_cost") ?? "0"));
  if (!name) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent("Escribe el nombre del producto.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { error } = await supabase.from("purchase_items").insert({
    organization_id: org.id, purchase_id, name, category, sku, quantity, unit_cost_minor,
  });
  if (error) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}`);
}

export async function updateItem(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const id = String(formData.get("item_id") ?? "");
  const sale_price_minor = toMinor(String(formData.get("sale_price") ?? "0"));
  const units_sold = Number(formData.get("units_sold") ?? 0) || 0;
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_items")
    .update({ sale_price_minor, units_sold })
    .eq("id", id);
  if (error) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}`);
}

export async function deleteItem(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const id = String(formData.get("item_id") ?? "");
  const supabase = await createClient();
  await supabase.from("purchase_items").delete().eq("id", id);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}`);
}

export async function updateMargins(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const margin_min_bps = Math.round((Number(formData.get("margin_min") ?? 20) || 0) * 100);
  const margin_target_bps = Math.round((Number(formData.get("margin_target") ?? 40) || 0) * 100);
  const margin_max_bps = Math.round((Number(formData.get("margin_max") ?? 60) || 0) * 100);
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchases")
    .update({ margin_min_bps, margin_target_bps, margin_max_bps })
    .eq("id", purchase_id);
  if (error) redirect(`/purchases/${purchase_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/purchases/${purchase_id}`);
  redirect(`/purchases/${purchase_id}?ok=1`);
}

export async function setPurchaseStatus(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const status = String(formData.get("status") ?? "open");
  const supabase = await createClient();
  await supabase.from("purchases").update({ status }).eq("id", purchase_id);
  revalidatePath(`/purchases/${purchase_id}`);
  revalidatePath("/purchases");
  redirect(`/purchases/${purchase_id}`);
}
