/**
 * Logger mínimo y estructurado. Hoy escribe a la consola del servidor (visible en
 * los logs de Vercel). Está preparado para enchufar Sentry/observabilidad más
 * adelante sin tocar los call sites: solo completa `report()`.
 */
type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, context?: Record<string, unknown>) {
  const line = {
    level,
    message,
    ...(context ? { context } : {}),
    ts: new Date().toISOString(),
  };
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
    JSON.stringify(line),
  );
}

export const log = {
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => emit("error", message, context),
};

/**
 * Punto único para reportar errores. Loggea de forma estructurada y deja un hueco
 * para enviar a Sentry cuando definas SENTRY_DSN (ver comentario).
 */
export function report(scope: string, error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  log.error(`[${scope}] ${message}`, context);
  // TODO(observabilidad): si process.env.SENTRY_DSN está definido, enviar aquí.
}
