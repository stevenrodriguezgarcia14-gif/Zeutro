"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganization(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const legal_name = String(formData.get("legal_name") ?? "").trim() || null;
  const tax_id = String(formData.get("tax_id") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "MX");
  const base_currency = String(formData.get("base_currency") ?? "MXN");

  if (!name) {
    redirect(`/settings?error=${encodeURIComponent("El nombre del negocio es obligatorio.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, legal_name, tax_id, country, base_currency })
    .eq("id", id);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/", "layout");
  redirect("/settings?ok=1");
}

export async function saveLogo(orgId: string, url: string) {
  const supabase = await createClient();
  await supabase.from("organizations").update({ logo_url: url }).eq("id", orgId);
  revalidatePath("/", "layout");
}

export async function deleteOrganization(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "BORRAR") {
    redirect(`/settings?error=${encodeURIComponent('Para borrar, escribe BORRAR en el campo de confirmación.')}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/", "layout");
  redirect("/settings?deleted=1");
}
