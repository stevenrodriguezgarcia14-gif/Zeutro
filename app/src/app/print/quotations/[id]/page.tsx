import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { PrintButton } from "@/components/PrintButton";
import { LineItemsTable } from "@/components/LineItems";

export default async function QuotationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quotations")
    .select("*, customers(legal_name, tax_id, email)")
    .eq("id", id)
    .single();
  if (!q) notFound();

  const [{ data: items }, { data: org }] = await Promise.all([
    supabase.from("quotation_items").select("*").eq("quotation_id", id).order("position").order("created_at"),
    supabase.from("organizations").select("name, legal_name, tax_id, logo_url").eq("id", q.organization_id).single(),
  ]);
  const currency = q.currency;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <Link href={`/quotations/${id}`} className="text-sm text-slate-500 hover:underline">← Volver</Link>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {org?.logo_url && <Image src={org.logo_url} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain" unoptimized />}
            <div>
              <p className="text-lg font-bold text-slate-900">{org?.name}</p>
              {org?.legal_name && <p className="text-sm text-slate-500">{org.legal_name}</p>}
              {org?.tax_id && <p className="text-sm text-slate-500">RFC/ID: {org.tax_id}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">COTIZACIÓN</h1>
            <p className="text-sm text-slate-600">{q.number}</p>
            <p className="mt-2 text-sm text-slate-500">Fecha: {q.issue_date}</p>
            <p className="text-sm text-slate-500">Válida hasta: {q.valid_until}</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-slate-50 p-4 print:bg-white print:p-0 print:mt-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Para</p>
          <p className="font-medium text-slate-900">{q.customers?.legal_name}</p>
          {q.customers?.tax_id && <p className="text-sm text-slate-500">RFC/ID: {q.customers.tax_id}</p>}
          {q.customers?.email && <p className="text-sm text-slate-500">{q.customers.email}</p>}
        </div>

        <LineItemsTable items={items ?? []} currency={currency} variant="print" />

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(q.subtotal_minor, currency)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Impuestos</span><span>{formatMoney(q.tax_minor, currency)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatMoney(q.total_minor, currency)}</span></div>
          </div>
        </div>

        {q.notes && <div className="mt-8 border-t border-slate-100 pt-4 text-sm text-slate-500"><p className="font-medium text-slate-700">Alcance y condiciones</p><p className="mt-1 whitespace-pre-wrap">{q.notes}</p></div>}
        <p className="mt-10 text-center text-xs text-slate-400">Cotización generada con Zentro</p>
      </div>
    </div>
  );
}
