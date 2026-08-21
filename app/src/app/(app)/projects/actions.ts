"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { addDays, addMonths } from "@/lib/weeks";
import { toMinor } from "@/lib/money";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const start_date = String(formData.get("start_date") ?? "") || null;
  const end_date = String(formData.get("end_date") ?? "") || null;
  const site_address = String(formData.get("site_address") ?? "").trim() || null;
  // OJO: `budget_amount_minor` se compara contra los GASTOS del trabajo, así
  // que es el COSTO ESTIMADO, no el precio que se le cobra al cliente. El
  // precio sale solo de las cotizaciones aceptadas del trabajo.
  const budget = String(formData.get("budget") ?? "").trim();
  const budget_amount_minor = budget ? toMinor(budget) : null;
  if (!name) redirect(`/projects/new?error=${encodeURIComponent("Ponle nombre al proyecto.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, name, customer_id, start_date, end_date, site_address, budget_amount_minor, created_by: user?.id })
    .select("id").single();
  if (error || !project) redirect(`/projects/new?error=${encodeURIComponent(safeError(error, "Error"))}`);
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

/** Edita los datos del trabajo desde su propia ficha. */
export async function updateProject(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const start_date = String(formData.get("start_date") ?? "") || null;
  const end_date = String(formData.get("end_date") ?? "") || null;
  const site_address = String(formData.get("site_address") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const budget = String(formData.get("budget") ?? "").trim();
  const budget_amount_minor = budget ? toMinor(budget) : null;

  if (!name) redirect(`/projects/${id}?error=${encodeURIComponent("El trabajo necesita un nombre.")}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name, customer_id, start_date, end_date, site_address, notes, budget_amount_minor })
    .eq("id", id);
  if (error) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(error))}`);

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
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

/**
 * Fija hasta cuándo respondes por el trabajo y agenda el recordatorio.
 *
 * No hay módulo de garantías: la garantía es una FECHA en el trabajo más una
 * TAREA con esa fecha, que ya aparece sola en el Centro de Prioridades y en
 * el Calendario. Reutilizar sale mejor que inventar un módulo que nadie
 * abriría.
 */
export async function setProjectWarranty(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const months = Number(formData.get("months") ?? 0);
  const supabase = await createClient();

  const { data: p } = await supabase
    .from("projects")
    .select("id, name, organization_id, customer_id, end_date")
    .eq("id", id)
    .single();
  if (!p) redirect("/projects");

  if (!Number.isFinite(months) || months <= 0) {
    await supabase.from("projects").update({ warranty_until: null }).eq("id", id);
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
  }

  const hoy = await getOrgToday();
  const base = p.end_date && /^\d{4}-\d{2}-\d{2}$/.test(p.end_date) ? p.end_date : hoy;
  const until = addMonths(base, months);

  const { error } = await supabase.from("projects").update({ warranty_until: until }).eq("id", id);
  if (error) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(error))}`);

  // Una sola tarea de revisión por trabajo: si ya existe, no se duplica.
  const title = `Revisión de garantía — ${p.name}`;
  const { data: yaExiste } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", id)
    .eq("title", title)
    .maybeSingle();

  if (!yaExiste) {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("tasks").insert({
      organization_id: p.organization_id,
      title,
      description: "Llamar al cliente, revisar el trabajo entregado y corregir detalles antes de que venza la garantía.",
      priority: "medium",
      due_date: until,
      project_id: id,
      customer_id: p.customer_id,
      assignee_id: user?.id,
      created_by: user?.id,
    });
  } else {
    await supabase.from("tasks").update({ due_date: until }).eq("id", yaExiste.id);
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath("/tasks");
  revalidatePath("/priorities");
  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const supabase = await createClient();
  // Antes se ignoraba el error: si el borrado fallaba (por ejemplo por una
  // llave foránea), el usuario volvía al listado y el trabajo seguía ahí,
  // sin explicación. Ahora se le dice qué pasó.
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(error, "No se pudo eliminar el trabajo."))}`);
  revalidatePath("/projects");
  redirect("/projects");
}

/**
 * Factura un AVANCE del trabajo: anticipo, corte intermedio o liquidación.
 *
 * Antes esta acción emitía de golpe una factura borrador por el total del
 * "presupuesto". Ningún trabajo por encargo se cobra así: se cobra un
 * anticipo, luego avances y al final la liquidación. Facturar el 100% de
 * entrada dejaba al usuario sin forma de registrar el anticipo (y
 * `register_payment` rechaza pagar un borrador, así que se quedaba trabado).
 *
 * Compatibilidad: si no llega ni concepto ni monto, se comporta como antes
 * (factura borrador por el costo estimado del trabajo).
 */
export async function createProjectInvoice(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const intent = String(formData.get("intent") ?? "issue"); // 'issue' | 'draft'
  const conceptRaw = String(formData.get("concept") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const taxPctRaw = String(formData.get("tax_pct") ?? "0").trim();

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

  const base = amountRaw ? toMinor(amountRaw) : (p.budget_amount_minor ?? 0);
  if (base <= 0) {
    redirect(`/projects/${id}?error=${encodeURIComponent("Escribe cuánto vas a cobrar en esta factura.")}`);
  }
  const taxBps = Math.round((parseFloat(taxPctRaw) || 0) * 100);
  const taxMinor = Math.round((base * taxBps) / 10000);
  const total = base + taxMinor;
  const concept = conceptRaw || `Proyecto: ${p.name}`;

  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const { data: number, error: numErr } = await supabase.rpc("next_doc_number", {
    p_org: org.id, p_type: "invoice", p_prefix: "F-", p_seed: count ?? 0,
  });
  if (numErr || !number) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(numErr, "No se pudo generar el folio."))}`);

  const hoy = await getOrgToday();
  const due = addDays(hoy, 15);
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id, customer_id: p.customer_id, number, currency: org.base_currency,
      issue_date: hoy, due_date: due,
      subtotal_minor: base, tax_minor: taxMinor, total_minor: total,
      // Emitida por defecto: una factura en borrador NO se puede cobrar
      // (register_payment la rechaza) y el objetivo de esta acción es cobrar.
      status: intent === "draft" ? "draft" : "issued",
      project_id: id, created_by: user?.id,
    })
    .select("id").single();
  if (error || !invoice) redirect(`/projects/${id}?error=${encodeURIComponent(safeError(error, "No se pudo crear la factura."))}`);

  await supabase.from("invoice_items").insert({
    organization_id: org.id, invoice_id: invoice.id, description: concept,
    quantity: 1, unit_price_minor: base, discount_pct: 0, tax_rate_bps: taxBps,
    line_total_minor: total, position: 0,
  });

  revalidatePath("/invoices");
  revalidatePath(`/projects/${id}`);
  redirect(`/invoices/${invoice.id}`);
}
