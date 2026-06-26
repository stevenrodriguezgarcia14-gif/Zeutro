"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function createAppointment(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "") || "09:00";
  const duration_min = Number(formData.get("duration_min") ?? 60) || 60;
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) redirect(`/calendar?error=${encodeURIComponent("Ponle un título a la cita.")}`);
  if (!date) redirect(`/calendar?error=${encodeURIComponent("Elige la fecha de la cita.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se guarda como timestamptz a partir de la fecha+hora local que escribe el usuario.
  const starts_at = new Date(`${date}T${time}:00`).toISOString();

  const { error } = await supabase.from("appointments").insert({
    organization_id: org.id, title, customer_id, starts_at, duration_min, location, notes, created_by: user?.id,
  });
  if (error) redirect(`/calendar?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath("/calendar");
  redirect("/calendar?ok=1");
}

export async function deleteAppointment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("appointments").delete().eq("id", id);
  revalidatePath("/calendar");
  redirect("/calendar?ok=del");
}
