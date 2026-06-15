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
  payment_link: string | null;
  customers: { legal_name: string; phone: string | null; whatsapp: string | null; email: string | null } | null;
};

function daysBetween(due: string, today: string) {
  return Math.round((new Date(today).getTime() - new Date(due).getTime()) / 86400000);
}

export default async function CollectionsPage() {
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const orgName = org?.name ?? "";
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("invoices")
    .select("id, number, due_date, balance_minor, status, payment_link, customers(legal_name, phone, whatsapp, email)")
    .in("status", ["issued", "partially_paid", "overdue"])
    .gt("balance_minor", 0)
    .order("due_date", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const totalDue = rows.reduce((s, r) => s + r.balance_minor, 0);
  const overdue = rows.filter((r) => r.due_date < today);
  const totalOverdue = overdue.reduce((s, r) => s + r.balance_minor, 0);

  function reminderMessage(r: Row) {
    const name = r.customers?.legal_name ?? "";
    let msg = `Hola ${name}, le recuerdo la factura ${r.number} por ${formatMoney(r.balance_minor, currency)} con vencimiento ${r.due_date}.`;
    if (r.payment_link) msg += ` Puede pagar aquí: ${r.payment_link}`;
    msg += ` ¡Gracias! — ${orgName}`;
    return msg;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Cobranzas</h1>
      <p className="mt-1 text-sm text-slate-500">A quién cobrar, ordenado por urgencia. Envía recordatorios con un clic.</p>

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
        <div className="mt-6 space-y-3">
          {rows.map((r) => {
            const d = daysBetween(r.due_date, today);
            const isOverdue = d > 0;
            const msg = reminderMessage(r);
            const phone = (r.customers?.whatsapp || r.customers?.phone || "").replace(/[^0-9]/g, "");
            const wa = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null;
            const mail = r.customers?.email
              ? `mailto:${r.customers.email}?subject=${encodeURIComponent("Recordatorio factura " + r.number)}&body=${encodeURIComponent(msg)}`
              : null;
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{r.customers?.legal_name ?? "—"}</p>
                    <p className="text-xs text-slate-500">
                      {r.number} ·{" "}
                      {isOverdue ? (
                        <span className="font-medium text-red-600">vencida hace {d} día(s)</span>
                      ) : (
                        <span className="text-blue-600">vence en {Math.abs(d)} día(s)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatMoney(r.balance_minor, currency)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                      Recordar por WhatsApp
                    </a>
                  )}
                  {mail && (
                    <a href={mail} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Recordar por correo
                    </a>
                  )}
                  <Link href={`/invoices/${r.id}`} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                    Registrar pago
                  </Link>
                  {!wa && !mail && <span className="text-xs text-slate-400">Agrega teléfono o correo al cliente para enviar recordatorios.</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
