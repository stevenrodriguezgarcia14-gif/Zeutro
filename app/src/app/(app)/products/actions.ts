"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "service");
  const unit = String(formData.get("unit") ?? "unidad").trim() || "unidad";
  const sale_price_minor = toMinor(String(formData.get("sale_price") ?? "0"));
  const cost_raw = String(formData.get("cost_price") ?? "").trim();
  const cost_price_minor = cost_raw ? toMinor(cost_raw) : null;

  if (!name) {
    redirect(`/products/new?error=${encodeURIComponent("El nombre es obligatorio.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("products").insert({
    organization_id: org.id,
    type,
    name,
    unit,
    sale_price_minor,
    cost_price_minor,
    created_by: user?.id,
  });

  if (error) {
    redirect(`/products/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/products");
  redirect("/products");
}
