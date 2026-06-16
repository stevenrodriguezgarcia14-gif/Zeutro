import { createClient } from "@/lib/supabase/server";
import { setOrgStatus, setOrgPlan, deleteOrg } from "./actions";

type Overview = {
  users: number; orgs: number; orgs_active: number; orgs_suspended: number;
  new_orgs_7d: number; new_users_7d: number; invoices: number; customers: number; memberships: number;
};
type OrgRow = {
  id: string; name: string; country: string; base_currency: string;
  status: string; plan: string; created_at: string; members: number; invoices: number;
};
type Plan = { id: string; name: string };
type Audit = { action: string; target_org: string | null; detail: Record<string, unknown> | null; created_at: string };

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const [{ data: ov }, { data: orgs }, { data: plans }, { data: audit }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_list_orgs"),
    supabase.from("plans").select("id, name").order("monthly_price_minor"),
    supabase.rpc("admin_recent_audit"),
  ]);
  const o = (ov ?? {}) as Overview;
  const orgList = (orgs ?? []) as OrgRow[];
  const planList = (plans ?? []) as Plan[];
  const auditList = (audit ?? []) as Audit[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard de la plataforma</h1>
      <p className="mt-1 text-sm text-slate-400">Métricas y gestión global de Zentro (solo administradores).</p>

      {ok && <p className="mt-4 rounded-lg bg-green-500/15 p-3 text-sm text-green-300">Acción aplicada.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="Empresas" value={o.orgs ?? 0} accent />
        <Metric label="Activas" value={o.orgs_active ?? 0} />
        <Metric label="Suspendidas" value={o.orgs_suspended ?? 0} />
        <Metric label="Usuarios" value={o.users ?? 0} />
        <Metric label="Nuevas empresas (7d)" value={o.new_orgs_7d ?? 0} />
        <Metric label="Nuevos usuarios (7d)" value={o.new_users_7d ?? 0} />
        <Metric label="Facturas (todas)" value={o.invoices ?? 0} />
        <Metric label="Clientes (todas)" value={o.customers ?? 0} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Empresas</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium text-right">Miembros</th>
              <th className="px-4 py-3 font-medium text-right">Facturas</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orgList.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.country} · {r.base_currency} · {new Date(r.created_at).toLocaleDateString("es")}</div>
                </td>
                <td className="px-4 py-3">
                  {r.status === "suspended"
                    ? <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">Suspendida</span>
                    : <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Activa</span>}
                </td>
                <td className="px-4 py-3">
                  <form action={setOrgPlan} className="flex items-center gap-1">
                    <input type="hidden" name="org_id" value={r.id} />
                    <select name="plan" defaultValue={r.plan} className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 outline-none">
                      {planList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">OK</button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right text-slate-300">{r.members}</td>
                <td className="px-4 py-3 text-right text-slate-300">{r.invoices}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setOrgStatus}>
                      <input type="hidden" name="org_id" value={r.id} />
                      <input type="hidden" name="status" value={r.status === "suspended" ? "active" : "suspended"} />
                      <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">
                        {r.status === "suspended" ? "Reactivar" : "Suspender"}
                      </button>
                    </form>
                    <form action={deleteOrg} className="flex items-center gap-1">
                      <input type="hidden" name="org_id" value={r.id} />
                      <input name="confirm" placeholder="BORRAR" className="w-20 rounded-lg border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-200 outline-none" />
                      <button className="rounded-lg border border-red-800 px-2 py-1 text-xs text-red-300 hover:bg-red-900/30">Borrar</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Auditoría reciente</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        {auditList.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Sin acciones registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-800">
              {auditList.map((a, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-slate-300">{a.action}</td>
                  <td className="px-4 py-2 text-slate-500">{a.detail ? JSON.stringify(a.detail) : ""}</td>
                  <td className="px-4 py-2 text-right text-slate-500">{new Date(a.created_at).toLocaleString("es")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
