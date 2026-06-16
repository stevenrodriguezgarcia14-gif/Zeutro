import { cookies } from "next/headers";
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

const ACTIVE_COOKIE = "zentro_active_org";

/** Empresas a las que pertenece el usuario actual (id + nombre). */
export async function getUserOrgs(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("organizations(id, name)")
    .order("created_at");
  const list = ((data as { organizations: { id: string; name: string } | null }[] | null) ?? [])
    .map((m) => m.organizations)
    .filter((o): o is { id: string; name: string } => !!o);
  return list;
}

/**
 * Empresa (negocio) activa del usuario. Respeta la cookie de "empresa activa";
 * si no hay o no es válida, usa la primera. Null si no tiene ninguna.
 */
export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("organizations(id, name, country, base_currency, timezone, locale, legal_name, tax_id)")
    .order("created_at");

  const orgs = ((data as { organizations: Organization | null }[] | null) ?? [])
    .map((m) => m.organizations)
    .filter((o): o is Organization => !!o);
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_COOKIE)?.value;
  return orgs.find((o) => o.id === activeId) ?? orgs[0];
}
