"use client";

/**
 * Fecha y hora en la zona horaria de QUIEN MIRA la pantalla.
 *
 * Formatear un `timestamptz` en un componente de servidor usa la zona del
 * servidor — UTC en Vercel — así que el panel mostraba las horas corridas
 * (un mensaje de las 8 de la noche aparecía como las 2 de la madrugada del
 * día siguiente). Al ser un componente de cliente, `toLocaleString` usa la
 * zona real del navegador.
 *
 * `suppressHydrationWarning`: el HTML que llega del servidor trae la hora en
 * UTC y el navegador la reescribe al hidratar. Es una diferencia esperada y
 * deliberada, no un error de render.
 */
export function LocalTime({
  value,
  options = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" },
  fallback = "—",
}: {
  value: string | null | undefined;
  options?: Intl.DateTimeFormatOptions;
  fallback?: string;
}) {
  if (!value) return <>{fallback}</>;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return <>{fallback}</>;
  return <span suppressHydrationWarning>{d.toLocaleString("es", options)}</span>;
}
