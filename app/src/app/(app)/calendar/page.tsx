import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";
import { createAppointment, deleteAppointment } from "./actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";

type Ev = { date: string; kind: string; label: string; title: string; href: string; cls: string; time?: string; apptId?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ok, error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const horizonTs = new Date(Date.now() + 60 * 86400000).toISOString();

  const [{ data: tasks }, { data: invoices }, { data: quotes }, { data: opps }, { data: appts }, { data: customers }] = await Promise.all([
    supabase.from("tasks").select("id, title, due_date, status").not("due_date", "is", null).neq("status", "done").neq("status", "cancelled"),
    supabase.from("invoices").select("id, number, due_date, balance_minor, status, customers(legal_name)").in("status", ["issued", "partially_paid", "overdue"]).gt("balance_minor", 0),
    supabase.from("quotations").select("id, number, valid_until, customers(legal_name)").eq("status", "sent"),
    supabase.from("opportunities").select("id, title, expected_close_date").eq("status", "open").not("expected_close_date", "is", null),
    supabase.from("appointments").select("id, title, starts_at, duration_min, location, customers(legal_name)").neq("status", "cancelled").lte("starts_at", horizonTs).order("starts_at"),
    supabase.from("customers").select("id, legal_name").order("legal_name").limit(500),
  ]);

  const custList = (customers ?? []) as { id: string; legal_name: string }[];
  const ev: Ev[] = [];
  for (const a of (appts ?? []) as unknown as { id: string; title: string; starts_at: string; duration_min: number; location: string | null; customers: { legal_name: string } | null }[]) {
    const dt = new Date(a.starts_at);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    const who = a.customers?.legal_name ? ` · ${a.customers.legal_name}` : "";
    const where = a.location ? ` · ${a.location}` : "";
    ev.push({ date, time, kind: "cita", label: "Cita", title: `${a.title}${who}${where}`, href: "/calendar", cls: "bg-emerald-100 text-emerald-700", apptId: a.id });
  }
  for (const t of (tasks ?? []) as { id: string; title: string; due_date: string }[]) {
    ev.push({ date: t.due_date, kind: "tarea", label: "Tarea", title: t.title, href: "/tasks", cls: "bg-slate-100 text-slate-700" });
  }
  for (const i of (invoices ?? []) as unknown as { id: string; number: string; due_date: string; balance_minor: number; customers: { legal_name: string } | null }[]) {
    ev.push({ date: i.due_date, kind: "factura", label: "Cobro", title: `${i.number} · ${i.customers?.legal_name ?? ""} · ${formatMoney(i.balance_minor, currency)}`, href: `/invoices/${i.id}`, cls: "bg-red-100 text-red-700" });
  }
  for (const q of (quotes ?? []) as unknown as { id: string; number: string; valid_until: string; customers: { legal_name: string } | null }[]) {
    ev.push({ date: q.valid_until, kind: "cotizacion", label: "Cotización vence", title: `${q.number} · ${q.customers?.legal_name ?? ""}`, href: `/quotations/${q.id}`, cls: "bg-amber-100 text-amber-700" });
  }
  for (const o of (opps ?? []) as { id: string; title: string; expected_close_date: string }[]) {
    ev.push({ date: o.expected_close_date, kind: "venta", label: "Cierre venta", title: o.title, href: "/sales", cls: "bg-blue-100 text-blue-700" });
  }

  const visible = ev
    .filter((e) => e.date <= horizon)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"));
  const byDate = new Map<string, Ev[]>();
  for (const e of visible) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }
  const dates = [...byDate.keys()];

  function fmtDate(d: string) {
    const dt = new Date(d + "T00:00:00");
    const s = dt.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Calendario y citas</h1>
      <p className="mt-1 text-sm text-slate-500">Tus citas con hora más todo lo que tiene fecha: tareas, cobros, cotizaciones y cierres (próximos 60 días).</p>
      <div className="mt-4"><ModuleHelp slug="calendar" /></div>

      {ok === "1" && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ Cita agendada.</p>}
      {ok === "del" && <p className="mt-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">Cita eliminada.</p>}
      {error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">+ Agendar una cita</summary>
        <form action={createAppointment} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-700">¿Qué cita? *</label>
            <input name="title" required placeholder="Ej. Consulta con Juan, Visita a obra" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm text-slate-700">Fecha *</label>
            <input name="date" type="date" defaultValue={today} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm text-slate-700">Hora</label>
              <input name="time" type="time" defaultValue="09:00" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            </div>
            <div className="w-28">
              <label className="block text-sm text-slate-700">Duración (min)</label>
              <input name="duration_min" type="number" min="5" step="5" defaultValue="60" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-700">Cliente (opcional)</label>
            <select name="customer_id" defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900">
              <option value="">— Sin cliente —</option>
              {custList.map((c) => <option key={c.id} value={c.id}>{c.legal_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700">Lugar (opcional)</label>
            <input name="location" placeholder="Local, dirección, videollamada…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900" />
          </div>
          <div className="sm:col-span-2">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Agendar cita</button>
          </div>
        </form>
      </details>

      {dates.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Nada con fecha por ahora. Las tareas y vencimientos aparecerán aquí.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {dates.map((d) => {
            const isOverdue = d < today;
            const isToday = d === today;
            return (
              <div key={d} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className={`text-sm font-semibold ${isOverdue ? "text-red-700" : isToday ? "text-slate-900" : "text-slate-700"}`}>
                  {fmtDate(d)} {isToday && <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">Hoy</span>}
                  {isOverdue && <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Atrasado</span>}
                </p>
                <ul className="mt-2 space-y-1">
                  {byDate.get(d)!.map((e, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Link href={e.href} className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                        {e.time && <span className="font-mono text-xs text-slate-500">{e.time}</span>}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.cls}`}>{e.label}</span>
                        <span className="text-slate-700">{e.title}</span>
                      </Link>
                      {e.apptId && (
                        <form action={deleteAppointment}>
                          <input type="hidden" name="id" value={e.apptId} />
                          <ConfirmSubmit message="¿Eliminar esta cita?" className="px-2 text-xs text-slate-300 hover:text-red-600">✕</ConfirmSubmit>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
