import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { recordMovement } from "../actions";

const TYPE_LABEL: Record<string, string> = {
  bank: "Banco",
  cash: "Efectivo",
  petty_cash: "Caja chica",
  credit_card: "Tarjeta de crédito",
  digital_wallet: "Billetera digital",
};

export default async function AccountDetailPage({
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

  const { data: account } = await supabase.from("accounts").select("*").eq("id", id).single();
  if (!account) notFound();

  const { data: txns } = await supabase
    .from("account_transactions")
    .select("id, direction, amount_minor, transaction_date, description, source_type")
    .eq("account_id", id)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = txns ?? [];

  return (
    <div>
      <Link href="/accounts" className="text-sm text-slate-500 hover:underline">
        ← Cuentas
      </Link>
      <div className="mt-2 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{TYPE_LABEL[account.type] ?? account.type}</p>
          <h1 className="text-2xl font-bold text-slate-900">{account.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Saldo actual</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(account.current_balance_minor, currency)}</p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Descripción</th>
                  <th className="px-4 py-2 font-medium">Origen</th>
                  <th className="px-4 py-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      Sin movimientos todavía.
                    </td>
                  </tr>
                ) : (
                  rows.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2 text-slate-600">{t.transaction_date}</td>
                      <td className="px-4 py-2 text-slate-800">{t.description ?? "—"}</td>
                      <td className="px-4 py-2 text-slate-400">{t.source_type ?? "manual"}</td>
                      <td className={`px-4 py-2 text-right font-medium ${t.direction === "in" ? "text-green-600" : "text-red-600"}`}>
                        {t.direction === "in" ? "+" : "−"}
                        {formatMoney(t.amount_minor, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <form action={recordMovement} className="rounded-2xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="account_id" value={account.id} />
            <h2 className="font-semibold text-slate-900">Registrar movimiento</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <label className="block text-slate-700">Tipo</label>
                <select name="direction" defaultValue="in" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
                  <option value="in">Ingreso (entra dinero)</option>
                  <option value="out">Egreso (sale dinero)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700">Monto</label>
                <input name="amount" type="number" step="0.01" min="0" required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700">Fecha</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700">Descripción</label>
                <input name="description" placeholder="Opcional" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900" />
              </div>
              <button className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
                Guardar movimiento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
