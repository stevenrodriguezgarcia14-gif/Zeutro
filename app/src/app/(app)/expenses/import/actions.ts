"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { safeError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

/**
 * ¿Cuáles de estas claves de comprobante ya están registradas como gasto?
 *
 * Se consulta ANTES de mostrar la lista para poder marcar en pantalla las
 * repetidas, en vez de dejar que la persona pulse "importar" y reciba un
 * error por cada una.
 */
export async function findRegisteredKeys(keys: string[]): Promise<string[]> {
  const limpias = keys.filter((k) => typeof k === "string" && k.length > 0).slice(0, 200);
  if (limpias.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select("einvoice_key").in("einvoice_key", limpias);
  return (data ?? []).map((r) => r.einvoice_key as string).filter(Boolean);
}

export type ImportRow = {
  einvoice_key: string;
  einvoice_number: string | null;
  description: string;
  vendor: string | null;
  amount_minor: number;
  tax_minor: number;
  expense_date: string;
  category: string | null;
  project_id: string | null;
  doc_path: string | null;
  doc_name: string | null;
};

/**
 * Registra de una vez todos los comprobantes que la persona dejó marcados.
 *
 * Cada gasto se crea con la misma función atómica que el formulario normal
 * (`create_expense`), así que respeta RLS, mueve la cuenta si corresponde y
 * rechaza claves repetidas. Si alguno falla, los demás igual entran: es
 * preferible a perder una tanda de veinte facturas por una mala.
 */
export async function importExpenses(formData: FormData) {
  const raw = String(formData.get("rows") ?? "[]");
  const account_id = String(formData.get("account_id") ?? "") || null;
  let rows: ImportRow[] = [];
  try {
    rows = JSON.parse(raw);
  } catch {
    rows = [];
  }
  rows = rows.filter((r) => r.einvoice_key && r.amount_minor > 0);
  if (rows.length === 0) {
    redirect(`/expenses/import?error=${encodeURIComponent("No hay comprobantes para importar.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let creados = 0;
  const errores: string[] = [];

  for (const r of rows) {
    const { error } = await supabase.rpc("create_expense", {
      p_org: org.id,
      p_description: r.description || "Compra",
      p_amount_minor: r.amount_minor,
      p_category: r.category,
      p_vendor: r.vendor,
      p_tax_minor: r.tax_minor ?? 0,
      p_expense_date: r.expense_date,
      p_payment_status: "paid",
      p_account_id: account_id,
      p_is_deductible: true,
      p_project_id: r.project_id,
      p_einvoice_key: r.einvoice_key,
      p_einvoice_number: r.einvoice_number,
    });

    if (error) {
      errores.push(`${r.vendor ?? r.einvoice_key.slice(0, 10)}: ${safeError(error)}`);
      continue;
    }
    creados++;

    // El XML queda de respaldo, pegado al trabajo si se le asignó uno.
    if (r.doc_path && r.doc_name) {
      await supabase.from("documents").insert({
        organization_id: org.id,
        name: r.doc_name,
        file_path: r.doc_path,
        mime_type: "application/xml",
        entity_type: r.project_id ? "project" : null,
        entity_id: r.project_id,
        created_by: user?.id,
      });
    }
    if (r.project_id) revalidatePath(`/projects/${r.project_id}`);
  }

  revalidatePath("/expenses");
  revalidatePath("/documents");
  revalidatePath("/dashboard");

  const params = new URLSearchParams({ creados: String(creados) });
  if (errores.length > 0) params.set("fallos", errores.slice(0, 3).join(" · "));
  redirect(`/expenses?${params.toString()}`);
}
