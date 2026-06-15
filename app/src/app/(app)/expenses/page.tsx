import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";

type Row = {
  id: string;
  description: string;
  category: string | null;
  vendor: string | null;
  amount_minor: number;
  expense_date: string;
  payment_status: string;
};

export default async function ExpensesPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("id, description, category, vendor, amount_minor, expense_date, payment_status")
    .order("expense_date", { ascending: false });

  const rows = (data ?? []) as Row[];
  const month = new Date().toISOString().slice(0, 7);
  const totalMonth = rows
    .filter((r) => r.expense_date.startsWith(month))
    .reduce((s, r) => s + r.amount_minor, 0);
  const pending = rows
    .filter((r) => r.payment_status === "pending")
    .reduce((s, r) => s + r.amount_minor, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} gasto(s) registrado(s)</p>
        </div>
        <Link
          href="/expenses/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nuevo gasto
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Gastos este mes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatMoney(totalMonth, currency)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pendiente de pagar</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatMoney(pending, currency)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no registras gastos.</p>
          <Link
            href="/expenses/new"
            className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Registrar el primero
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{e.expense_date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{e.description}</td>
                  <td className="px-4 py-3 text-slate-600">{e.category ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3">
                    {e.payment_status === "paid" ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Pagado</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">{formatMoney(e.amount_minor, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
