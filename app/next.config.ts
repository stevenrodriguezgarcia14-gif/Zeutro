import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad (defensa en profundidad).
 * Nota: la Content-Security-Policy (CSP) se deja documentada abajo pero NO activada
 * por defecto, porque una CSP estricta puede romper Next/Supabase/3D si no se prueba
 * en un entorno real. Actívala y ajústala cuando puedas verificar la app cargando.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // Plantilla de CSP para activar tras probar (descomenta y ajusta los orígenes de Supabase):
  // {
  //   key: "Content-Security-Policy",
  //   value: [
  //     "default-src 'self'",
  //     "script-src 'self' 'unsafe-inline'",
  //     "style-src 'self' 'unsafe-inline'",
  //     "img-src 'self' data: blob: https://*.supabase.co",
  //     "font-src 'self' data:",
  //     "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  //     "frame-ancestors 'none'",
  //     "base-uri 'self'",
  //     "form-action 'self'",
  //   ].join("; "),
  // },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
