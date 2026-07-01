import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Páginas informativas: nunca necesitan sesión ni refresh de tokens. */
const STATIC_PUBLIC = new Set(["/terminos", "/privacidad", "/seguridad"]);

/** Públicas, pero si hay sesión redirigen o pueden refrescar tokens. */
function isPublicPath(path: string) {
  return (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/auth") ||
    STATIC_PUBLIC.has(path)
  );
}

/**
 * Refresca la sesión de Supabase y protege rutas privadas.
 *
 * Fast-paths (evitan el round-trip a Supabase Auth en cada request):
 * - Páginas legales: se sirven tal cual, sin tocar auth.
 * - Visitante sin cookies de sesión: no hay nada que refrescar; solo se
 *   redirige a /login si la ruta es privada.
 */
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (STATIC_PUBLIC.has(path)) return NextResponse.next();

  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!hasSessionCookie) {
    if (isPublicPath(path)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión activa, la landing y las pantallas de acceso van al panel.
  if (user && (path === "/" || path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
