import Link from "next/link";
import { createCustomer } from "../actions";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/customers" className="text-sm text-slate-500 hover:underline">
        ← Clientes
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nuevo cliente</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <form action={createCustomer} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre / Razón social *</label>
          <input
            name="legal_name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo</label>
            <select
              name="type"
              defaultValue="company"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="company">Empresa</option>
              <option value="person">Persona</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Términos de pago</label>
            <select
              name="payment_terms"
              defaultValue="contado"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="contado">Contado</option>
              <option value="net15">15 días</option>
              <option value="net30">30 días</option>
              <option value="net60">60 días</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">RFC / ID fiscal</label>
          <input
            name="tax_id"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Teléfono</label>
            <input
              name="phone"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
        >
          Guardar cliente
        </button>
      </form>
    </div>
  );
}
