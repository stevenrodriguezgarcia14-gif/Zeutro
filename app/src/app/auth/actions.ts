"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { authErrorEs, isUnconfirmedEmail } from "@/lib/authErrors";
import { sendMail, brandedEmail, escapeHtml } from "@/lib/email";
import { FOUNDER_EMAIL } from "@/lib/founder";
import { report } from "@/lib/log";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Si el correo no está confirmado, ofrecer reenvío en la pantalla de login.
    const extra = isUnconfirmedEmail(error.message) ? `&resend=${encodeURIComponent(email)}` : "";
    redirect(`/login?error=${encodeURIComponent(authErrorEs(error.message))}${extra}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();
  const accepted = formData.get("accept") === "yes";

  if (!accepted) {
    redirect(`/register?error=${encodeURIComponent("Debes aceptar los Términos y el Aviso de Privacidad para crear tu cuenta.")}`);
  }
  if (password.length < 12) {
    redirect(`/register?error=${encodeURIComponent("La contraseña debe tener al menos 12 caracteres.")}`);
  }
  if (password !== password2) {
    redirect(`/register?error=${encodeURIComponent("Las contraseñas no coinciden.")}`);
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "https://zentro-ten-phi.vercel.app";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(authErrorEs(error.message))}`);
  }

  // Aviso interno al fundador: cada registro cuenta en esta etapa. Nunca debe
  // bloquear ni romper el registro del usuario, por eso se tolera el fallo.
  try {
    await sendMail(
      FOUNDER_EMAIL,
      `🎉 Nuevo registro en Zentro: ${email}`,
      brandedEmail(
        "Nuevo registro en Zentro",
        `<p><b>${escapeHtml(full_name || "(sin nombre)")}</b> acaba de crear una cuenta con <b>${escapeHtml(email)}</b>.</p>
         <p>Buen momento para saludarle por el chat de soporte cuando entre.</p>`,
      ),
    );
  } catch (e) {
    report("register.notifyFounder", e);
  }

  // Si el proyecto exige confirmación por correo, no habrá sesión todavía.
  if (!data.session) {
    redirect(`/login?info=${encodeURIComponent(`Te enviamos un correo a ${email} para confirmar tu cuenta. Revisa tu bandeja y spam, luego inicia sesión.`)}&resend=${encodeURIComponent(email)}`);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`/login?error=${encodeURIComponent("Escribe tu correo para reenviar la confirmación.")}`);

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "https://zentro-ten-phi.vercel.app";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(authErrorEs(error.message))}&resend=${encodeURIComponent(email)}`);
  redirect(`/login?info=${encodeURIComponent("Listo, te reenviamos el correo de confirmación. Revisa tu bandeja y spam.")}`);
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`/forgot-password?error=${encodeURIComponent("Escribe tu correo.")}`);

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "https://zentro-ten-phi.vercel.app";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  // Siempre el mismo mensaje (no revelar si el correo existe)
  redirect(`/login?info=${encodeURIComponent("Si el correo existe, te enviamos un enlace para restablecer la contraseña. Revisa tu bandeja y spam.")}`);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  if (password.length < 12) {
    redirect(`/auth/update-password?error=${encodeURIComponent("La contraseña debe tener al menos 12 caracteres.")}`);
  }
  if (password !== password2) {
    redirect(`/auth/update-password?error=${encodeURIComponent("Las contraseñas no coinciden.")}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(authErrorEs(error.message))}`);
  }
  // Tras cambiar la contraseña, revocar TODAS las sesiones (incluidas las de
  // otros dispositivos) para que un atacante con una sesión previa quede fuera.
  await supabase.auth.signOut({ scope: "global" });
  revalidatePath("/", "layout");
  redirect(`/login?info=${encodeURIComponent("Contraseña actualizada. Inicia sesión.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
