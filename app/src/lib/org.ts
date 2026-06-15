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
 * Devuelve la organización (negocio) activa del usuario actual.
 * MVP: el usuario pertenece a una sola organización (la primera).
 * Devuelve null si el usuario aún no tiene negocio (debe ir a /onboarding).
 */
export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("organization_id")
    .limit(1);

  if (!memberships || memberships.length === 0) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, country, base_currency, timezone, locale, legal_name, tax_id")
    .eq("id", memberships[0].organization_id)
    .single();

  return (org as Organization) ?? null;
}
