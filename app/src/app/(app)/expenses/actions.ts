"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const vendor = String(formData.get("vendor") ?? "").trim() || null;
  const amount = String(formData.get("amount") ?? "0");
  const tax = String(formData.get("tax") ?? "").trim();
  const expense_date = String(formData.get("expense_date") ?? "") || new Date().toISOString().slice(0, 10);
  const payment_status = String(formData.get("payment_status") ?? "paid");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const is_deductible = formData.get("is_deductible") === "on";

  if (!description) {
    redirect(`/expenses/new?error=${encodeURIComponent("La descripción es obligatoria.")}`);
  }
  const amount_minor = toMinor(amount);
  if (amount_minor <= 0) {
    redirect(`/expenses/new?error=${encodeURIComponent("El monto debe ser mayor a 0.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("expenses").insert({
    organization_id: org.id,
    description,
    category,
    vendor,
    amount_minor,
    tax_minor: tax ? toMinor(tax) : 0,
    currency: org.base_currency,
    expense_date,
    payment_status,
    account_id,
    is_deductible,
    created_by: user?.id,
  });

  if (error) {
    redirect(`/expenses/new?error=${encodeURIComponent(error.message)}`);
  }

  // Si el gasto se pagó desde una cuenta, registra la salida de dinero real.
  if (payment_status === "paid" && account_id) {
    await supabase.rpc("record_account_movement", {
      p_account_id: account_id,
      p_direction: "out",
      p_amount_minor: amount_minor,
      p_date: expense_date,
      p_description: `Gasto: ${description}`,
    });
  }

  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/expenses");
}
