import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

type Ev = { date: string; kind: string; label: string; title: string; href: string; cls: string };

export default async function CalendarPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  const [{ data: tasks }, { data: invoices }, { data: quotes }, { data: opps }] = await Promise.all([
    supabase.from("tasks").select("id, title, due_date, status").not("due_date", "is", null).neq("status", "done").neq("status", "cancelled"),
    supabase.from("invoices").select("id, number, due_date, balance_minor, status, customers(legal_name)").in("status", ["issued", "partially_paid", "overdue"]).gt("balance_minor", 0),
    supabase.from("quotations").select("id, number, valid_until, customers(legal_name)").eq("status", "sent"),
    supabase.from("opportunities").select("id, title, expected_close_date").eq("status", "open").not("expected_close_date", "is", null),
  ]);

  const ev: Ev[] = [];
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

  const visible = ev.filter((e) => e.date <= horizon).sort((a, b) => a.date.localeCompare(b.date));
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
      <h1 className="text-2xl font-bold text-slate-900">Calendario</h1>
      <p className="mt-1 text-sm text-slate-500">Todo lo que tiene fecha: tareas, cobros, cotizaciones y cierres de venta (próximos 60 días).</p>

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
                    <li key={idx}>
                      <Link href={e.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.cls}`}>{e.label}</span>
                        <span className="text-slate-700">{e.title}</span>
                      </Link>
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
