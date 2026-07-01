import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { OrgLocaleFields } from "@/components/OrgLocaleFields";
import { LogoUploader } from "@/components/LogoUploader";
import { BusinessTypePicker } from "@/components/BusinessTypePicker";
import {
  updateOrganization,
  updateBusinessType,
  deleteOrganization,
  inviteUser,
  cancelInvitation,
  changeMemberRole,
  removeMember,
} from "./actions";

const ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "Administrador (todo)" },
  { value: "finance", label: "Finanzas (dinero/cobros)" },
  { value: "sales", label: "Ventas (clientes/cotizaciones)" },
  { value: "operations", label: "Operaciones" },
  { value: "member", label: "Miembro" },
  { value: "viewer", label: "Solo lectura" },
];
const ROLE_LABEL: Record<string, string> = {
  owner: "Dueño",
  admin: "Administrador",
  finance: "Finanzas",
  sales: "Ventas",
  operations: "Operaciones",
  member: "Miembro",
  viewer: "Solo lectura",
  external_accountant: "Contador externo",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; deleted?: string }>;
}) {
  const { ok, error, deleted } = await searchParams;
  const active = await getCurrentOrg();
  if (!active) redirect("/onboarding");

  const supabase = await createClient();
  // Todas las lecturas son independientes: una sola tanda paralela
  // (antes eran 6 round-trips secuenciales a Supabase).
  const [
    { data: { user } },
    { data: org },
    { data: orgs },
    { data: role },
    { data: members },
    { data: invites },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("organizations").select("*").eq("id", active.id).single(),
    supabase.from("organizations").select("id, name, created_at").order("created_at"),
    supabase.rpc("current_user_role"),
    supabase.rpc("list_org_members", { p_org: active.id }),
    supabase
      .from("invitations")
      .select("id, email, role, status")
      .eq("organization_id", active.id)
      .eq("status", "pending"),
  ]);

  const allOrgs = orgs ?? [];
  const isAdmin = role === "owner" || role === "admin";
  const memberList = (members ?? []) as { user_id: string; email: string; role: string }[];
  const inviteList = (invites ?? []) as { id: string; email: string; role: string; status: string }[];

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

      {/* Tipo de negocio (Centro de Orientación) */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Tipo de negocio</h2>
        <p className="mb-4 text-sm text-slate-500">
          Define qué módulos te muestra Zentro primero y tu ruta en el Centro de Orientación.
        </p>
        <form action={updateBusinessType} className="space-y-4">
          <input type="hidden" name="org_id" value={org.id} />
          <BusinessTypePicker defaultValue={org.business_type} />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Guardar tipo de negocio
          </button>
        </form>
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
          <div>
            <label className="block text-sm font-medium text-slate-700">IVA en ventas rápidas / de mostrador (%)</label>
            <input
              name="quick_sale_tax_pct"
              type="number"
              step="0.01"
              min="0"
              defaultValue={(org.quick_sale_tax_bps ?? 0) / 100}
              className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
            <p className="mt-1 text-xs text-slate-400">
              Depende de tu negocio: déjalo en <b>0</b> si tus ventas de contado no llevan IVA. Si pones una tasa, se pre-llena al registrar una venta rápida y tu ganancia se calcula sin ese IVA.
            </p>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Guardar cambios
          </button>
        </form>
      </section>

      {/* Usuarios y permisos */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Usuarios y permisos</h2>
        <p className="mb-4 text-sm text-slate-500">Invita a tu equipo y define qué puede hacer cada uno.</p>

        {!isAdmin ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
            Solo el dueño o un administrador puede gestionar usuarios. Tu rol: <b>{ROLE_LABEL[role ?? "member"] ?? role}</b>.
          </p>
        ) : (
          <>
            <form action={inviteUser} className="flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm text-slate-700">Correo a invitar</label>
                <input name="email" type="email" required placeholder="persona@correo.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-sm text-slate-700">Rol</label>
                <select name="role" defaultValue="member" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900">
                  {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
              </div>
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Invitar</button>
            </form>
            <p className="mt-2 text-xs text-slate-400">
              La persona se une cuando entra a Zentro con ese mismo correo (que se registre o inicie sesión con él).
            </p>

            {/* Miembros */}
            <h3 className="mt-5 text-sm font-semibold text-slate-700">Miembros</h3>
            <ul className="mt-2 divide-y divide-slate-100">
              {memberList.map((m) => {
                const isSelf = m.user_id === user?.id;
                const isOwner = m.role === "owner";
                return (
                  <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-slate-800">{m.email}{isSelf && <span className="ml-1 text-xs text-slate-400">(tú)</span>}</span>
                    {isOwner || isSelf ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{ROLE_LABEL[m.role] ?? m.role}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <form action={changeMemberRole} className="flex items-center gap-1">
                          <input type="hidden" name="org_id" value={org.id} />
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <select name="role" defaultValue={m.role} className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none focus:border-slate-900">
                            {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                          </select>
                          <button className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Guardar</button>
                        </form>
                        <form action={removeMember}>
                          <input type="hidden" name="org_id" value={org.id} />
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <button className="text-xs text-red-600 hover:underline">Quitar</button>
                        </form>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Invitaciones pendientes */}
            {inviteList.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-slate-700">Invitaciones pendientes</h3>
                <ul className="mt-2 divide-y divide-slate-100">
                  {inviteList.map((iv) => (
                    <li key={iv.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700">{iv.email} <span className="text-xs text-slate-400">({ROLE_LABEL[iv.role] ?? iv.role})</span></span>
                      <form action={cancelInvitation}>
                        <input type="hidden" name="invitation_id" value={iv.id} />
                        <button className="text-xs text-red-600 hover:underline">Cancelar</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
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
