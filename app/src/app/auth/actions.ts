"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto exige confirmación por correo, no habrá sesión todavía.
  if (!data.session) {
    redirect(`/login?info=${encodeURIComponent("Revisa tu correo para confirmar la cuenta y luego inicia sesión.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
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
  if (password.length < 6) {
    redirect(`/auth/update-password?error=${encodeURIComponent("La contraseña debe tener al menos 6 caracteres.")}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect(`/login?info=${encodeURIComponent("Contraseña actualizada. Inicia sesión.")}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
