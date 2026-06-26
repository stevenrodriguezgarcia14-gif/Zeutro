"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const start_date = String(formData.get("start_date") ?? "") || null;
  const end_date = String(formData.get("end_date") ?? "") || null;
  const budget = String(formData.get("budget") ?? "").trim();
  const budget_amount_minor = budget ? toMinor(budget) : null;
  if (!name) redirect(`/projects/new?error=${encodeURIComponent("Ponle nombre al proyecto.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, name, customer_id, start_date, end_date, budget_amount_minor, created_by: user?.id })
    .select("id").single();
  if (error || !project) redirect(`/projects/new?error=${encodeURIComponent(safeError(error, "Error"))}`);
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const status = String(formData.get("status") ?? "active");
  const supabase = await createClient();
  await supabase.from("projects").update({ status }).eq("id", id);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}

// Crea una factura (borrador) para el cliente del proyecto, ligada al proyecto.
export async function createProjectInvoice(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: p } = await supabase
    .from("projects")
    .select("id, name, customer_id, budget_amount_minor")
    .eq("id", id)
    .single();
  if (!p) redirect(`/projects/${id}?error=${encodeURIComponent("Proyecto no encontrado.")}`);
  if (!p.customer_id) {
    redirect(`/projects/${id}?error=${encodeURIComponent("Asigna un cliente al proyecto antes de facturar.")}`);
  }

  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const { data: number, error: numErr } = await supabase.rpc("next_doc_number", {
    p_org: org.id, p_type: "invoice", p_prefix: "F-", p_seed: count ?? 0,
  });
  if (numErr || !number) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(numErr, "No se pudo generar el folio."))}`);

  const amount = p.budget_amount_minor ?? 0;
  const due = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id, customer_id: p.customer_id, number, currency: org.base_currency,
      issue_date: new Date().toISOString().slice(0, 10), due_date: due,
      subtotal_minor: amount, tax_minor: 0, total_minor: amount, status: "draft",
      project_id: id, created_by: user?.id,
    })
    .select("id").single();
  if (error || !invoice) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(error, "No se pudo crear la factura."))}`);

  await supabase.from("invoice_items").insert({
    organization_id: org.id, invoice_id: invoice.id, description: `Proyecto: ${p.name}`,
    quantity: 1, unit_price_minor: amount, discount_pct: 0, tax_rate_bps: 0, line_total_minor: amount,
  });

  revalidatePath("/invoices");
  revalidatePath(`/projects/${id}`);
  redirect(`/invoices/${invoice.id}`);
}
