"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { addDays } from "@/lib/weeks";
import { toMinor } from "@/lib/money";
import { decrementStockForInvoice } from "@/lib/stock";

type LineInput = {
  product_id?: string | null;
  /** Capítulo/partida bajo el que se agrupa la línea. Null = sin agrupar. */
  section?: string | null;
  description: string;
  quantity: number;
  /** Unidad de medida: m², ml, día, punto… Null = sin unidad. */
  unit?: string | null;
  unit_price: number;
  tax_pct: number;
  position?: number;
};

function computeTotals(lines: LineInput[]) {
  let subtotal = 0;
  let tax = 0;
  const items = lines.map((l, i) => {
    const qty = Number(l.quantity) || 0;
    const unit = toMinor(l.unit_price);
    const net = Math.round(qty * unit);
    const taxBps = Math.round((Number(l.tax_pct) || 0) * 100);
    const lineTax = Math.round((net * taxBps) / 10000);
    subtotal += net;
    tax += lineTax;
    return {
      product_id: l.product_id || null,
      section: l.section?.trim() || null,
      description: l.description,
      quantity: qty,
      unit: l.unit?.trim() || null,
      unit_price_minor: unit,
      tax_rate_bps: taxBps,
      line_total_minor: net + lineTax,
      position: Number.isFinite(l.position) ? Number(l.position) : i,
    };
  });
  return { subtotal, tax, total: subtotal + tax, items };
}

