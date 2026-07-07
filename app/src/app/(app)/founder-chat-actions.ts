"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { sendMail, brandedEmail, escapeHtml } from "@/lib/email";
import { safeError } from "@/lib/errors";
import { FOUNDER_EMAIL } from "@/lib/founder";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentro-ten-phi.vercel.app";

export type ChatMessage = {
  id: string;
  sender: "user" | "founder";
  body: string;
  created_at: string;
};

/** Conversación del negocio activo (y marca como leídas las respuestas del fundador). */
export async function getSupportThread(): Promise<ChatMessage[]> {
  const org = await getCurrentOrg();
  if (!org) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_messages")
    .select("id, sender, body, created_at")
    .order("created_at", { ascending: true })
    .limit(200);
  await supabase.rpc("mark_support_read", { p_org: org.id });
  return (data ?? []) as ChatMessage[];
}

/** Respuestas del fundador aún no leídas (para el badge del widget). */
export async function getSupportUnread(): Promise<number> {
  const org = await getCurrentOrg();
  if (!org) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("support_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender", "founder")
    .eq("read_by_user", false);
  return count ?? 0;
}

export async function sendSupportMessage(
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Escribe un mensaje." };
  if (text.length > 4000) return { ok: false, error: "Máximo 4000 caracteres." };

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "No hay un negocio activo." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ¿Hay que avisar al fundador por correo? Solo si el negocio no le escribió
  // en los últimos 15 minutos (una conversación activa = un solo aviso).
  const since = new Date(Date.now() - 15 * 60000).toISOString();
  const { data: recent } = await supabase
    .from("support_messages")
    .select("id")
    .eq("sender", "user")
    .gte("created_at", since)
    .limit(1);

  const { error } = await supabase.from("support_messages").insert({
    organization_id: org.id,
    user_id: user?.id,
    sender: "user",
    body: text,
  });
  if (error) return { ok: false, error: safeError(error, "No se pudo enviar el mensaje.") };

  if (!recent || recent.length === 0) {
    const html = brandedEmail(
      `${org.name} te escribió en Zentro`,
      `<p><b>${escapeHtml(org.name)}</b> inició una conversación en el chat de soporte:</p>
       <p style="background:#f1f5f9;border-radius:10px;padding:12px">${escapeHtml(text).slice(0, 500)}</p>`,
      "Responder ahora",
      `${APP_URL}/admin/support`,
    );
    // Tolerante a fallos: el chat funciona aunque el aviso por correo falle.
    await sendMail(FOUNDER_EMAIL, `💬 ${org.name} te escribió en Zentro`, html);
  }
  return { ok: true };
}
