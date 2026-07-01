import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  issued: { label: "Emitida", cls: "bg-blue-100 text-blue-700" },
  partially_paid: { label: "Pago parcial", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagada", cls: "bg-green-100 text-green-700" },
  overdue: { label: "Vencida", cls: "bg-red-100 text-red-700" },
  void: { label: "Anulada", cls: "bg-slate-100 text-slate-400" },
  credited: { label: "Con NC", cls: "bg-slate-100 text-slate-500" },
};

type Row = {
  id: string;
  number: string;
  issue_date: string;
  due_date: string;
  total_minor: number;
  balance_minor: number;
  status: string;
  customers: { legal_name: string } | null;
};

export default async function InvoicesPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, number, issue_date, due_date, total_minor, balance_minor, status, customers(legal_name)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} factura(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Descarga CSV servida por un route handler: <a> es correcto (Link haría prefetch del archivo). */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/export/invoices"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar
          </a>
          <Link
            href="/invoices/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nueva factura
          </Link>
        </div>
      </div>
      <div className="mt-4"><ModuleHelp slug="invoices" /></div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no tienes facturas.</p>
          <Link
            href="/invoices/new"
            className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Saldo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((inv) => {
                const st = STATUS[inv.status] ?? STATUS.draft;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-slate-900 hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.customers?.legal_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.due_date}</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatMoney(inv.total_minor, currency)}</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatMoney(inv.balance_minor, currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
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
