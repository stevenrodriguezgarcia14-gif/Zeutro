import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createExpense } from "../actions";
import { getCurrentOrg, getOrgToday } from "@/lib/org";
import { getExpenseCategories } from "@/lib/guide";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; project?: string }>;
}) {
  const { error, project } = await searchParams;
  const org = await getCurrentOrg();
  const today = await getOrgToday();
  const supabase = await createClient();
  // Las categorías sugeridas dependen del tipo de negocio: un contratista que
  // solo ve "Renta, Software, Marketing" concluye, con razón, que la
  // herramienta no es para él. El campo sigue siendo texto libre.
  const CATEGORIES = getExpenseCategories(org?.business_type);
  const [{ data: accounts }, { data: projects }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("projects")
      .select("id, name")
      .in("status", ["planning", "active", "on_hold"])
      .order("created_at", { ascending: false }),
  ]);

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
        {(projects ?? []).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700">¿Es de algún trabajo? (opcional)</label>
            <select
              name="project_id"
              defaultValue={project ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">— Gasto general del negocio —</option>
              {(projects ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Elígelo y este gasto se descuenta de la ganancia de ese trabajo. Si no lo ligas, el trabajo se ve más
              rentable de lo que es.
            </p>
          </div>
        )}
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
