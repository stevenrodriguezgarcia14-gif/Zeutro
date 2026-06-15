import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { OrgLocaleFields } from "@/components/OrgLocaleFields";
import { LogoUploader } from "@/components/LogoUploader";
import { updateOrganization, deleteOrganization } from "./actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; deleted?: string }>;
}) {
  const { ok, error, deleted } = await searchParams;
  const active = await getCurrentOrg();
  if (!active) redirect("/onboarding");

  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", active.id).single();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, created_at")
    .order("created_at");

  const allOrgs = orgs ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
      <p className="mt-1 text-sm text-slate-500">Datos de tu negocio, logo y gestión de negocios.</p>

      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Cambios guardados.</p>}
      {deleted && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Negocio eliminado.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Logo */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Logo</h2>
        <p className="mb-4 text-sm text-slate-500">Aparecerá en tu negocio y (próximamente) en tus facturas.</p>
        <LogoUploader orgId={org.id} currentUrl={org.logo_url ?? null} />
      </section>

      {/* Datos del negocio */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Datos del negocio</h2>
        <form action={updateOrganization} className="mt-4 space-y-4">
          <input type="hidden" name="org_id" value={org.id} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre del negocio *</label>
            <input
              name="name"
              required
              defaultValue={org.name}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Razón social</label>
              <input
                name="legal_name"
                defaultValue={org.legal_name ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">RFC / ID fiscal</label>
              <input
                name="tax_id"
                defaultValue={org.tax_id ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </div>
          <OrgLocaleFields defaultCountry={org.country ?? "MX"} />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      {/* Gestión de negocios */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Mis negocios</h2>
        <p className="mb-4 text-sm text-slate-500">
          Si tienes negocios duplicados, puedes eliminarlos aquí. Esta acción borra también sus
          clientes, facturas y datos. No se puede deshacer.
        </p>
        <ul className="divide-y divide-slate-100">
          {allOrgs.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="text-sm text-slate-800">
                {o.name}
                {o.id === org.id && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">actual</span>
                )}
              </span>
              <form action={deleteOrganization} className="flex items-center gap-2">
                <input type="hidden" name="org_id" value={o.id} />
                <input
                  name="confirm"
                  placeholder="Escribe BORRAR"
                  className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
