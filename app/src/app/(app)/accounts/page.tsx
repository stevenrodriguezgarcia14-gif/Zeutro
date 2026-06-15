import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { transfer } from "./actions";

const TYPE_LABEL: Record<string, string> = {
  bank: "Banco",
  cash: "Efectivo",
  petty_cash: "Caja chica",
  credit_card: "Tarjeta de crédito",
  digital_wallet: "Billetera digital",
};

type Acc = {
  id: string;
  name: string;
  type: string;
  current_balance_minor: number;
  institution: string | null;
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("id, name, type, current_balance_minor, institution")
    .eq("is_active", true)
    .order("created_at");

  const rows = (data ?? []) as Acc[];
  const total = rows.reduce((s, a) => s + a.current_balance_minor, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cuentas</h1>
          <p className="mt-1 text-sm text-slate-500">Tu dinero en bancos, efectivo y más.</p>
        </div>
        <Link
          href="/accounts/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nueva cuenta
        </Link>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Dinero total disponible</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{formatMoney(total, currency)}</p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Aún no tienes cuentas. Crea una (banco, efectivo, caja…).</p>
          <Link
            href="/accounts/new"
            className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Crear la primera
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <Link
              key={a.id}
              href={`/accounts/${a.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{TYPE_LABEL[a.type] ?? a.type}</p>
              <p className="mt-1 font-semibold text-slate-900">{a.name}</p>
              {a.institution && <p className="text-xs text-slate-400">{a.institution}</p>}
              <p className="mt-3 text-xl font-bold text-slate-900">{formatMoney(a.current_balance_minor, currency)}</p>
            </Link>
          ))}
        </div>
      )}

      {rows.length >= 2 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Transferir entre cuentas</h2>
          <form action={transfer} className="mt-3 flex flex-wrap items-end gap-3 text-sm">
            <div>
              <label className="block text-slate-700">De</label>
              <select name="from_account" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
                {rows.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700">A</label>
              <select name="to_account" required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900">
                {rows.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700">Monto</label>
              <input name="amount" type="number" step="0.01" min="0" required className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-right outline-none focus:border-slate-900" />
            </div>
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800">Transferir</button>
          </form>
        </div>
      )}
    </div>
  );
}
