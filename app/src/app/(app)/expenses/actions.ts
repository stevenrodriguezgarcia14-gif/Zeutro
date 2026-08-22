"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createExpense(formData: FormData) {
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const vendor = String(formData.get("vendor") ?? "").trim() || null;
  const amount = String(formData.get("amount") ?? "0");
  const tax = String(formData.get("tax") ?? "").trim();
  const expense_date = String(formData.get("expense_date") ?? "") || (await getOrgToday());
  const payment_status = String(formData.get("payment_status") ?? "paid");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const is_deductible = formData.get("is_deductible") === "on";
  const project_id = String(formData.get("project_id") ?? "") || null;
  // Datos del comprobante electronico, si el gasto se importo de un XML.
  const einvoice_key = String(formData.get("einvoice_key") ?? "").trim() || null;
  const einvoice_number = String(formData.get("einvoice_number") ?? "").trim() || null;
  const doc_path = String(formData.get("doc_path") ?? "").trim() || null;
  const doc_name = String(formData.get("doc_name") ?? "").trim() || null;
  const doc_mime = String(formData.get("doc_mime") ?? "").trim() || "application/octet-stream";
  const redirectTo = String(formData.get("redirect_to") ?? "/expenses");

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
    p_project_id: project_id,
    p_einvoice_key: einvoice_key,
    p_einvoice_number: einvoice_number,
  });

  if (error) {
    redirect(`/expenses/new?error=${encodeURIComponent(safeError(error))}`);
  }

  // El XML del comprobante queda como respaldo, pegado al trabajo si lo hay.
  // Va despues del gasto a proposito: si el gasto se rechaza (por ejemplo
  // por comprobante duplicado) no se guarda un documento suelto.
  if (doc_path && doc_name) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("documents").insert({
      organization_id: org.id,
      name: doc_name,
      file_path: doc_path,
      mime_type: doc_mime,
      entity_type: project_id ? "project" : null,
      entity_id: project_id,
      created_by: user?.id,
    });
    revalidatePath("/documents");
  }

  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  if (project_id) revalidatePath(`/projects/${project_id}`);
  redirect(redirectTo);
}

export async function markExpensePaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_expense_paid", {
    p_id: id,
    p_account_id: account_id,
    p_paid_date: (await getOrgToday()),
  });
  if (error) redirect(`/expenses?error=${encodeURIComponent(safeError(error))}`);
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
  if (error) redirect(`/expenses?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath("/expenses");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/expenses?ok=del");
}
