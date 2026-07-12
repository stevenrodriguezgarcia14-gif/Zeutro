"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

/**
 * Registra eventos de PWA para las métricas de crecimiento (0041):
 *  - pwa_installed:  el usuario instaló Zentro en su pantalla de inicio.
 *  - pwa_standalone: abrió Zentro ya instalado (hábito diario).
 * Deduplicado por usuario/evento/día vía unique en la tabla; el conflicto
 * se ignora a propósito. Nunca debe romper la app: es solo medición.
 */
export async function trackPwaEvent(kind: "pwa_installed" | "pwa_standalone"): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const org = await getCurrentOrg();
    await supabase.from("product_events").insert({
      user_id: user.id,
      organization_id: org?.id ?? null,
      kind,
    });
  } catch {
    // Silencioso: una métrica jamás interrumpe el trabajo del usuario.
  }
}
