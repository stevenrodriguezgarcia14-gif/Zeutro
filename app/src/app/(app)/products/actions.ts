"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "service");
  const unit = String(formData.get("unit") ?? "unidad").trim() || "unidad";
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) {
    redirect(`/products/new?error=${encodeURIComponent("El nombre es obligatorio.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      organization_id: org.id,
      type,
      name,
      unit,
      description,
      sale_price_minor: 0, // se define luego con los precios sugeridos
      created_by: user?.id,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect(`/products/new?error=${encodeURIComponent(error?.message ?? "No se pudo crear.")}`);
  }

  revalidatePath("/products");
  // Llevar a la ficha para subir foto y configurar costos/precio
  redirect(`/products/${product.id}`);
}
