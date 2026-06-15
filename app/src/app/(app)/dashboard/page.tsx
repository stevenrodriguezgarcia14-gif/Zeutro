import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const [{ count: customersCount }, { count: productsCount }, { data: invoices }] =
    await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("balance_minor, status, due_date"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const inv = invoices ?? [];
  const outstanding = inv
    .filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((s, i) => s + (i.balance_minor ?? 0), 0);
  const overdueCount = inv.filter(
    (i) => i.balance_minor > 0 && i.due_date < today && i.status !== "paid" && i.status !== "void",
  ).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        ¿Qué está pasando en tu negocio, {org?.name}?
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Por cobrar" value={formatMoney(outstanding, currency)} hint="Saldo de facturas abiertas" />
        <Card title="Facturas vencidas" value={String(overdueCount)} hint="Requieren cobranza" />
        <Card title="Clientes" value={String(customersCount ?? 0)} />
        <Card title="Productos y servicios" value={String(productsCount ?? 0)} />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        Próximamente aquí: Centro de Prioridades (qué cobrar y hacer hoy), flujo de caja y
        embudo de ventas. Por ahora puedes empezar dando de alta tus{" "}
        <a href="/customers" className="font-medium text-slate-900 hover:underline">clientes</a> y{" "}
        <a href="/products" className="font-medium text-slate-900 hover:underline">productos</a>.
      </div>
    </div>
  );
}
