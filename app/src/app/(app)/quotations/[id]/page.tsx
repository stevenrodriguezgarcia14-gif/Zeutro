import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { setQuotationStatus, convertToInvoice } from "../actions";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  sent: { label: "Enviada", cls: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceptada", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", cls: "bg-red-100 text-red-700" },
  expired: { label: "Vencida", cls: "bg-amber-100 text-amber-700" },
  converted: { label: "Convertida", cls: "bg-slate-900 text-white" },
};

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setQuotationStatus}>
      <input type="hidden" name="quotation_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</button>
    </form>
  );
}

export default async function QuotationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const { data: q } = await supabase.from("quotations").select("*, customers(legal_name)").eq("id", id).single();
  if (!q) notFound();
  const { data: items } = await supabase.from("quotation_items").select("*").eq("quotation_id", id);

  const today = new Date().toISOString().slice(0, 10);
  const isExpired = ["draft", "sent"].includes(q.status) && q.valid_until && q.valid_until < today;
  const st = isExpired ? STATUS.expired : (STATUS[q.status] ?? STATUS.draft);

  return (
    <div>
      <Link href="/quotations" className="text-sm text-slate-500 hover:underline">← Cotizaciones</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotización {q.number}</h1>
          <p className="mt-1 text-sm text-slate-500">{q.customers?.legal_name} · válida hasta {q.valid_until}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>{st.label}</span>
          <a href={`/print/quotations/${q.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 underline hover:text-slate-900">Ver / Descargar PDF</a>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {q.status === "draft" && <StatusButton id={q.id} status="sent" label="Marcar como enviada" />}
        {(q.status === "sent") && (
          <>
            <StatusButton id={q.id} status="accepted" label="Marcar aceptada" />
            <StatusButton id={q.id} status="rejected" label="Marcar rechazada" />
          </>
        )}
        {["draft", "sent", "accepted"].includes(q.status) && (
          <form action={convertToInvoice}>
            <input type="hidden" name="quotation_id" value={q.id} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              {q.status === "accepted" ? "Convertir a factura →" : "Aceptar y facturar →"}
            </button>
          </form>
        )}
        {q.status === "converted" && q.invoice_id && (
          <Link href={`/invoices/${q.invoice_id}`} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Ver factura generada →</Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Concepto</th>
              <th className="px-4 py-2 font-medium text-right">Cant.</th>
              <th className="px-4 py-2 font-medium text-right">Precio</th>
              <th className="px-4 py-2 font-medium text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-2 text-slate-900">{it.description}</td>
                <td className="px-4 py-2 text-right text-slate-600">{it.quantity}</td>
                <td className="px-4 py-2 text-right text-slate-600">{formatMoney(it.unit_price_minor, currency)}</td>
                <td className="px-4 py-2 text-right text-slate-900">{formatMoney(it.line_total_minor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col items-end gap-1 text-sm">
        <div className="flex w-64 justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(q.subtotal_minor, currency)}</span></div>
        <div className="flex w-64 justify-between text-slate-600"><span>Impuestos</span><span>{formatMoney(q.tax_minor, currency)}</span></div>
        <div className="flex w-64 justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatMoney(q.total_minor, currency)}</span></div>
      </div>
    </div>
  );
}
