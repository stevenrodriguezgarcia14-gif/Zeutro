"use server";

import { revalidatePath } from "next/cache";
import { safeError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { toMinor } from "@/lib/money";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "bank");
  const opening = toMinor(String(formData.get("opening_balance") ?? "0"));
  const institution = String(formData.get("institution") ?? "").trim() || null;

  if (!name) redirect(`/accounts/new?error=${encodeURIComponent("El nombre es obligatorio.")}`);

  const org = await getCurrentOrg();
  if (!org) redirect("/onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("accounts").insert({
    organization_id: org.id,
    name,
    type,
    currency: org.base_currency,
    opening_balance_minor: opening,
    current_balance_minor: opening,
    institution,
    created_by: user?.id,
  });

  if (error) redirect(`/accounts/new?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}

export async function recordMovement(formData: FormData) {
  const account_id = String(formData.get("account_id") ?? "");
  const direction = String(formData.get("direction") ?? "in"); // 'in' | 'out'
  const amount = toMinor(String(formData.get("amount") ?? "0"));
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);
  const description = String(formData.get("description") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("record_account_movement", {
    p_account_id: account_id,
    p_direction: direction,
    p_amount_minor: amount,
    p_date: date,
    p_description: description,
  });

  if (error) redirect(`/accounts/${account_id}?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath(`/accounts/${account_id}`);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect(`/accounts/${account_id}`);
}

export async function transfer(formData: FormData) {
  const from = String(formData.get("from_account") ?? "");
  const to = String(formData.get("to_account") ?? "");
  const amount = toMinor(String(formData.get("amount") ?? "0"));
  const date = String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { error } = await supabase.rpc("transfer_between_accounts", {
    p_from: from,
    p_to: to,
    p_amount_minor: amount,
    p_date: date,
    p_description: "Transferencia",
  });

  if (error) redirect(`/accounts?error=${encodeURIComponent(safeError(error))}`);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}
