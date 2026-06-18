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
      <p className="mt-1 text-sm text-slate-500">
        Solo lo básico. En el siguiente paso subes la foto y Zentro te calcula el precio según tus
        costos.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form action={createProduct} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">¿Qué vendes? (nombre) *</label>
          <input
            name="name"
            required
            placeholder="Ej. Tres leches, Corte de cabello, Camiseta…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Tipo</label>
          <select
            name="type"
            defaultValue="product"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="product">Producto (algo físico que haces o vendes)</option>
            <option value="service">Servicio (trabajo, ej. corte, asesoría)</option>
            <option value="bundle">Paquete (varios juntos)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Unidad de venta</label>
          <input
            name="unit"
            list="unidades"
            defaultValue="unidad"
            placeholder="¿Cómo lo cobras?"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
          <datalist id="unidades">
            <option value="unidad" />
            <option value="porción" />
            <option value="hora" />
            <option value="día" />
            <option value="servicio" />
            <option value="paquete" />
            <option value="kg" />
            <option value="gramo" />
            <option value="litro" />
            <option value="metro" />
            <option value="docena" />
          </datalist>
          <p className="mt-1 text-xs text-slate-400">
            Es cómo mides una venta. Ej.: un pastel se vende por <b>porción</b>, una asesoría por{" "}
            <b>hora</b>, una camiseta por <b>unidad</b>. Si no sabes, deja “unidad”.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Precio de venta (opcional)</label>
            <input
              name="sale_price"
              type="number"
              step="0.01"
              min="0"
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
        <p className="-mt-2 text-xs text-slate-400">
          Si fabricas el producto, puedes dejarlos vacíos y usar la hoja de costos en el siguiente paso.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700">Código / SKU (opcional)</label>
          <input
            name="sku"
            placeholder="Ej. CAM-001"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input name="track_inventory" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
            Controlar inventario (solo para productos físicos)
          </label>
          <div className="mt-2">
            <label className="block text-xs text-slate-500">Stock inicial</label>
            <input
              name="stock_qty"
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Descripción (opcional)</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Detalles, presentación, características…"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
        >
          Crear producto →
        </button>
      </form>
    </div>
  );
}
