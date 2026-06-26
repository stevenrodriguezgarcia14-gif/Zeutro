import nodemailer from "nodemailer";
import { report } from "@/lib/log";

/** Escapa texto para interpolarlo de forma segura dentro de HTML (evita inyección). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Envía un correo transaccional. Devuelve true si se envió.
 *
 * Proveedor:
 *  - Si está definido RESEND_API_KEY, usa Resend (recomendado en producción:
 *    dominio propio, SPF/DKIM, escala). Configura también MAIL_FROM.
 *  - Si no, usa el SMTP de Gmail actual (GMAIL_USER / GMAIL_APP_PASS).
 * Así puedes migrar a un proveedor profesional sin tocar el código: solo añades
 * las variables de entorno.
 */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  const from = process.env.MAIL_FROM || (process.env.GMAIL_USER ? `Zentro <${process.env.GMAIL_USER}>` : "");

  // Opción A: Resend (si está configurado)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: from || "Zentro <onboarding@resend.dev>", to, subject, html }),
      });
      if (!res.ok) {
        report("sendMail.resend", new Error(`HTTP ${res.status}`), { to, subject });
        return false;
      }
      return true;
    } catch (e) {
      report("sendMail.resend", e, { to, subject });
      return false;
    }
  }

  // Opción B: Gmail SMTP (configuración actual)
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;
  if (!user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({ from: from || `Zentro <${user}>`, to, subject, html });
    return true;
  } catch (e) {
    report("sendMail.gmail", e, { to, subject });
    return false;
  }
}

/**
 * Plantilla HTML de marca para correos de la app.
 * `title` y `buttonText` se escapan automáticamente. `bodyHtml` es HTML de
 * confianza definido por nosotros: si interpolas datos del usuario dentro,
 * pásalos por `escapeHtml()` antes.
 */
export function brandedEmail(title: string, bodyHtml: string, buttonText?: string, buttonUrl?: string): string {
  const safeTitle = escapeHtml(title);
  const safeButtonText = buttonText ? escapeHtml(buttonText) : "";
  const safeButtonUrl = buttonUrl ? encodeURI(buttonUrl) : "";
  const button =
    safeButtonText && safeButtonUrl
      ? `<a href="${safeButtonUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold">${safeButtonText}</a>`
      : "";
  return `<div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><table align="center" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;border-collapse:separate"><tr><td style="background:#0f172a;padding:18px 24px;border-radius:16px 16px 0 0"><span style="color:#ffffff;font-size:20px;font-weight:bold">Zentro</span></td></tr><tr><td style="padding:24px"><h1 style="font-size:18px;color:#0f172a;margin:0 0 12px">${safeTitle}</h1><div style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">${bodyHtml}</div>${button}</td></tr><tr><td style="padding:14px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">Zentro &middot; el sistema operativo de tu negocio</td></tr></table></div>`;
}
