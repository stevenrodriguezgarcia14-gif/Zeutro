import { createClient } from "@/lib/supabase/server";

export type Organization = {
  id: string;
  name: string;
  country: string;
  base_currency: string;
  timezone: string;
  locale: string;
  legal_name: string | null;
  tax_id: string | null;
};

/**
 * Devuelve la organización (negocio) activa del usuario actual en una sola
 * consulta (membership + organización embebida). Devuelve null si el usuario
 * aún no tiene negocio (debe ir a /onboarding).
 */
export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("memberships")
    .select(
      "organizations(id, name, country, base_currency, timezone, locale, legal_name, tax_id)",
    )
    .limit(1)
    .maybeSingle();

  const org = (data as { organizations: Organization | null } | null)?.organizations;
  return org ?? null;
}
