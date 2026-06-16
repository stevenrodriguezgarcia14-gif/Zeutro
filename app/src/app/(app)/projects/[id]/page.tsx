import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { updateProjectStatus, deleteProject } from "../actions";
import { createTask, toggleTask, deleteTask } from "@/app/(app)/tasks/actions";

const STATUSES = [
  { v: "planning", l: "Planeación" },
  { v: "active", l: "Activo" },
  { v: "on_hold", l: "En pausa" },
  { v: "completed", l: "Completado" },
  { v: "cancelled", l: "Cancelado" },
];
const PRIO: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-red-100 text-red-700" },
  high: { label: "Alta", cls: "bg-amber-100 text-amber-700" },
  medium: { label: "Media", cls: "bg-slate-100 text-slate-600" },
  low: { label: "Baja", cls: "bg-slate-100 text-slate-400" },
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*, customers(legal_name)").eq("id", id).single();
  if (!project) notFound();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("project_id", id)
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false });

  const ts = (tasks ?? []) as { id: string; title: string; status: string; priority: string; due_date: string | null }[];
  const total = ts.length;
  const done = ts.filter((t) => t.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const back = `/projects/${id}`;

  return (
    <div>
      <Link href="/projects" className="text-sm text-slate-500 hover:underline">← Proyectos</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {project.customers?.legal_name ?? "Sin cliente"}
            {project.start_date ? ` · inicio ${project.start_date}` : ""}
            {project.end_date ? ` · entrega ${project.end_date}` : ""}
          </p>
        </div>
        <form action={updateProjectStatus} className="flex items-center gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <select name="status" defaultValue={project.status} className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Guardar</button>
        </form>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Avance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{pct}%</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-slate-700" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-slate-400">{done}/{total} tareas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Presupuesto</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{project.budget_amount_minor != null ? formatMoney(project.budget_amount_minor, currency) : "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Tareas pendientes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{total - done}</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Tareas del proyecto</h2>
        <form action={createTask} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="redirect_to" value={back} />
          <div className="min-w-48 flex-1"><input name="title" required placeholder="Nueva tarea del proyecto" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" /></div>
          <select name="priority" defaultValue="medium" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
          </select>
          <input name="due_date" type="date" className="rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Agregar</button>
        </form>

        <div className="mt-3">
          {ts.length === 0 && <p className="py-4 text-sm text-slate-500">Sin tareas. Agrega la primera arriba.</p>}
          {ts.map((t) => {
            const isDone = t.status === "done";
            const p = PRIO[t.priority] ?? PRIO.medium;
            return (
              <div key={t.id} className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <form action={toggleTask}>
                    <input type="hidden" name="task_id" value={t.id} />
                    <input type="hidden" name="done" value={isDone ? "0" : "1"} />
                    <input type="hidden" name="redirect_to" value={back} />
                    <button className={`flex h-5 w-5 items-center justify-center rounded border ${isDone ? "border-green-600 bg-green-600 text-white" : "border-slate-300"}`}>{isDone ? "✓" : ""}</button>
                  </form>
                  <div>
                    <p className={`text-sm ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {!isDone && <span className={`rounded-full px-1.5 py-0.5 ${p.cls}`}>{p.label}</span>}
                      {t.due_date && <span className="text-slate-400">📅 {t.due_date}</span>}
                    </div>
                  </div>
                </div>
                <form action={deleteTask}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <input type="hidden" name="redirect_to" value={back} />
                  <button className="text-xs text-slate-300 hover:text-red-600">✕</button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <form action={deleteProject} className="mt-6">
        <input type="hidden" name="project_id" value={project.id} />
        <button className="text-sm text-red-600 hover:underline">Eliminar proyecto</button>
      </form>
    </div>
  );
}
