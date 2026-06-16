import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { getPurchasesOverview } from "@/lib/purchasesOverview";

type Sev = "critical" | "high" | "warning" | "info";
type Alert = { sev: Sev; title: string; detail: string; href: string };

const SEV: Record<Sev, { label: string; cls: string; rank: number }> = {
  critical: { label: "Crítico", cls: "bg-red-100 text-red-700", rank: 0 },
  high: { label: "Importante", cls: "bg-orange-100 text-orange-700", rank: 1 },
  warning: { label: "Atención", cls: "bg-amber-100 text-amber-700", rank: 2 },
  info: { label: "Aviso", cls: "bg-blue-100 text-blue-700", rank: 3 },
};

export default async function AlertsPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: invoices }, { data: products }, { data: quotes }, { data: tasks }, compras] = await Promise.all([
    supabase.from("invoices").select("id, number, due_date, balance_minor, status, customers(legal_name)").in("status", ["issued", "partially_paid", "overdue"]).gt("balance_minor", 0),
    supabase.from("products").select("id, name, stock_qty, min_stock, sale_price_minor, cost_price_minor, track_inventory").eq("is_active", true),
    supabase.from("quotations").select("id, number, valid_until, customers(legal_name)").eq("status", "sent"),
    supabase.from("tasks").select("id, title, due_date").neq("status", "done").neq("status", "cancelled").not("due_date", "is", null).lt("due_date", today),
    getPurchasesOverview(),
  ]);

  const alerts: Alert[] = [];

  for (const i of (invoices ?? []) as unknown as { id: string; number: string; due_date: string; balance_minor: number; customers: { legal_name: string } | null }[]) {
    if (i.due_date < today) {
      const d = Math.round((Date.now() - new Date(i.due_date).getTime()) / 86400000);
      alerts.push({ sev: d > 15 ? "critical" : "high", title: `Factura vencida: ${i.number}`, detail: `${i.customers?.legal_name ?? ""} · ${formatMoney(i.balance_minor, currency)} · vencida hace ${d} día(s)`, href: `/invoices/${i.id}` });
    }
  }
  for (const p of (products ?? []) as { id: string; name: string; stock_qty: number; min_stock: number | null; sale_price_minor: number; cost_price_minor: number | null; track_inventory: boolean }[]) {
    if (p.sale_price_minor > 0 && p.cost_price_minor != null && p.cost_price_minor > p.sale_price_minor) {
      alerts.push({ sev: "high", title: `Vendes a pérdida: ${p.name}`, detail: `Precio ${formatMoney(p.sale_price_minor, currency)} < costo ${formatMoney(p.cost_price_minor, currency)}`, href: `/products/${p.id}` });
    }
    if (p.track_inventory && p.min_stock != null && p.stock_qty <= p.min_stock) {
      alerts.push({ sev: "warning", title: `Bajo stock: ${p.name}`, detail: `Quedan ${p.stock_qty} (mínimo ${p.min_stock})`, href: `/inventory` });
    }
  }
  for (const q of (quotes ?? []) as unknown as { id: string; number: string; valid_until: string; customers: { legal_name: string } | null }[]) {
    const expired = q.valid_until < today;
    alerts.push({ sev: expired ? "warning" : "info", title: `Cotización ${expired ? "vencida" : "sin respuesta"}: ${q.number}`, detail: `${q.customers?.legal_name ?? ""} · vence ${q.valid_until}`, href: `/quotations/${q.id}` });
  }
  const overdueTasks = (tasks ?? []) as { id: string; title: string; due_date: string }[];
  if (overdueTasks.length > 0) {
    alerts.push({ sev: "warning", title: `${overdueTasks.length} tarea(s) vencida(s)`, detail: overdueTasks.slice(0, 3).map((t) => t.title).join(", ") + (overdueTasks.length > 3 ? "…" : ""), href: "/tasks" });
  }
  if (compras.capitalEnMercancia > 0) {
    alerts.push({ sev: "info", title: "Mercancía sin recuperar", detail: `Tienes ${formatMoney(compras.capitalEnMercancia, currency)} invertidos en compras que aún no recuperas`, href: "/purchases" });
  }

  alerts.sort((a, b) => SEV[a.sev].rank - SEV[b.sev].rank);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Alertas</h1>
      <p className="mt-1 text-sm text-slate-500">Señales que requieren tu atención, en un solo lugar.</p>

      {alerts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          ✅ Todo en orden. Sin alertas por ahora.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {alerts.map((a, i) => (
            <Link key={i} href={a.href} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-400">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEV[a.sev].cls}`}>{SEV[a.sev].label}</span>
                <div>
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.detail}</p>
                </div>
              </div>
              <span className="text-slate-300">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
