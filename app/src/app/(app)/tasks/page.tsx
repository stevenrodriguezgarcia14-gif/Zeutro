import { createClient } from "@/lib/supabase/server";
import { createTask, toggleTask, deleteTask } from "./actions";
import { ModuleHelp } from "@/components/ModuleHelp";

const PRIO: Record<string, { label: string; cls: string }> = {
  urgent: { label: "Urgente", cls: "bg-red-100 text-red-700" },
  high: { label: "Alta", cls: "bg-amber-100 text-amber-700" },
  medium: { label: "Media", cls: "bg-slate-100 text-slate-600" },
  low: { label: "Baja", cls: "bg-slate-100 text-slate-400" },
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  recurrence: string;
  projects: { name: string } | null;
};

const RECUR_LABEL: Record<string, string> = { daily: "diaria", weekly: "semanal", monthly: "mensual" };

function TaskRow({ t }: { t: Task }) {
  const done = t.status === "done";
  const p = PRIO[t.priority] ?? PRIO.medium;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0">
      <div className="flex items-center gap-2">
        <form action={toggleTask}>
          <input type="hidden" name="task_id" value={t.id} />
          <input type="hidden" name="done" value={done ? "0" : "1"} />
          <button className={`flex h-5 w-5 items-center justify-center rounded border ${done ? "border-green-600 bg-green-600 text-white" : "border-slate-300"}`} aria-label="Completar">
            {done ? "✓" : ""}
          </button>
        </form>
        <div>
          <p className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
          <div className="flex items-center gap-2 text-xs">
            {!done && <span className={`rounded-full px-1.5 py-0.5 ${p.cls}`}>{p.label}</span>}
            {t.projects?.name && <span className="text-slate-400">📁 {t.projects.name}</span>}
            {t.due_date && <span className="text-slate-400">📅 {t.due_date}</span>}
            {t.recurrence && t.recurrence !== "none" && <span className="text-slate-400" title={`Se repite ${RECUR_LABEL[t.recurrence] ?? ""}`}>🔁 {RECUR_LABEL[t.recurrence] ?? ""}</span>}
          </div>
        </div>
      </div>
      <form action={deleteTask}>
        <input type="hidden" name="task_id" value={t.id} />
        <button className="text-xs text-slate-300 hover:text-red-600">✕</button>
      </form>
    </div>
  );
}

function Group({ title, tasks, tone }: { title: string; tasks: Task[]; tone?: string }) {
  if (tasks.length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className={`text-sm font-semibold ${tone ?? "text-slate-700"}`}>{title} <span className="text-slate-400">({tasks.length})</span></h2>
      <div className="mt-2">{tasks.map((t) => <TaskRow key={t.id} t={t} />)}</div>
    </div>
  );
}

export default async function TasksPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase.from("tasks").select("id, title, status, priority, due_date, recurrence, projects(name)").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("id, name").neq("status", "cancelled").order("name"),
  ]);
  const all = (tasks ?? []) as unknown as Task[];
  const pend = all.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const overdue = pend.filter((t) => t.due_date && t.due_date < today);
  const todayT = pend.filter((t) => t.due_date === today);
  const upcoming = pend.filter((t) => t.due_date && t.due_date > today);
  const noDate = pend.filter((t) => !t.due_date);
  const done = all.filter((t) => t.status === "done").slice(0, 15);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tareas</h1>
      <p className="mt-1 text-sm text-slate-500">{pend.length} pendiente(s)</p>
      <div className="mt-4"><ModuleHelp slug="tasks" /></div>

      <form action={createTask} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <input type="hidden" name="redirect_to" value="/tasks" />
        <div className="min-w-48 flex-1">
          <label className="block text-xs text-slate-500">Nueva tarea</label>
          <input name="title" required placeholder="Ej. Llamar al proveedor" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Prioridad</label>
          <select name="priority" defaultValue="medium" className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="urgent">Urgente</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Fecha</label>
          <input name="due_date" type="date" className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Proyecto</label>
          <select name="project_id" defaultValue="" className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="">—</option>
            {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500">Repetir</label>
          <select name="recurrence" defaultValue="none" className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
            <option value="none">No se repite</option>
            <option value="daily">Cada día</option>
            <option value="weekly">Cada semana</option>
            <option value="monthly">Cada mes</option>
          </select>
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Agregar</button>
      </form>

      <div className="mt-6 space-y-4">
        <Group title="Vencidas" tasks={overdue} tone="text-red-700" />
        <Group title="Hoy" tasks={todayT} tone="text-slate-900" />
        <Group title="Próximas" tasks={upcoming} />
        <Group title="Sin fecha" tasks={noDate} />
        <Group title="Completadas" tasks={done} tone="text-slate-400" />
        {pend.length === 0 && done.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Sin tareas. Agrega la primera arriba.</div>
        )}
      </div>
    </div>
  );
}
