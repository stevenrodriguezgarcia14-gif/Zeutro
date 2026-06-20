"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendMail, brandedEmail } from "@/lib/email";

export async function updateOrganization(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const legal_name = String(formData.get("legal_name") ?? "").trim() || null;
  const tax_id = String(formData.get("tax_id") ?? "").trim() || null;
  const country = String(formData.get("country") ?? "MX");
  const base_currency = String(formData.get("base_currency") ?? "MXN");
  const quick_sale_tax_bps = Math.max(0, Math.round((Number(formData.get("quick_sale_tax_pct") ?? 0) || 0) * 100));

  if (!name) {
    redirect(`/settings?error=${encodeURIComponent("El nombre del negocio es obligatorio.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ name, legal_name, tax_id, country, base_currency, quick_sale_tax_bps })
    .eq("id", id);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/", "layout");
  redirect("/settings?ok=1");
}

export async function updateBusinessType(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const business_type = String(formData.get("business_type") ?? "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ business_type }).eq("id", id);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  revalidatePath("/guide");
  redirect("/settings?ok=1");
}

export async function saveLogo(orgId: string, url: string) {
  const supabase = await createClient();
  await supabase.from("organizations").update({ logo_url: url }).eq("id", orgId);
  revalidatePath("/", "layout");
}

export async function inviteUser(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member");
  if (!email) redirect(`/settings?error=${encodeURIComponent("Escribe el correo a invitar.")}`);

  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id, name").limit(1).maybeSingle();
  if (!org) redirect("/onboarding");
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("invitations")
    .upsert({ organization_id: org.id, email, role, status: "pending", created_by: user?.id }, { onConflict: "organization_id,email" });
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);

  // Enviar correo de invitación (no bloquea si falla el envío)
  const origin = (await headers()).get("origin") ?? "https://zentro-ten-phi.vercel.app";
  const html = brandedEmail(
    `Te invitaron a ${org.name} en Zentro`,
    `<p>Te uniste a un equipo en <b>Zentro</b>, el sistema operativo del negocio.</p>
     <p>Para entrar, crea tu cuenta (o inicia sesión) usando <b>este mismo correo</b>: ${email}. Te unirás automáticamente.</p>`,
    "Crear mi cuenta",
    `${origin}/register`,
  );
  await sendMail(email, `Invitación a ${org.name} — Zentro`, html);

  redirect(`/settings?ok=invite`);
}

export async function cancelInvitation(formData: FormData) {
  const id = String(formData.get("invitation_id") ?? "");
  const supabase = await createClient();
  await supabase.from("invitations").delete().eq("id", id);
  redirect("/settings?ok=1");
}

export async function changeMemberRole(formData: FormData) {
  const org_id = String(formData.get("org_id") ?? "");
  const user_id = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "member");
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("organization_id", org_id)
    .eq("user_id", user_id);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  redirect("/settings?ok=1");
}

export async function removeMember(formData: FormData) {
  const org_id = String(formData.get("org_id") ?? "");
  const user_id = String(formData.get("user_id") ?? "");
  const supabase = await createClient();
  await supabase.from("memberships").delete().eq("organization_id", org_id).eq("user_id", user_id);
  redirect("/settings?ok=1");
}

export async function deleteOrganization(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "BORRAR") {
    redirect(`/settings?error=${encodeURIComponent('Para borrar, escribe BORRAR en el campo de confirmación.')}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/", "layout");
  redirect("/settings?deleted=1");
}
