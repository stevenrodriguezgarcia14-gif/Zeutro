import { createClient } from "@/lib/supabase/server";

type Overview = {
  users: number;
  orgs: number;
  new_orgs_7d: number;
  new_users_7d: number;
  invoices: number;
  customers: number;
  memberships: number;
};
type OrgRow = {
  id: string;
  name: string;
  country: string;
  base_currency: string;
  created_at: string;
  members: number;
  invoices: number;
};

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-amber-300" : "text-white"}`}>{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ data: ov }, { data: orgs }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.rpc("admin_list_orgs"),
  ]);
  const o = (ov ?? {}) as Overview;
  const orgList = (orgs ?? []) as OrgRow[];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard de la plataforma</h1>
      <p className="mt-1 text-sm text-slate-400">Métricas globales de Zentro (solo administradores).</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="Empresas" value={o.orgs ?? 0} accent />
        <Metric label="Usuarios" value={o.users ?? 0} />
        <Metric label="Nuevas empresas (7d)" value={o.new_orgs_7d ?? 0} />
        <Metric label="Nuevos usuarios (7d)" value={o.new_users_7d ?? 0} />
        <Metric label="Clientes (todas)" value={o.customers ?? 0} />
        <Metric label="Facturas (todas)" value={o.invoices ?? 0} />
        <Metric label="Membresías" value={o.memberships ?? 0} />
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Próximo (diseñado en el documento maestro, sección 22.2): planes y suscripciones, MRR/ARR/churn,
        feature flags por empresa, suspender/eliminar, auditoría global y soporte.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Empresas</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 font-medium text-right">Miembros</th>
              <th className="px-4 py-3 font-medium text-right">Facturas</th>
              <th className="px-4 py-3 font-medium">Creada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {orgList.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                <td className="px-4 py-3 text-slate-300">{r.country} · {r.base_currency}</td>
                <td className="px-4 py-3 text-right text-slate-300">{r.members}</td>
                <td className="px-4 py-3 text-right text-slate-300">{r.invoices}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(r.created_at).toLocaleDateString("es")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
