import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney, fromMinor } from "@/lib/money";
import { issueInvoice, registerPayment } from "../actions";

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-slate-100 text-slate-600" },
  issued: { label: "Emitida", cls: "bg-blue-100 text-blue-700" },
  partially_paid: { label: "Pago parcial", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Pagada", cls: "bg-green-100 text-green-700" },
  overdue: { label: "Vencida", cls: "bg-red-100 text-red-700" },
  void: { label: "Anulada", cls: "bg-slate-100 text-slate-400" },
  credited: { label: "Con NC", cls: "bg-slate-100 text-slate-500" },
};

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; paid?: string }>;
}) {
  const { id } = await params;
  const { error, paid } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, customers(legal_name, email)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const [{ data: items }, { data: allocations }, { data: accounts }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id),
    supabase
      .from("payment_allocations")
      .select("amount_minor, payments(paid_at, method, reference)")
      .eq("invoice_id", id),
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
  ]);

  const st = STATUS[invoice.status] ?? STATUS.draft;
  const canPay = !["draft", "paid", "void"].includes(invoice.status) && invoice.balance_minor > 0;
  const pays = (allocations ?? []) as unknown as {
    amount_minor: number;
    payments: { paid_at: string; method: string; reference: string | null } | null;
  }[];

  return (
    <div>
      <Link href="/invoices" className="text-sm text-slate-500 hover:underline">
        ← Facturas
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Factura {invoice.number}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoice.customers?.legal_name} · emitida {invoice.issue_date} · vence {invoice.due_date}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>{st.label}</span>
          <a
            href={`/print/invoices/${invoice.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-700 underline hover:text-slate-900"
          >
            Ver / Descargar PDF
          </a>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {paid && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Pago registrado correctamente.</p>}

      {invoice.status === "draft" && (
        <form action={issueInvoice} className="mt-4">
          <input type="hidden" name="invoice_id" value={invoice.id} />
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Emitir factura
          </button>
          <span className="ml-3 text-xs text-slate-400">Una vez emitida podrás registrar pagos.</span>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conceptos + totales */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
            <div className="flex w-64 justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(invoice.subtotal_minor, currency)}</span>
            </div>
            <div className="flex w-64 justify-between text-slate-600">
              <span>Impuestos</span>
              <span>{formatMoney(invoice.tax_minor, currency)}</span>
            </div>
            <div className="flex w-64 justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
              <span>Total</span>
              <span>{formatMoney(invoice.total_minor, currency)}</span>
            </div>
            <div className="flex w-64 justify-between text-slate-600">
              <span>Pagado</span>
              <span>{formatMoney(invoice.paid_minor, currency)}</span>
            </div>
            <div className="flex w-64 justify-between text-base font-bold text-slate-900">
              <span>Saldo</span>
              <span>{formatMoney(invoice.balance_minor, currency)}</span>
            </div>
          </div>
        </div>

        {/* Pagos */}
        <div>
          {canPay && (
            <form action={registerPayment} className="rounded-2xl border border-slate-200 bg-white p-5">
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <h2 className="font-semibold text-slate-900">Registrar pago</h2>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <label className="block text-slate-700">Monto</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={fromMinor(invoice.balance_minor)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700">Método</label>
                  <select
                    name="method"
                    defaultValue="transfer"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                  >
                    <option value="transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="check">Cheque</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700">Cuenta (opcional)</label>
                  <select
                    name="account_id"
                    defaultValue=""
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                  >
                    <option value="">— Ninguna —</option>
                    {(accounts ?? []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700">Fecha</label>
                  <input
                    name="paid_at"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                  />
                </div>
                <button className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
                  Registrar pago
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Historial de pagos</h2>
            {pays.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sin pagos registrados.</p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {pays.map((p, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span className="text-slate-600">
                      {p.payments?.paid_at} · {p.payments?.method}
                    </span>
                    <span className="font-medium text-slate-900">{formatMoney(p.amount_minor, currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
