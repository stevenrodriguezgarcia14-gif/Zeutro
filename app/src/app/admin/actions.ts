"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setOrgStatus(formData: FormData) {
  const org_id = String(formData.get("org_id") ?? "");
  const status = String(formData.get("status") ?? "active");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_org_status", { p_org: org_id, p_status: status });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?ok=1");
}

export async function setOrgPlan(formData: FormData) {
  const org_id = String(formData.get("org_id") ?? "");
  const plan = String(formData.get("plan") ?? "free");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_org_plan", { p_org: org_id, p_plan: plan });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?ok=1");
}

export async function deleteOrg(formData: FormData) {
  const org_id = String(formData.get("org_id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "BORRAR") redirect(`/admin?error=${encodeURIComponent("Escribe BORRAR para confirmar.")}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_org", { p_org: org_id });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?ok=1");
}
