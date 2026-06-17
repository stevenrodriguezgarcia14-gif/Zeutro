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

  if (amount <= 0) redirect(`/quick-sale?error=${encodeURIComponent("Escribe un monto mayor a 0.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("quick_sales").insert({
    organization_id: org.id, description, amount_minor: amount, currency: org.base_currency,
    method, account_id, sold_at, created_by: user?.id,
  });
  if (error) redirect(`/quick-sale?error=${encodeURIComponent(error.message)}`);

  // Si eligió una cuenta, sube su saldo (entra dinero).
  if (account_id) {
    await supabase.rpc("record_account_movement", {
      p_account_id: account_id,
      p_direction: "in",
      p_amount_minor: amount,
      p_date: sold_at,
      p_description: description ?? "Venta rápida",
    });
  }

  revalidatePath("/quick-sale");
  revalidatePath("/dashboard");
  revalidatePath("/profitability");
  redirect("/quick-sale?ok=1");
}

export async function deleteQuickSale(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("quick_sales").delete().eq("id", id);
  revalidatePath("/quick-sale");
  revalidatePath("/dashboard");
  revalidatePath("/profitability");
  redirect("/quick-sale?ok=del");
}
