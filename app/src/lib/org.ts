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
  business_type: string | null;
};

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

  // La empresa activa la decide la base de datos (active_org()), igual que la RLS,
  // para que lo que se muestra coincida exactamente con lo que se filtra.
  const { data: activeId } = await supabase.rpc("active_org");
  return orgs.find((o) => o.id === activeId) ?? orgs[0];
}

/**
 * Devuelve la lista de empresas y la activa en UNA sola consulta.
 * Pensado para el layout (evita pedir las organizaciones dos veces por navegación).
 */
export async function getOrgContext(): Promise<{ orgs: { id: string; name: string }[]; current: Organization | null }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_organizations");
  const all = (data as Organization[] | null) ?? [];
  const orgs = all.map((o) => ({ id: o.id, name: o.name }));
  if (all.length === 0) return { orgs, current: null };

  const { data: activeId } = await supabase.rpc("active_org");
  const current = all.find((o) => o.id === activeId) ?? all[0];
  return { orgs, current };
}
