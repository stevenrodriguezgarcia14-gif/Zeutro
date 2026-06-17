import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Procesa los enlaces de correo (confirmación de registro / recuperación).
 * Soporta AMBOS formatos de plantilla de Supabase para no depender de la
 * configuración exacta del panel:
 *   - flujo PKCE:  ?code=...                  -> exchangeCodeForSession
 *   - flujo OTP:   ?token_hash=...&type=...   -> verifyOtp
 * Redirige a `next` al confirmar.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("El enlace no es válido o ya expiró. Pídelo de nuevo.")}`,
  );
}
