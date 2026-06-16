"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function createCustomer(formData: FormData) {
  const legal_name = String(formData.get("legal_name") ?? "").trim();
  const type = String(formData.get("type") ?? "company");
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const tax_id = String(formData.get("tax_id") ?? "").trim() || null;
  const payment_terms = String(formData.get("payment_terms") ?? "contado");

  if (!legal_name) {
    redirect(`/customers/new?error=${encodeURIComponent("El nombre es obligatorio.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("customers").insert({
    organization_id: org.id,
    type,
    legal_name,
    email,
    phone,
    tax_id,
    payment_terms,
    currency: org.base_currency,
    created_by: user?.id,
  });

  if (error) {
    redirect(`/customers/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/customers");
  redirect("/customers");
}

export type ImportRow = {
  legal_name: string;
  type: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  payment_terms: string;
};

export type ImportResult = { inserted: number; skipped: number; error?: string };

/** Importa una lista de clientes en lote (desde CSV/Excel). */
export async function importCustomers(rows: ImportRow[]): Promise<ImportResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { inserted: 0, skipped: 0, error: "No se recibió ninguna fila." };
  }
  if (rows.length > 2000) {
    return { inserted: 0, skipped: 0, error: "Demasiadas filas (máximo 2000 por importación)." };
  }

  const org = await getCurrentOrg();
  if (!org) return { inserted: 0, skipped: 0, error: "No hay empresa activa." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const validTerms = new Set(["contado", "net15", "net30", "net60", "custom"]);
  const toInsert = [];
  let skipped = 0;
  for (const r of rows) {
    const legal_name = String(r.legal_name ?? "").trim();
    if (!legal_name) { skipped++; continue; }
    toInsert.push({
      organization_id: org.id,
      type: r.type === "person" ? "person" : "company",
      legal_name,
      email: r.email?.trim() || null,
      phone: r.phone?.trim() || null,
      tax_id: r.tax_id?.trim() || null,
      payment_terms: validTerms.has(r.payment_terms) ? r.payment_terms : "contado",
      currency: org.base_currency,
      created_by: user?.id,
    });
  }

  if (toInsert.length === 0) {
    return { inserted: 0, skipped, error: "Ninguna fila tenía nombre válido." };
  }

  const { error } = await supabase.from("customers").insert(toInsert);
  if (error) return { inserted: 0, skipped, error: error.message };

  revalidatePath("/customers");
  return { inserted: toInsert.length, skipped };
}
