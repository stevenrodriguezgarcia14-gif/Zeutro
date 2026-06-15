import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

type Row = {
  id: string;
  number: string;
  due_date: string;
  balance_minor: number;
  status: string;
  customers: { legal_name: string } | null;
};

function daysBetween(due: string, today: string) {
  return Math.round((new Date(today).getTime() - new Date(due).getTime()) / 86400000);
}

export default async function CollectionsPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("invoices")
    .select("id, number, due_date, balance_minor, status, customers(legal_name)")
    .in("status", ["issued", "partially_paid", "overdue"])
    .gt("balance_minor", 0)
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const totalDue = rows.reduce((s, r) => s + r.balance_minor, 0);
  const overdue = rows.filter((r) => r.due_date < today);
  const totalOverdue = overdue.reduce((s, r) => s + r.balance_minor, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cobranzas</h1>
      <p className="mt-1 text-sm text-slate-500">A quién cobrar, ordenado por urgencia.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total por cobrar</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalDue, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Vencido</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatMoney(totalOverdue, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Facturas por cobrar</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{rows.length}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          🎉 No tienes nada pendiente de cobro. ¡Bien!
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Saldo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const d = daysBetween(r.due_date, today);
                const isOverdue = d > 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.customers?.legal_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.number}</td>
                    <td className="px-4 py-3 text-slate-600">{r.due_date}</td>
                    <td className="px-4 py-3">
                      {isOverdue ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Vencida hace {d} día(s)
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Vence en {Math.abs(d)} día(s)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatMoney(r.balance_minor, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/invoices/${r.id}`}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Registrar pago
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
