"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";
import { decrementStockForInvoice } from "@/lib/stock";

type LineInput = { product_id?: string | null; description: string; quantity: number; unit_price: number; tax_pct: number };

function computeTotals(lines: LineInput[]) {
  let subtotal = 0;
  let tax = 0;
  const items = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const unit = toMinor(l.unit_price);
    const net = Math.round(qty * unit);
    const taxBps = Math.round((Number(l.tax_pct) || 0) * 100);
    const lineTax = Math.round((net * taxBps) / 10000);
    subtotal += net;
    tax += lineTax;
    return { product_id: l.product_id || null, description: l.description, quantity: qty, unit_price_minor: unit, tax_rate_bps: taxBps, line_total_minor: net + lineTax };
  });
  return { subtotal, tax, total: subtotal + tax, items };
}

export async function createQuotation(formData: FormData) {
  const customer_id = String(formData.get("customer_id") ?? "");
  const issue_date = String(formData.get("issue_date") ?? "") || new Date().toISOString().slice(0, 10);
  const valid_until = String(formData.get("due_date") ?? "");
  const intent = String(formData.get("intent") ?? "draft");
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
  const number = "C-" + String((count ?? 0) + 1).padStart(4, "0");

  const { data: quotation, error } = await supabase
    .from("quotations")
    .insert({
      organization_id: org.id, customer_id, number, currency: org.base_currency,
      issue_date, valid_until, subtotal_minor: subtotal, tax_minor: tax, total_minor: total,
      status: intent === "send" ? "sent" : "draft", created_by: user?.id,
    })
    .select("id").single();
  if (error || !quotation) redirect(`/quotations/new?error=${encodeURIComponent(error?.message ?? "Error")}`);

  const itemsToInsert = items.map((it) => ({ ...it, organization_id: org.id, quotation_id: quotation.id }));
  const { error: itemsError } = await supabase.from("quotation_items").insert(itemsToInsert);
  if (itemsError) redirect(`/quotations/new?error=${encodeURIComponent(itemsError.message)}`);

  revalidatePath("/quotations");
  redirect(`/quotations/${quotation.id}`);
}

export async function setQuotationStatus(formData: FormData) {
  const id = String(formData.get("quotation_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  await supabase.from("quotations").update({ status }).eq("id", id);
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
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

  const { data: qItems } = await supabase.from("quotation_items").select("*").eq("quotation_id", id);

  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const number = "F-" + String((count ?? 0) + 1).padStart(4, "0");
  const due = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id, customer_id: q.customer_id, number, currency: q.currency,
      issue_date: new Date().toISOString().slice(0, 10), due_date: due,
      subtotal_minor: q.subtotal_minor, tax_minor: q.tax_minor, total_minor: q.total_minor,
      status: "issued", created_by: user?.id,
    })
    .select("id").single();
  if (error || !invoice) redirect(`/quotations/${id}?error=${encodeURIComponent(error?.message ?? "Error")}`);

  if (qItems && qItems.length > 0) {
    await supabase.from("invoice_items").insert(
      qItems.map((it) => ({
        organization_id: org.id, invoice_id: invoice.id, product_id: it.product_id,
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
  redirect(`/invoices/${invoice.id}`);
}
