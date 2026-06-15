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
