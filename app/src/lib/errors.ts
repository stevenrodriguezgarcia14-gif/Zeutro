import { report } from "@/lib/log";

/**
 * Convierte cualquier error de Supabase/Postgres en un mensaje seguro y claro en
 * español para mostrar al usuario, SIN filtrar detalles internos (nombres de
 * columnas, SQL, mensajes en inglés) a la URL ni a la pantalla.
 *
 * - Errores de negocio que NOSOTROS lanzamos desde las RPC (en español) sí se
 *   muestran tal cual, porque son útiles ("El pago excede el saldo", etc.).
 * - Códigos de Postgres conocidos se traducen a algo entendible.
 * - Cualquier otra cosa se loggea (para diagnóstico) y se devuelve un mensaje genérico.
 */
type ErrorLike = { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };

const PG_CODE: Record<string, string> = {
  "23505": "Ya existe un registro con esos datos.",
  "23503": "No se puede completar porque hay información relacionada.",
  "23502": "Falta un dato obligatorio.",
  "23514": "Hay un valor que no cumple las reglas (revisa montos y cantidades).",
  "22P02": "Un dato tiene un formato inválido.",
  "P0001": "", // raise_exception: el mensaje suele ser nuestro (español) → se evalúa abajo
};

// Frases que indican que el mensaje viene de NUESTRA lógica (es seguro mostrarlo).
const SAFE_DOMAIN = [
  "saldo",
  "stock",
  "no autorizado",
  "permiso",
  "no encontrada",
  "no encontrado",
  "ya existe",
  "excede",
  "negativo",
  "origen y destino",
  "prospecto",
  "folio",
  "cantidad",
  "obligatorio",
  "inválid",
];

export function safeError(error: unknown, fallback = "Ocurrió un error. Inténtalo de nuevo."): string {
  const e = (error ?? {}) as ErrorLike;
  const message = typeof e.message === "string" ? e.message : "";
  const code = typeof e.code === "string" ? e.code : "";
  const lower = message.toLowerCase();

  // 1) Mensaje de negocio propio (español) → mostrar.
  if (message && SAFE_DOMAIN.some((s) => lower.includes(s))) {
    return message;
  }

  // 2) Código de Postgres conocido.
  if (code && PG_CODE[code]) {
    return PG_CODE[code];
  }

  // 3) Permisos / RLS (en inglés) → mensaje seguro.
  // Nota: Supabase emite "row-level security" (con guion); aceptamos ambas formas.
  if (
    lower.includes("row-level security") ||
    lower.includes("row level security") ||
    lower.includes("violates row-level") ||
    lower.includes("permission denied")
  ) {
    return "No tienes permiso para realizar esta acción.";
  }

  // 4) Desconocido: loggear el detalle real y devolver genérico (no filtrar internals).
  if (message || code) {
    report("safeError", error);
  }
  return fallback;
}
