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

  // Atómico: inserta el gasto y (si está pagado y tiene cuenta) mueve el saldo en una sola transacción.
  const { error } = await supabase.rpc("create_expense", {
    p_org: org.id,
    p_description: description,
    p_amount_minor: amount_minor,
    p_category: category,
    p_vendor: vendor,
    p_tax_minor: tax ? toMinor(tax) : 0,
    p_expense_date: expense_date,
    p_payment_status: payment_status,
    p_account_id: account_id,
    p_is_deductible: is_deductible,
  });

  if (error) {
    redirect(`/expenses/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/expenses");
}

export async function markExpensePaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_expense_paid", {
    p_id: id,
    p_account_id: account_id,
    p_paid_date: new Date().toISOString().slice(0, 10),
  });
  if (error) redirect(`/expenses?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/expenses?ok=paid");
}

export async function deleteExpense(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // Atómico: si estaba pagado desde una cuenta, devuelve el dinero antes de borrar.
  const { error } = await supabase.rpc("delete_expense", { p_id: id });
  if (error) redirect(`/expenses?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/expenses?ok=del");
}
