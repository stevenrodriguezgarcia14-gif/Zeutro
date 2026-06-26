"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createOpportunity(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const prospect_name = String(formData.get("prospect_name") ?? "").trim() || null;
  const prospect_contact = String(formData.get("prospect_contact") ?? "").trim() || null;
  const stage_id = String(formData.get("stage_id") ?? "");
  const pipeline_id = String(formData.get("pipeline_id") ?? "");
  const amount = toMinor(String(formData.get("amount") ?? "0"));
  const expected_close_date = String(formData.get("expected_close_date") ?? "") || null;
  const source = String(formData.get("source") ?? "").trim() || null;

  if (!title) redirect(`/sales/new?error=${encodeURIComponent("Escribe un título.")}`);
  if (!customer_id && !prospect_name) {
    redirect(`/sales/new?error=${encodeURIComponent("Indica un cliente o el nombre del prospecto.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("opportunities").insert({
    organization_id: org.id,
    title,
    customer_id,
    prospect_name,
    prospect_contact,
    pipeline_id,
    stage_id,
    amount_minor: amount,
    expected_close_date,
    source,
    owner_user_id: user?.id,
    created_by: user?.id,
  });
  if (error) redirect(`/sales/new?error=${encodeURIComponent(safeError(error))}`);

  revalidatePath("/sales");
  redirect("/sales");
}

export async function moveOpportunity(formData: FormData) {
  const id = String(formData.get("opportunity_id") ?? "");
  const stage_id = String(formData.get("stage_id") ?? "");
  const supabase = await createClient();

  // Determinar estado según la etapa destino
  const { data: stage } = await supabase.from("stages").select("is_won, is_lost").eq("id", stage_id).maybeSingle();
  const status = stage?.is_won ? "won" : stage?.is_lost ? "lost" : "open";

  await supabase
    .from("opportunities")
    .update({ stage_id, status, stage_entered_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/sales");
  redirect("/sales");
}

export async function deleteOpportunity(formData: FormData) {
  const id = String(formData.get("opportunity_id") ?? "");
  const supabase = await createClient();
  await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/sales");
  redirect("/sales");
}

// Cierra el ciclo: convierte una oportunidad ganada en una factura (borrador).
export async function convertOpportunityToInvoice(formData: FormData) {
  const id = String(formData.get("opportunity_id") ?? "");
  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, title, amount_minor, customer_id")
    .eq("id", id)
    .single();
  if (!opp) redirect("/sales?error=" + encodeURIComponent("Oportunidad no encontrada."));
  if (!opp.customer_id) {
    redirect("/sales?error=" + encodeURIComponent("Esta oportunidad es de un prospecto. Conviértelo en cliente antes de facturar."));
  }

  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const { data: number, error: numErr } = await supabase.rpc("next_doc_number", {
    p_org: org.id, p_type: "invoice", p_prefix: "F-", p_seed: count ?? 0,
  });
  if (numErr || !number) redirect("/sales?error=" + encodeURIComponent(safeError(numErr, "No se pudo generar el folio.")));

  const due = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  const amount = opp.amount_minor ?? 0;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id, customer_id: opp.customer_id, number, currency: org.base_currency,
      issue_date: new Date().toISOString().slice(0, 10), due_date: due,
      subtotal_minor: amount, tax_minor: 0, total_minor: amount, status: "draft", created_by: user?.id,
    })
    .select("id").single();
  if (error || !invoice) redirect("/sales?error=" + encodeURIComponent(safeError(error, "No se pudo crear la factura.")));

  await supabase.from("invoice_items").insert({
    organization_id: org.id, invoice_id: invoice.id, description: opp.title,
    quantity: 1, unit_price_minor: amount, discount_pct: 0, tax_rate_bps: 0, line_total_minor: amount,
  });
  await supabase.from("opportunities").update({ status: "won" }).eq("id", id);

  revalidatePath("/sales");
  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}
