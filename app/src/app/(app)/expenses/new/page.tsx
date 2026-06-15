import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createExpense } from "../actions";

const CATEGORIES = [
  "Renta",
  "Servicios (luz, agua, internet)",
  "Sueldos",
  "Insumos / Materia prima",
  "Mercancía",
  "Marketing / Publicidad",
  "Software / Suscripciones",
  "Transporte / Combustible",
  "Comisiones bancarias",
  "Impuestos",
  "Honorarios",
  "Otros",
];

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/expenses" className="text-sm text-slate-500 hover:underline">
        ← Gastos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nuevo gasto</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createExpense} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción *</label>
          <input
            name="description"
            required
            placeholder="Ej. Pago de internet de la oficina"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Categoría</label>
            <input
              name="category"
              list="categorias"
              placeholder="Elige o escribe"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
            <datalist id="categorias">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Proveedor</label>
            <input
              name="vendor"
              placeholder="Opcional"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Monto *</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Impuesto incluido (opcional)</label>
            <input
              name="tax"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input
              name="expense_date"
              type="date"
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Estado</label>
            <select
              name="payment_status"
              defaultValue="paid"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente de pagar</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Pagado desde la cuenta (opcional)</label>
          <select
            name="account_id"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">— Ninguna —</option>
            {(accounts ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Si eliges una cuenta y el gasto está pagado, se descontará de su saldo.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="is_deductible" defaultChecked className="rounded border-slate-300" />
          Es deducible de impuestos
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
        >
          Guardar gasto
        </button>
      </form>
    </div>
  );
}
