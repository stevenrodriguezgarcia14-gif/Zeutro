import { cache } from "react";
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

export type OrgContext = {
  orgs: { id: string; name: string }[];
  current: Organization | null;
  isPlatformAdmin: boolean;
};

/**
 * Contexto de la app en UN solo round-trip a la base: acepta invitaciones
 * pendientes, lista las empresas del usuario, resuelve la activa (misma
 * fuente que la RLS: active_org()) e indica si es admin de plataforma.
 *
 * Envuelto en cache() de React: dentro de un mismo request (layout + página
 * + componentes) la RPC se ejecuta UNA sola vez, sin importar cuántos
 * módulos llamen a getOrgContext()/getCurrentOrg().
 */
export const getOrgContext = cache(async (): Promise<OrgContext> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("app_bootstrap");
  const boot = (data ?? {}) as {
    orgs?: Organization[] | null;
    active_org?: string | null;
    is_platform_admin?: boolean;
  };
  const all = boot.orgs ?? [];
  const orgs = all.map((o) => ({ id: o.id, name: o.name }));
  const current = all.find((o) => o.id === boot.active_org) ?? all[0] ?? null;
  return { orgs, current, isPlatformAdmin: !!boot.is_platform_admin };
});

/** Empresas a las que pertenece el usuario actual (id + nombre). */
export async function getUserOrgs(): Promise<{ id: string; name: string }[]> {
  return (await getOrgContext()).orgs;
}

/**
 * Empresa (negocio) activa del usuario. La decide la base de datos
 * (active_org()), igual que la RLS, para que lo que se muestra coincida
 * exactamente con lo que se filtra. Null si no tiene ninguna.
 */
export async function getCurrentOrg(): Promise<Organization | null> {
  return (await getOrgContext()).current;
}
