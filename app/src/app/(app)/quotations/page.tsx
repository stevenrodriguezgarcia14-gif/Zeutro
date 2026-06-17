import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "Enviada", cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceptada", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  expired: { label: "Vencida", cls: "bg-amber-100 text-amber-700" },
  converted: { label: "Convertida", cls: "bg-slate-900 text-white" },
};

type Row = { id: string; number: string; valid_until: string; total_minor: number; status: string; customers: { legal_name: string } | null };

export default async function QuotationsPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotations")
    .select("id, number, valid_until, total_minor, status, customers(legal_name)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} cotización(es)</p>
        </div>
        <Link href="/quotations/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ Nueva cotización</Link>
      </div>
      <div className="mt-4"><ModuleHelp slug="quotations" /></div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no tienes cotizaciones. Crea presupuestos para enviar a tus clientes.</p>
          <Link href="/quotations/new" className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Crear la primera</Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Válida hasta</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((q) => {
                const st = STATUS[q.status] ?? STATUS.draft;
                return (
                  <tr key={q.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3"><Link href={`/quotations/${q.id}`} className="font-medium text-slate-900 hover:underline">{q.number}</Link></td>
                    <td className="px-4 py-3 text-slate-600">{q.customers?.legal_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{q.valid_until}</td>
                    <td className="px-4 py-3 text-right text-slate-900">{formatMoney(q.total_minor, currency)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span></td>
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