export async function createQuotation(formData: FormData) {
  const customer_id = String(formData.get("customer_id") ?? "");
  const issue_date = String(formData.get("issue_date") ?? "") || (await getOrgToday());
  const valid_until = String(formData.get("due_date") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  // Costeo privado (0045). Se guarda desglosado; `cost_minor` es una columna
  // generada que suma las cuatro partes en la base.
  const cost_materials_minor = toMinor(String(formData.get("cost_materials") ?? "0"));
  const cost_labor_minor = toMinor(String(formData.get("cost_labor") ?? "0"));
  const cost_subcontract_minor = toMinor(String(formData.get("cost_subcontract") ?? "0"));
  const cost_other_minor = toMinor(String(formData.get("cost_other") ?? "0"));
  let lines: LineInput[] = [];
  try { lines = JSON.parse(String(formData.get("items") ?? "[]")); } catch { lines = []; }
  lines = lines.filter((l) => l.description?.trim() && Number(l.quantity) > 0);

  if (!customer_id) redirect(`/quotations/new?error=${encodeURIComponent("Selecciona un cliente.")}`);
  if (lines.length === 0) redirect(`/quotations/new?error=${encodeURIComponent("Agrega al menos una línea.")}`);
  if (!valid_until) redirect(`/quotations/new?error=${encodeURIComponent("Indica hasta cuándo es válida.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { subtotal, tax, total, items } = computeTotals(lines);
  const { count } = await supabase.from("quotations").select("*", { count: "exact", head: true });
  const { data: number, error: numErr } = await supabase.rpc("next_doc_number", {
    p_org: org.id, p_type: "quotation", p_prefix: "C-", p_seed: count ?? 0,
  });
  if (numErr || !number) redirect(`/quotations/new?error=${encodeURIComponent(safeError(numErr, "No se pudo generar el folio."))}`);

  const { data: quotation, error } = await supabase
    .from("quotations")
    .insert({
      organization_id: org.id, customer_id, number, currency: org.base_currency,
      issue_date, valid_until, subtotal_minor: subtotal, tax_minor: tax, total_minor: total,
      status: intent === "send" ? "sent" : "draft", notes, project_id,
      cost_materials_minor, cost_labor_minor, cost_subcontract_minor, cost_other_minor,
      created_by: user?.id,
    })
    .select("id").single();
  if (error || !quotation) redirect(`/quotations/new?error=${encodeURIComponent(safeError(error, "Error"))}`);

  const itemsToInsert = items.map((it) => ({ ...it, organization_id: org.id, quotation_id: quotation.id }));
  const { error: itemsError } = await supabase.from("quotation_items").insert(itemsToInsert);
  if (itemsError) redirect(`/quotations/new?error=${encodeURIComponent(safeError(itemsError))}`);

  revalidatePath("/quotations");
  if (project_id) revalidatePath(`/projects/${project_id}`);
  redirect(`/quotations/${quotation.id}`);
}

export async function setQuotationStatus(formData: FormData) {
  const id = String(formData.get("quotation_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("quotations")
    .update({ status })
    .eq("id", id)
    .select("project_id")
    .single();
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
  // Aceptar o rechazar un adicional cambia el precio del trabajo.
  if (q?.project_id) revalidatePath(`/projects/${q.project_id}`);
  redirect(`/quotations/${id}`);
}

export async function convertToInvoice(formData: FormData) {
  const id = String(formData.get("quotation_id") ?? "");
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: q } = await supabase.from("quotations").select("*").eq("id", id).single();
  if (!q) redirect("/quotations");
  if (q.invoice_id) redirect(`/invoices/${q.invoice_id}`); // ya convertida

  const { data: qItems } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("position")
    .order("created_at");

  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const { data: number, error: numErr } = await supabase.rpc("next_doc_number", {
    p_org: org.id, p_type: "invoice", p_prefix: "F-", p_seed: count ?? 0,
  });
  if (numErr || !number) redirect(`/quotations/${id}?error=${encodeURIComponent(safeError(numErr, "No se pudo generar el folio."))}`);
  const hoy = await getOrgToday();
  const due = addDays(hoy, 15);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id, customer_id: q.customer_id, number, currency: q.currency,
      issue_date: hoy, due_date: due,
      subtotal_minor: q.subtotal_minor, tax_minor: q.tax_minor, total_minor: q.total_minor,
      // El trabajo y las notas viajan con la factura. Sin `project_id` aquí,
      // todo lo facturado desde una cotización quedaba invisible para la
      // rentabilidad del proyecto: parecía un trabajo puro gasto.
      status: "issued", project_id: q.project_id ?? null, notes: q.notes ?? null,
      created_by: user?.id,
    })
    .select("id").single();
  if (error || !invoice) redirect(`/quotations/${id}?error=${encodeURIComponent(safeError(error, "Error"))}`);

  if (qItems && qItems.length > 0) {
    await supabase.from("invoice_items").insert(
      qItems.map((it, i) => ({
        organization_id: org.id, invoice_id: invoice.id, product_id: it.product_id,
        section: it.section ?? null, unit: it.unit ?? null, position: it.position ?? i,
        description: it.description, quantity: it.quantity, unit_price_minor: it.unit_price_minor,
        discount_pct: 0, tax_rate_bps: it.tax_rate_bps, line_total_minor: it.line_total_minor,
      })),
    );
  }
  await supabase.from("quotations").update({ status: "converted", invoice_id: invoice.id }).eq("id", id);
  await decrementStockForInvoice(supabase, invoice.id);

  revalidatePath("/invoices");
  revalidatePath("/quotations");
  revalidatePath("/inventory");
  if (q.project_id) revalidatePath(`/projects/${q.project_id}`);
  redirect(`/invoices/${invoice.id}`);
}

/**
 * Abre un TRABAJO (proyecto) a partir de una cotización aceptada.
 *
 * El costo estimado del proyecto sale del costeo privado de la cotización
 * (`cost_minor`), NO de su total: `projects.budget_amount_minor` se compara
 * contra los gastos reales, así que meter ahí el precio de venta haría que la
 * barra de "costo vs gastado" dijera que todo va bien cuando el trabajo ya se
 * comió la utilidad. Si no hubo costeo, se deja vacío antes que mentir.
 */
export async function createProjectFromQuotation(formData: FormData) {
  const id = String(formData.get("quotation_id") ?? "");
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: q } = await supabase
    .from("quotations")
    .select("id, number, customer_id, project_id, cost_minor, issue_date, customers(legal_name)")
    .eq("id", id)
    .single();
  if (!q) redirect("/quotations");
  if (q.project_id) redirect(`/projects/${q.project_id}`); // ya tiene trabajo abierto

  const customerName = (q.customers as unknown as { legal_name: string } | null)?.legal_name;
  const name = customerName ? `${customerName} — ${q.number}` : `Trabajo ${q.number}`;
  const cost = (q.cost_minor as number | null) ?? 0;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: org.id,
      name,
      customer_id: q.customer_id,
      status: "active",
      start_date: q.issue_date,
      budget_amount_minor: cost > 0 ? cost : null,
      created_by: user?.id,
    })
    .select("id").single();
  if (error || !project) {
    redirect(`/quotations/${id}?error=${encodeURIComponent(safeError(error, "No se pudo abrir el trabajo."))}`);
  }

  // Enlace en los dos sentidos: la cotización es el origen del trabajo y el
  // trabajo agrupa sus adicionales futuros.
  await supabase.from("quotations").update({ project_id: project.id }).eq("id", id);

  revalidatePath("/projects");
  revalidatePath("/quotations");
  redirect(`/projects/${project.id}`);
}
