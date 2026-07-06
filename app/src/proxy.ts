import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * - _next/static, _next/image, favicon
     * - archivos estáticos comunes (imágenes, VIDEO/audio y fuentes)
     * IMPORTANTE: incluir mp4/webm aquí; si no, el middleware intercepta la
     * petición del video de la landing y la redirige a /login (no carga).
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov|m4v|mp3|ogg|wav|woff|woff2|ttf|otf)$).*)",
  ],
};
