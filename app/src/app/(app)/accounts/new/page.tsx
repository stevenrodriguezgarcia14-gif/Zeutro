import Link from "next/link";
import { createAccount } from "../actions";

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/accounts" className="text-sm text-slate-500 hover:underline">
        ← Cuentas
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nueva cuenta</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createAccount} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input
            name="name"
            required
            placeholder="Ej. BBVA principal, Efectivo, Caja chica"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo</label>
            <select
              name="type"
              defaultValue="bank"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="bank">Banco</option>
              <option value="cash">Efectivo</option>
              <option value="petty_cash">Caja chica</option>
              <option value="credit_card">Tarjeta de crédito</option>
              <option value="digital_wallet">Billetera digital</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Saldo actual</label>
            <input
              name="opening_balance"
              type="number"
              step="0.01"
              defaultValue="0"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Institución (opcional)</label>
          <input
            name="institution"
            placeholder="Banco, billetera, etc."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
        >
          Crear cuenta
        </button>
      </form>
    </div>
  );
}
