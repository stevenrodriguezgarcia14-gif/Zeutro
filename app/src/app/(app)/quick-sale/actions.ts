"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createQuickSale(formData: FormData) {
  const amount = toMinor(String(formData.get("amount") ?? "0"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const method = String(formData.get("method") ?? "cash");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const sold_at = String(formData.get("sold_at") ?? "") || new Date().toISOString().slice(0, 10);
  const product_id = String(formData.get("product_id") ?? "") || null;
  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const qty = product_id && qtyRaw ? Number(qtyRaw) : null;

  if (amount <= 0) redirect(`/quick-sale?error=${encodeURIComponent("Escribe un monto mayor a 0.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();

  // Atómico: inserta la venta, mueve la cuenta y descuenta stock en una sola transacción (RPC).
  const { error } = await supabase.rpc("create_quick_sale", {
    p_org: org.id,
    p_amount_minor: amount,
    p_description: description,
    p_method: method,
    p_account_id: account_id,
    p_sold_at: sold_at,
    p_product_id: product_id,
    p_qty: qty,
  });
  if (error) redirect(`/quick-sale?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/quick-sale");
  revalidatePath("/dashboard");
  revalidatePath("/profitability");
  revalidatePath("/accounts");
  revalidatePath("/inventory");
  redirect("/quick-sale?ok=1");
}

export async function deleteQuickSale(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // Atómico: revierte el movimiento de cuenta y repone stock antes de borrar.
  const { error } = await supabase.rpc("delete_quick_sale", { p_id: id });
  if (error) redirect(`/quick-sale?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/quick-sale");
  revalidatePath("/dashboard");
  revalidatePath("/profitability");
  revalidatePath("/accounts");
  revalidatePath("/inventory");
  redirect("/quick-sale?ok=del");
}
