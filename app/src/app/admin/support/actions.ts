"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMail, brandedEmail, escapeHtml } from "@/lib/email";
import { safeError } from "@/lib/errors";
import { FOUNDER_NAME } from "@/lib/founder";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentro-ten-phi.vercel.app";

/** Respuesta del fundador: guarda el mensaje y avisa por correo al dueño. */
export async function founderReply(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!orgId || !body) redirect(`/admin/support/${orgId}?error=${encodeURIComponent("Escribe una respuesta.")}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("support_messages").insert({
    organization_id: orgId,
    user_id: user?.id,
    sender: "founder",
    body,
  });
  if (error) redirect(`/admin/support/${orgId}?error=${encodeURIComponent(safeError(error, "No se pudo enviar."))}`);

  // Avisar al dueño por correo para que vuelva a la app a leer la respuesta.
  const { data: overview } = await supabase.rpc("admin_support_overview");
  const row = ((overview ?? []) as { organization_id: string; org_name: string; owner_email: string | null }[])
    .find((r) => r.organization_id === orgId);
  if (row?.owner_email) {
    const html = brandedEmail(
      `${FOUNDER_NAME} te respondió en Zentro`,
      `<p>Tienes una respuesta del fundador en el chat de <b>${escapeHtml(row.org_name)}</b>:</p>
       <p style="background:#f1f5f9;border-radius:10px;padding:12px">${escapeHtml(body).slice(0, 500)}</p>
       <p>Ábrela desde el botón de chat (abajo a la derecha) dentro de Zentro.</p>`,
      "Abrir Zentro",
      `${APP_URL}/dashboard`,
    );
    await sendMail(row.owner_email, `💬 ${FOUNDER_NAME} te respondió en Zentro`, html);
  }

  revalidatePath(`/admin/support/${orgId}`);
  revalidatePath("/admin/support");
  redirect(`/admin/support/${orgId}?ok=1`);
}
