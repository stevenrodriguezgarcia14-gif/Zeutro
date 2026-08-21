import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";

const STATUS: Record<string, { label: string; cls: string }> = {
  planning: { label: "Planeación", cls: "bg-slate-100 text-slate-600" },
  active: { label: "Activo", cls: "bg-blue-100 text-blue-700" },
  on_hold: { label: "En pausa", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", cls: "bg-slate-100 text-slate-400" },
};

type Row = { id: string; name: string; status: string; customers: { legal_name: string } | null };

export default async function ProjectsPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  // Se traen los agregados de todos los trabajos de una vez y se cruzan en
  // memoria: son pocos registros por negocio y evita N+1 consultas.
  const [{ data: projects }, { data: tasks }, { data: expenses }, { data: invoices }, { data: quotations }] = await Promise.all([
    supabase.from("projects").select("id, name, status, customers(legal_name)").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status"),
    supabase.from("expenses").select("project_id, amount_minor").not("project_id", "is", null),
    supabase.from("invoices").select("project_id, subtotal_minor, total_minor, paid_minor, status").not("project_id", "is", null),
    supabase.from("quotations").select("project_id, total_minor, status").not("project_id", "is", null),
  ]);

  const counts = new Map<string, { total: number; done: number }>();
  for (const t of (tasks ?? []) as { project_id: string | null; status: string }[]) {
    if (!t.project_id) continue;
    const c = counts.get(t.project_id) ?? { total: 0, done: 0 };
    c.total++;
    if (t.status === "done") c.done++;
    counts.set(t.project_id, c);
  }

  const money = new Map<string, { quoted: number; invoicedNet: number; collected: number; pending: number; spent: number }>();
  const bucket = (pid: string) => {
    let m = money.get(pid);
    if (!m) { m = { quoted: 0, invoicedNet: 0, collected: 0, pending: 0, spent: 0 }; money.set(pid, m); }
    return m;
  };
  for (const e of (expenses ?? []) as { project_id: string; amount_minor: number }[]) {
    bucket(e.project_id).spent += e.amount_minor ?? 0;
  }
  for (const i of (invoices ?? []) as { project_id: string; subtotal_minor: number; total_minor: number; paid_minor: number; status: string }[]) {
    if (i.status === "void") continue;
    const m = bucket(i.project_id);
    m.invoicedNet += i.subtotal_minor ?? 0;
    m.collected += i.paid_minor ?? 0;
    m.pending += (i.total_minor ?? 0) - (i.paid_minor ?? 0);
  }
  for (const q of (quotations ?? []) as { project_id: string; total_minor: number; status: string }[]) {
    if (!["accepted", "converted"].includes(q.status)) continue;
    bucket(q.project_id).quoted += q.total_minor ?? 0;
  }

  const rows = (projects ?? []) as unknown as Row[];
  const abiertos = rows.filter((p) => ["planning", "active", "on_hold"].includes(p.status));
  const totalPorCobrar = abiertos.reduce((s, p) => s + (money.get(p.id)?.pending ?? 0), 0);
  const totalGastado = abiertos.reduce((s, p) => s + (money.get(p.id)?.spent ?? 0), 0);
  const totalGanancia = rows.reduce((s, p) => {
    const m = money.get(p.id);
    return s + (m ? m.invoicedNet - m.spent : 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} trabajo(s) · {abiertos.length} abierto(s)</p>
        </div>
        <Link href="/projects/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ Nuevo proyecto</Link>
      </div>
      <div className="mt-4"><ModuleHelp slug="projects" /></div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no tienes proyectos. Útiles si das servicios o trabajos por encargo.</p>
          <Link href="/projects/new" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Crear el primero</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Por cobrar en trabajos abiertos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalPorCobrar, currency)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Gastado en trabajos abiertos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalGastado, currency)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Ganancia acumulada</p>
              <p className={`mt-2 text-2xl font-bold ${totalGanancia >= 0 ? "text-green-600" : "text-red-600"}`}>{formatMoney(totalGanancia, currency)}</p>
              <p className="mt-1 text-xs text-slate-400">Facturado sin impuestos − gastado, en todos los trabajos</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map((p) => {
              const st = STATUS[p.status] ?? STATUS.active;
              const c = counts.get(p.id) ?? { total: 0, done: 0 };
              const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
              const m = money.get(p.id) ?? { quoted: 0, invoicedNet: 0, collected: 0, pending: 0, spent: 0 };
              const ganancia = m.invoicedNet - m.spent;
              const tieneDinero = m.quoted > 0 || m.invoicedNet > 0 || m.spent > 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                  </div>
                  {p.customers?.legal_name && <p className="text-xs text-slate-400">{p.customers.legal_name}</p>}

                  {tieneDinero && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Precio</p>
                        <p className="font-medium text-slate-900">{m.quoted > 0 ? formatMoney(m.quoted, currency) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Gastado</p>
                        <p className="font-medium text-slate-900">{formatMoney(m.spent, currency)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Ganancia</p>
                        <p className={`font-medium ${ganancia >= 0 ? "text-green-600" : "text-red-600"}`}>{formatMoney(ganancia, currency)}</p>
                      </div>
                    </div>
                  )}
                  {m.pending > 0 && (
                    <p className="mt-2 text-xs text-amber-700">Por cobrar {formatMoney(m.pending, currency)}</p>
                  )}

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-slate-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{c.done}/{c.total} tareas · {pct}%</p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
