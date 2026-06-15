import nodemailer from "nodemailer";

/** Envía un correo desde el Gmail del negocio (SMTP). Devuelve true si se envió. */
export async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
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
    await transporter.sendMail({ from: `Zentro <${user}>`, to, subject, html });
    return true;
  } catch {
    return false;
  }
}

/** Plantilla HTML de marca para correos de la app. */
export function brandedEmail(title: string, bodyHtml: string, buttonText?: string, buttonUrl?: string): string {
  const button =
    buttonText && buttonUrl
      ? `<a href="${buttonUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:14px;font-weight:bold">${buttonText}</a>`
      : "";
  return `<div style="background:#f1f5f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif"><table align="center" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;border-collapse:separate"><tr><td style="background:#0f172a;padding:18px 24px;border-radius:16px 16px 0 0"><span style="color:#ffffff;font-size:20px;font-weight:bold">Zentro</span></td></tr><tr><td style="padding:24px"><h1 style="font-size:18px;color:#0f172a;margin:0 0 12px">${title}</h1><div style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">${bodyHtml}</div>${button}</td></tr><tr><td style="padding:14px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">Zentro &middot; el sistema operativo de tu negocio</td></tr></table></div>`;
}
