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
  status: string;
};

const ACTIVE_COOKIE = "zentro_active_org";

/** Empresas a las que pertenece el usuario actual (id + nombre). */
export async function getUserOrgs(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  // my_organizations() es SECURITY DEFINER: incluye también orgs suspendidas
  // (RLS las ocultaría) para poder mostrarlas en el selector y la pantalla
  // de "Cuenta suspendida".
  const { data } = await supabase.rpc("my_organizations");
  return ((data as Organization[] | null) ?? []).map((o) => ({ id: o.id, name: o.name }));
}

/**
 * Empresa (negocio) activa del usuario. Respeta la cookie de "empresa activa";
 * si no hay o no es válida, usa la primera. Null si no tiene ninguna.
 */
export async function getCurrentOrg(): Promise<Organization | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_organizations");
  const orgs = (data as Organization[] | null) ?? [];
  if (orgs.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_COOKIE)?.value;
  return orgs.find((o) => o.id === activeId) ?? orgs[0];
}
