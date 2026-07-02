import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ModuleHelp } from "@/components/ModuleHelp";
import { SearchBox } from "@/components/SearchBox";
import { matches } from "@/lib/search";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, legal_name, type, email, phone, status")
    .order("created_at", { ascending: false });

  // Filtro en memoria (la lista ya viene completa) insensible a acentos:
  // "sofia" debe encontrar a "Sofía". ilike de Postgres no ignora acentos.
  const rows = (customers ?? []).filter((c) => matches(term, c.legal_name, c.email, c.phone));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">{rows.length} cliente(s)</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Descarga CSV servida por un route handler: <a> es correcto (Link haría prefetch del archivo). */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/export/customers"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar
          </a>
          <Link
            href="/customers/import"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Importar
          </Link>
          <Link
            href="/customers/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Nuevo cliente
          </Link>
        </div>
      </div>
      <div className="mt-4"><ModuleHelp slug="customers" /></div>

      <div className="mt-4"><SearchBox action="/customers" q={term} placeholder="Buscar por nombre, correo o teléfono…" /></div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          {term ? (
            <p className="text-slate-600">Sin resultados para “{term}”. Revisa la ortografía o limpia la búsqueda.</p>
          ) : (
            <>
              <p className="text-slate-600">Aún no tienes clientes.</p>
              <Link
                href="/customers/new"
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
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {c.legal_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.type === "company" ? "Empresa" : "Persona"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
