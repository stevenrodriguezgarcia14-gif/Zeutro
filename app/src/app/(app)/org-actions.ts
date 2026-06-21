"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setActiveOrg(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  // La empresa activa vive en la base (set_active_org valida pertenencia), así
  // la RLS y la app siempre coinciden y los datos quedan aislados por empresa.
  const supabase = await createClient();
  await supabase.rpc("set_active_org", { p_org: id });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Oculta la tarjeta de activación del dashboard (sigue disponible en el Centro de Orientación). */
export async function dismissActivation() {
  const c = await cookies();
  c.set("zentro_hide_activation", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
