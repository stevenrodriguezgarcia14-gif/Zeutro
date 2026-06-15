import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { PrintButton } from "@/components/PrintButton";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(legal_name, tax_id, email, billing_address)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const [{ data: items }, { data: org }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id),
    supabase
      .from("organizations")
      .select("name, legal_name, tax_id, logo_url")
      .eq("id", invoice.organization_id)
      .single(),
  ]);

  const currency = invoice.currency;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Barra de acciones (no se imprime) */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <Link href={`/invoices/${id}`} className="text-sm text-slate-500 hover:underline">
          ← Volver a la factura
        </Link>
        <PrintButton />
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {org?.logo_url && (
              <Image src={org.logo_url} alt="Logo" width={64} height={64} className="h-16 w-16 object-contain" unoptimized />
            )}
            <div>
              <p className="text-lg font-bold text-slate-900">{org?.name}</p>
              {org?.legal_name && <p className="text-sm text-slate-500">{org.legal_name}</p>}
              {org?.tax_id && <p className="text-sm text-slate-500">RFC/ID: {org.tax_id}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">FACTURA</h1>
            <p className="text-sm text-slate-600">{invoice.number}</p>
            <p className="mt-2 text-sm text-slate-500">Emisión: {invoice.issue_date}</p>
            <p className="text-sm text-slate-500">Vence: {invoice.due_date}</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-slate-50 p-4 print:bg-white print:p-0 print:mt-6">
          <p className="text-xs uppercase tracking-wide text-slate-400">Facturar a</p>
          <p className="font-medium text-slate-900">{invoice.customers?.legal_name}</p>
          {invoice.customers?.tax_id && <p className="text-sm text-slate-500">RFC/ID: {invoice.customers.tax_id}</p>}
          {invoice.customers?.email && <p className="text-sm text-slate-500">{invoice.customers.email}</p>}
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Concepto</th>
              <th className="py-2 text-right font-medium">Cant.</th>
              <th className="py-2 text-right font-medium">Precio</th>
              <th className="py-2 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id} className="border-b border-slate-100">
                <td className="py-2 text-slate-800">{it.description}</td>
                <td className="py-2 text-right text-slate-600">{it.quantity}</td>
                <td className="py-2 text-right text-slate-600">{formatMoney(it.unit_price_minor, currency)}</td>
                <td className="py-2 text-right text-slate-900">{formatMoney(it.line_total_minor, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(invoice.subtotal_minor, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Impuestos</span>
              <span>{formatMoney(invoice.tax_minor, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(invoice.total_minor, currency)}</span>
            </div>
            {invoice.paid_minor > 0 && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Pagado</span>
                  <span>{formatMoney(invoice.paid_minor, currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Saldo</span>
                  <span>{formatMoney(invoice.balance_minor, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <p className="font-medium text-slate-700">Notas</p>
            <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">Gracias por su preferencia · Generado con Zentro</p>
      </div>
    </div>
  );
}
