import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Procesa enlaces de correo. Soporta ambos formatos de plantilla de Supabase:
 *   - PKCE: ?code=...                  -> exchangeCodeForSession
 *   - OTP:  ?token_hash=...&type=...   -> verifyOtp
 * Escribe las cookies de sesión DIRECTAMENTE sobre la respuesta de redirección
 * (necesario en route handlers para que el navegador quede logueado).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("El enlace no es válido o ya expiró. Pídelo de nuevo.")}`,
  );
}
