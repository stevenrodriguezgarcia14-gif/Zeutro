"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const due_date = String(formData.get("due_date") ?? "") || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const redirectTo = String(formData.get("redirect_to") ?? "/tasks");
  if (!title) redirect(`${redirectTo}?error=${encodeURIComponent("Escribe la tarea.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    organization_id: org.id, title, priority, due_date, project_id, assignee_id: user?.id, created_by: user?.id,
  });
  if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(redirectTo);
  revalidatePath("/priorities");
  redirect(redirectTo);
}

export async function toggleTask(formData: FormData) {
  const id = String(formData.get("task_id") ?? "");
  const done = String(formData.get("done") ?? "") === "1";
  const redirectTo = String(formData.get("redirect_to") ?? "/tasks");
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath(redirectTo);
  revalidatePath("/priorities");
  redirect(redirectTo);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("task_id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/tasks");
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath(redirectTo);
  redirect(redirectTo);
}
