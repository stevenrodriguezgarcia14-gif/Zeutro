import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

type Item = {
  kind: "cobro" | "venta" | "seguimiento";
  title: string;
  reason: string;
  impact: number;
  score: number;
  href: string;
  cta: string;
};

const KIND = {
  cobro: { label: "Cobrar", cls: "bg-red-100 text-red-700" },
  venta: { label: "Vender", cls: "bg-blue-100 text-blue-700" },
  seguimiento: { label: "Seguimiento", cls: "bg-amber-100 text-amber-700" },
};

export default async function PrioritiesPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const days = (d: string) => Math.round((Date.now() - new Date(d).getTime()) / 86400000);

  const [{ data: invoices }, { data: opps }, { data: quotes }, { data: tasks }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, number, balance_minor, due_date, customers(legal_name)")
      .in("status", ["issued", "partially_paid", "overdue"])
      .gt("balance_minor", 0),
    supabase
      .from("opportunities")
      .select("id, title, amount_minor, expected_close_date, stages(probability_bps)")
      .eq("status", "open"),
    supabase
      .from("quotations")
      .select("id, number, total_minor, customers(legal_name)")
      .eq("status", "sent"),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority")
      .neq("status", "done")
      .neq("status", "cancelled")
      .not("due_date", "is", null)
      .lte("due_date", in7),
  ]);

  const taskList = (tasks ?? []) as { id: string; title: string; due_date: string; priority: string }[];

  const items: Item[] = [];

  for (const i of (invoices ?? []) as unknown as { id: string; number: string; balance_minor: number; due_date: string; customers: { legal_name: string } | null }[]) {
    const d = days(i.due_date);
    const name = i.customers?.legal_name ?? "Cliente";
    if (d > 0) {
      items.push({ kind: "cobro", title: `Cobrar a ${name}`, reason: `Factura ${i.number} vencida hace ${d} día(s)`, impact: i.balance_minor, score: i.balance_minor * (1 + Math.min(d, 30) / 30), href: `/invoices/${i.id}`, cta: "Cobrar" });
    } else if (i.due_date <= in7) {
      items.push({ kind: "cobro", title: `Cobrar a ${name}`, reason: `Factura ${i.number} vence en ${Math.abs(d)} día(s)`, impact: i.balance_minor, score: i.balance_minor * 0.8, href: `/invoices/${i.id}`, cta: "Ver" });
    }
  }

  for (const o of (opps ?? []) as unknown as { id: string; title: string; amount_minor: number; expected_close_date: string | null; stages: { probability_bps: number } | null }[]) {
    const closingSoon = o.expected_close_date && o.expected_close_date <= in7;
    if (!closingSoon) continue;
    const impact = Math.round((o.amount_minor * (o.stages?.probability_bps ?? 0)) / 10000);
    items.push({ kind: "venta", title: `Cerrar venta: ${o.title}`, reason: `Cierre estimado ${o.expected_close_date}`, impact, score: impact * 0.7, href: `/sales`, cta: "Avanzar" });
  }

  for (const q of (quotes ?? []) as unknown as { id: string; number: string; total_minor: number; customers: { legal_name: string } | null }[]) {
    const impact = Math.round(q.total_minor * 0.4);
    items.push({ kind: "seguimiento", title: `Dar seguimiento a ${q.customers?.legal_name ?? "cliente"}`, reason: `Cotización ${q.number} enviada, sin respuesta`, impact, score: impact * 0.6, href: `/quotations/${q.id}`, cta: "Seguir" });
  }

  items.sort((a, b) => b.score - a.score);
  const top = items.slice(0, 15);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Centro de Prioridades</h1>
      <p className="mt-1 text-sm text-slate-500">Lo más importante de hoy, ordenado por impacto en tu dinero.</p>
      <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">¿Cómo se ordena esto?</summary>
        <p className="mt-2">
          Combinamos <b>cuánto dinero hay en juego</b> con la <b>urgencia</b>: las facturas más vencidas y de mayor monto suben,
          luego las ventas próximas a cerrar (por monto y probabilidad) y el seguimiento de cotizaciones enviadas. Así lo de arriba
          es lo que más mueve tu caja hoy.
        </p>
      </details>

      {taskList.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Tus tareas (hoy y vencidas)</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {taskList
              .sort((a, b) => a.due_date.localeCompare(b.due_date))
              .map((t) => {
                const overdue = t.due_date < today;
                return (
                  <li key={t.id} className="flex items-center justify-between">
                    <span className="text-slate-800">{t.title}</span>
                    <span className={`text-xs ${overdue ? "font-medium text-red-600" : "text-slate-400"}`}>
                      {overdue ? "vencida" : t.due_date === today ? "hoy" : t.due_date}
                    </span>
                  </li>
                );
              })}
          </ul>
          <Link href="/tasks" className="mt-2 inline-block text-xs font-medium text-slate-600 hover:underline">Ver todas las tareas →</Link>
        </div>
      )}

      {top.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          🎉 Nada urgente por ahora. ¡Vas al día!
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {top.map((it, idx) => {
            const k = KIND[it.kind];
            return (
              <div key={idx} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{idx + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${k.cls}`}>{k.label}</span>
                      <p className="font-medium text-slate-900">{it.title}</p>
                    </div>
                    <p className="text-sm text-slate-500">{it.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {it.impact > 0 && <span className="text-sm font-semibold text-slate-900">{formatMoney(it.impact, currency)}</span>}
                  <Link href={it.href} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">{it.cta}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
