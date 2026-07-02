import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { formatMoney } from "@/lib/money";
import { ModuleHelp } from "@/components/ModuleHelp";
import { SearchBox } from "@/components/SearchBox";
import { matches } from "@/lib/search";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const org = await getCurrentOrg();
  const currency = org?.base_currency ?? "MXN";
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, type, unit, sale_price_minor, cost_price_minor, is_active")
    .order("created_at", { ascending: false });

  // Filtro insensible a acentos ("cafe" encuentra "Café").
  const rows = (products ?? []).filter((p) => matches(term, p.name));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Productos y servicios</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} elemento(s)</p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Nuevo
        </Link>
      </div>
      <div className="mt-4"><ModuleHelp slug="products" /></div>

      <div className="mt-4"><SearchBox action="/products" q={term} placeholder="Buscar producto o servicio…" /></div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          {term ? (
            <p className="text-slate-600">Sin resultados para “{term}”.</p>
          ) : (
            <>
              <p className="text-slate-600">Aún no tienes productos ni servicios.</p>
              <Link
                href="/products/new"
                className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Crear el primero
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium text-right">Precio</th>
                <th className="px-4 py-3 font-medium text-right">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/products/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.type === "product" ? "Producto" : p.type === "bundle" ? "Paquete" : "Servicio"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    {formatMoney(p.sale_price_minor, currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {p.cost_price_minor != null ? formatMoney(p.cost_price_minor, currency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
