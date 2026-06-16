"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const start_date = String(formData.get("start_date") ?? "") || null;
  const end_date = String(formData.get("end_date") ?? "") || null;
  const budget = String(formData.get("budget") ?? "").trim();
  const budget_amount_minor = budget ? toMinor(budget) : null;
  if (!name) redirect(`/projects/new?error=${encodeURIComponent("Ponle nombre al proyecto.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ organization_id: org.id, name, customer_id, start_date, end_date, budget_amount_minor, created_by: user?.id })
    .select("id").single();
  if (error || !project) redirect(`/projects/new?error=${encodeURIComponent(error?.message ?? "Error")}`);
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const status = String(formData.get("status") ?? "active");
  const supabase = await createClient();
  await supabase.from("projects").update({ status }).eq("id", id);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  const id = String(formData.get("project_id") ?? "");
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/projects");
  redirect("/projects");
}
