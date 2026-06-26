"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function addInteraction(formData: FormData) {
  const customer_id = String(formData.get("customer_id") ?? "");
  const type = String(formData.get("type") ?? "note");
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim() || null;
  const occurred_at = String(formData.get("occurred_at") ?? "") || new Date().toISOString();

  if (!customer_id) redirect("/customers");
  if (!subject && !body) {
    redirect(`/customers/${customer_id}?error=${encodeURIComponent("Escribe al menos un asunto o una nota.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("interactions").insert({
    organization_id: org.id,
    customer_id,
    type,
    subject,
    body,
    occurred_at,
    created_by: user?.id,
  });

  if (error) redirect(`/customers/${customer_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/customers/${customer_id}`);
  redirect(`/customers/${customer_id}`);
}
