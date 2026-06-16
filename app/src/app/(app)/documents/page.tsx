import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { DocUploader } from "@/components/DocUploader";
import { deleteDocument } from "./actions";

function fmtSize(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const org = await getCurrentOrg();
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name, file_path, mime_type, size_bytes, created_at")
    .order("created_at", { ascending: false });

  const rows = docs ?? [];
  // URLs firmadas temporales para descarga (bucket privado)
  const signed = await Promise.all(
    rows.map((d) => supabase.storage.from("documents").createSignedUrl(d.file_path, 3600)),
  );
  const urlById = new Map(rows.map((d, i) => [d.id, signed[i].data?.signedUrl ?? null]));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="mt-1 text-sm text-slate-500">Contratos, comprobantes, archivos… {rows.length} archivo(s).</p>
        </div>
        {org && <DocUploader orgId={org.id} />}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Aún no tienes documentos. Sube contratos, comprobantes o cualquier archivo.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Archivo</th>
                <th className="px-4 py-3 font-medium">Tamaño</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {urlById.get(d.id) ? (
                      <a href={urlById.get(d.id)!} target="_blank" rel="noopener noreferrer" className="hover:underline">{d.name}</a>
                    ) : (
                      d.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{fmtSize(d.size_bytes)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(d.created_at).toLocaleDateString("es")}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteDocument}>
                      <input type="hidden" name="doc_id" value={d.id} />
                      <input type="hidden" name="file_path" value={d.file_path} />
                      <button className="text-xs text-slate-300 hover:text-red-600">✕</button>
                    </form>
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
