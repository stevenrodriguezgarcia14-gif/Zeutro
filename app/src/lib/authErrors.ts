/**
 * Traduce los mensajes de error de Supabase Auth (en inglés) a español claro
 * para un usuario sin conocimientos técnicos.
 */
export function authErrorEs(message: string | undefined | null): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Tu correo aún no está confirmado. Revisa tu bandeja (y spam) o reenvía el correo de confirmación.";
  if (m.includes("user already registered") || m.includes("already been registered")) return "Ya existe una cuenta con ese correo. Inicia sesión.";
  if (m.includes("password should be at least")) return "La contraseña es demasiado corta (mínimo 12 caracteres).";
  if (m.includes("pwned") || m.includes("known to be weak") || m.includes("easy to guess") || m.includes("compromised")) return "Esa contraseña aparece en filtraciones públicas y es insegura. Elige otra distinta.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "El correo no parece válido. Revísalo.";
  if (m.includes("rate limit") || m.includes("too many requests")) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (m.includes("for security purposes")) return "Por seguridad, espera unos segundos antes de volver a intentarlo.";
  if (m.includes("token has expired") || m.includes("expired")) return "El enlace expiró. Pídelo de nuevo.";
  if (m.includes("network")) return "Problema de conexión. Revisa tu internet e inténtalo de nuevo.";
  return message?.trim() || "Ocurrió un error. Inténtalo de nuevo.";
}

/** ¿El error indica que el correo no está confirmado? (para ofrecer reenvío) */
export function isUnconfirmedEmail(message: string | undefined | null): boolean {
  return (message ?? "").toLowerCase().includes("email not confirmed");
}
