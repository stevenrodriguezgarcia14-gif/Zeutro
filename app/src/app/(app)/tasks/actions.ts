"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

const RECURRENCES = new Set(["none", "daily", "weekly", "monthly"]);

/** Avanza una fecha (YYYY-MM-DD) según el periodo de recurrencia. */
function advanceDate(base: string | null, recurrence: string): string {
  const d = base ? new Date(base + "T00:00:00") : new Date();
  if (recurrence === "daily") d.setDate(d.getDate() + 1);
  else if (recurrence === "weekly") d.setDate(d.getDate() + 7);
  else if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createTask(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const due_date = String(formData.get("due_date") ?? "") || null;
  const project_id = String(formData.get("project_id") ?? "") || null;
  const recurrenceRaw = String(formData.get("recurrence") ?? "none");
  const recurrence = RECURRENCES.has(recurrenceRaw) ? recurrenceRaw : "none";
  const redirectTo = String(formData.get("redirect_to") ?? "/tasks");
  if (!title) redirect(`${redirectTo}?error=${encodeURIComponent("Escribe la tarea.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("tasks").insert({
    organization_id: org.id, title, priority, due_date, project_id, recurrence, assignee_id: user?.id, created_by: user?.id,
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

  // Al completar una tarea recurrente, generar la siguiente ocurrencia.
  if (done) {
    const { data: t } = await supabase
      .from("tasks")
      .select("organization_id, title, description, priority, due_date, project_id, customer_id, assignee_id, recurrence")
      .eq("id", id)
      .single();
    if (t && t.recurrence && t.recurrence !== "none") {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("tasks").insert({
        organization_id: t.organization_id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        due_date: advanceDate(t.due_date, t.recurrence),
        project_id: t.project_id,
        customer_id: t.customer_id,
        assignee_id: t.assignee_id,
        recurrence: t.recurrence,
        created_by: user?.id,
      });
    }
  }

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
