"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "MX");
  const base_currency = String(formData.get("base_currency") ?? "MXN");
  const business_type = String(formData.get("business_type") ?? "").trim() || null;

  if (!name) {
    redirect(`/onboarding?error=${encodeURIComponent("El nombre del negocio es obligatorio.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Crea organización + membership de forma atómica (función SECURITY DEFINER).
  // Evita el problema de RLS de no poder leer la org recién creada sin ser miembro.
  const { error: rpcError } = await supabase.rpc("create_organization", {
    p_name: name,
    p_country: country,
    p_currency: base_currency,
    p_business_type: business_type,
  });

  if (rpcError) {
    redirect(`/onboarding?error=${encodeURIComponent(rpcError.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
