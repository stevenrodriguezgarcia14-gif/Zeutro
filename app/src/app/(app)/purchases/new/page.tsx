import Link from "next/link";
import { createPurchase } from "../actions";

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/purchases" className="text-sm text-slate-500 hover:underline">← Compras</Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nueva compra</h1>
      <p className="mt-1 text-sm text-slate-500">Una compra que hiciste para revender. Luego le agregas productos y gastos.</p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createPurchase} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input name="name" required placeholder='Ej. "Compra Shein Junio 2026"' className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha</label>
          <input name="purchase_date" type="date" defaultValue={today} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción (opcional)</label>
          <input name="description" placeholder="Ej. ropa de temporada, distribuidor local…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Notas (opcional)</label>
          <textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900" />
        </div>
        <button className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">Crear compra</button>
      </form>
    </div>
  );
}
