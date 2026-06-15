import Link from "next/link";
import { createProduct } from "../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/products" className="text-sm text-slate-500 hover:underline">
        ← Productos y servicios
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Nuevo producto o servicio</h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <form action={createProduct} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nombre *</label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipo</label>
            <select
              name="type"
              defaultValue="service"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="service">Servicio</option>
              <option value="product">Producto</option>
              <option value="bundle">Paquete</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Unidad</label>
            <input
              name="unit"
              defaultValue="unidad"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Precio de venta *</label>
            <input
              name="sale_price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Costo (opcional)</label>
            <input
              name="cost_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
