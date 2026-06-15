import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Procesa enlaces de correo (recuperar contraseña, confirmar registro) usando
 * token_hash + verifyOtp. Funciona desde cualquier navegador/dispositivo
 * (no depende de cookies PKCE), por eso es el método robusto para correos.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("El enlace no es válido o ya expiró. Pídelo de nuevo.")}`);
}
