"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

type LineInput = {
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number; // en unidades mayores (lo que escribe el usuario)
  tax_pct: number; // porcentaje, ej. 16
};

function computeTotals(lines: LineInput[]) {
  let subtotal = 0;
  let tax = 0;
  const items = lines.map((l) => {
    const qty = Number(l.quantity) || 0;
    const unit = toMinor(l.unit_price); // centavos
    const net = Math.round(qty * unit);
    const taxBps = Math.round((Number(l.tax_pct) || 0) * 100);
    const lineTax = Math.round((net * taxBps) / 10000);
    subtotal += net;
    tax += lineTax;
    return {
      product_id: l.product_id || null,
      description: l.description,
      quantity: qty,
      unit_price_minor: unit,
      discount_pct: 0,
      tax_rate_bps: taxBps,
      line_total_minor: net + lineTax,
    };
  });
  return { subtotal, tax, total: subtotal + tax, items };
}

export async function createInvoice(formData: FormData) {
  const customer_id = String(formData.get("customer_id") ?? "");
  const issue_date = String(formData.get("issue_date") ?? "") || new Date().toISOString().slice(0, 10);
  const due_date = String(formData.get("due_date") ?? "");
  const intent = String(formData.get("intent") ?? "draft"); // 'draft' | 'issue'
  const linesRaw = String(formData.get("items") ?? "[]");

  let lines: LineInput[] = [];
  try {
    lines = JSON.parse(linesRaw);
  } catch {
    lines = [];
  }
  lines = lines.filter((l) => l.description?.trim() && Number(l.quantity) > 0);

  if (!customer_id) redirect(`/invoices/new?error=${encodeURIComponent("Selecciona un cliente.")}`);
  if (lines.length === 0) redirect(`/invoices/new?error=${encodeURIComponent("Agrega al menos una línea con descripción y cantidad.")}`);
  if (!due_date) redirect(`/invoices/new?error=${encodeURIComponent("Indica la fecha de vencimiento.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { subtotal, tax, total, items } = computeTotals(lines);

  // Número de factura secuencial por organización (MVP).
  const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
  const number = "F-" + String((count ?? 0) + 1).padStart(4, "0");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      organization_id: org.id,
      customer_id,
      number,
      currency: org.base_currency,
      issue_date,
      due_date,
      subtotal_minor: subtotal,
      discount_minor: 0,
      tax_minor: tax,
      total_minor: total,
      status: intent === "issue" ? "issued" : "draft",
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !invoice) {
    redirect(`/invoices/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear la factura.")}`);
  }

  const itemsToInsert = items.map((it) => ({ ...it, organization_id: org.id, invoice_id: invoice.id }));
  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsError) {
    redirect(`/invoices/new?error=${encodeURIComponent(itemsError.message)}`);
  }

  revalidatePath("/invoices");
  redirect(`/invoices/${invoice.id}`);
}

export async function issueInvoice(formData: FormData) {
  const id = String(formData.get("invoice_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "issued" })
    .eq("id", id)
    .eq("status", "draft");
  if (error) redirect(`/invoices/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function registerPayment(formData: FormData) {
  const invoice_id = String(formData.get("invoice_id") ?? "");
  const amount = String(formData.get("amount") ?? "0");
  const account_id = String(formData.get("account_id") ?? "") || null;
  const method = String(formData.get("method") ?? "transfer");
  const paid_at = String(formData.get("paid_at") ?? "") || new Date().toISOString().slice(0, 10);
  const reference = String(formData.get("reference") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("register_payment", {
    p_invoice_id: invoice_id,
    p_amount_minor: toMinor(amount),
    p_account_id: account_id,
    p_method: method,
    p_paid_at: paid_at,
    p_reference: reference,
  });

  if (error) redirect(`/invoices/${invoice_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/invoices/${invoice_id}`);
  revalidatePath("/invoices");
  revalidatePath("/collections");
  redirect(`/invoices/${invoice_id}?paid=1`);
}
