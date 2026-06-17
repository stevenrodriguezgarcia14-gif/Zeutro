import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModuleHelp } from "@/components/ModuleHelp";

const STATUS: Record<string, { label: string; cls: string }> = {
  planning: { label: "Planeación", cls: "bg-slate-100 text-slate-600" },
  active: { label: "Activo", cls: "bg-blue-100 text-blue-700" },
  on_hold: { label: "En pausa", cls: "bg-amber-100 text-amber-700" },
  completed: { label: "Completado", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", cls: "bg-slate-100 text-slate-400" },
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("id, name, status, customers(legal_name)").order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status"),
  ]);
  const counts = new Map<string, { total: number; done: number }>();
  for (const t of (tasks ?? []) as { project_id: string | null; status: string }[]) {
    if (!t.project_id) continue;
    const c = counts.get(t.project_id) ?? { total: 0, done: 0 };
    c.total++;
    if (t.status === "done") c.done++;
    counts.set(t.project_id, c);
  }
  const rows = (projects ?? []) as unknown as { id: string; name: string; status: string; customers: { legal_name: string } | null }[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} proyecto(s)</p>
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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((p) => {
            const st = STATUS[p.status] ?? STATUS.active;
            const c = counts.get(p.id) ?? { total: 0, done: 0 };
            const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                </div>
                {p.customers?.legal_name && <p className="text-xs text-slate-400">{p.customers.legal_name}</p>}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-slate-700" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{c.done}/{c.total} tareas · {pct}%</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
