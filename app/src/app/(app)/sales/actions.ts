"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createOpportunity(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const customer_id = String(formData.get("customer_id") ?? "") || null;
  const prospect_name = String(formData.get("prospect_name") ?? "").trim() || null;
  const prospect_contact = String(formData.get("prospect_contact") ?? "").trim() || null;
  const stage_id = String(formData.get("stage_id") ?? "");
  const pipeline_id = String(formData.get("pipeline_id") ?? "");
  const amount = toMinor(String(formData.get("amount") ?? "0"));
  const expected_close_date = String(formData.get("expected_close_date") ?? "") || null;
  const source = String(formData.get("source") ?? "").trim() || null;

  if (!title) redirect(`/sales/new?error=${encodeURIComponent("Escribe un título.")}`);
  if (!customer_id && !prospect_name) {
    redirect(`/sales/new?error=${encodeURIComponent("Indica un cliente o el nombre del prospecto.")}`);
  }

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("opportunities").insert({
    organization_id: org.id,
    title,
    customer_id,
    prospect_name,
    prospect_contact,
    pipeline_id,
    stage_id,
    amount_minor: amount,
    expected_close_date,
    source,
    owner_user_id: user?.id,
    created_by: user?.id,
  });
  if (error) redirect(`/sales/new?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/sales");
  redirect("/sales");
}

export async function moveOpportunity(formData: FormData) {
  const id = String(formData.get("opportunity_id") ?? "");
  const stage_id = String(formData.get("stage_id") ?? "");
  const supabase = await createClient();

  // Determinar estado según la etapa destino
  const { data: stage } = await supabase.from("stages").select("is_won, is_lost").eq("id", stage_id).maybeSingle();
  const status = stage?.is_won ? "won" : stage?.is_lost ? "lost" : "open";

  await supabase
    .from("opportunities")
    .update({ stage_id, status, stage_entered_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/sales");
  redirect("/sales");
}

export async function deleteOpportunity(formData: FormData) {
  const id = String(formData.get("opportunity_id") ?? "");
  const supabase = await createClient();
  await supabase.from("opportunities").delete().eq("id", id);
  revalidatePath("/sales");
  redirect("/sales");
}
