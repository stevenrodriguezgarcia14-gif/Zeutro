"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { parseCrInvoiceXml, describeCrInvoice, isForTaxId, type CrInvoice } from "@/lib/crInvoice";
import { findRegisteredKeys, importExpenses } from "@/app/(app)/expenses/import/actions";

type Opt = { id: string; name: string };

type Fila = {
  key: string;
  inv: CrInvoice;
  archivo: string;
  docPath: string | null;
  marcada: boolean;
  yaRegistrada: boolean;
  projectId: string;
  category: string;
};

/**
 * Importa VARIOS comprobantes de golpe.
 *
 * Quien lleva una obra recibe muchas facturas al mes. Subirlas de una en una
 * es el tipo de tarea que se pospone hasta que se acumula y ya nadie sabe a
 * qué obra iba cada una. Aquí se sueltan todos los XML juntos, se revisan en
 * una tabla y se asigna la obra de cada uno.
 */
export function BulkEInvoiceImport({
  projects,
  categories,
  accounts,
  currency,
  orgId,
  orgTaxId,
}: {
  projects: Opt[];
  categories: string[];
  accounts: Opt[];
  currency: string;
  orgId: string;
  orgTaxId: string | null;
}) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [busy, setBusy] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  // Obra y categoría que se aplican a todo de un golpe.
  const [obraTodas, setObraTodas] = useState("");
  const [catTodas, setCatTodas] = useState("Materiales de obra");
  const [accountId, setAccountId] = useState("");

  async function onArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    const nuevosAvisos: string[] = [];
    const nuevas: Fila[] = [];
    const supabase = createClient();

    for (const file of files) {
      if (!/\.xml$/i.test(file.name)) {
        nuevosAvisos.push(`${file.name}: no es un archivo XML.`);
        continue;
      }
      let inv: CrInvoice | null = null;
      try {
        inv = parseCrInvoiceXml(await file.text());
      } catch {
        inv = null;
      }
      if (!inv || !inv.clave) {
        nuevosAvisos.push(`${file.name}: no parece un comprobante de Hacienda.`);
        continue;
      }
      if (inv.totalComprobanteMinor == null || inv.totalComprobanteMinor <= 0) {
        nuevosAvisos.push(`${file.name}: no trae un total legible.`);
        continue;
      }
      // Repetido dentro de la misma tanda (pasa cuando se arrastra dos veces).
      if (nuevas.some((f) => f.key === inv!.clave) || filas.some((f) => f.key === inv!.clave)) {
        nuevosAvisos.push(`${file.name}: ese comprobante ya está en la lista.`);
        continue;
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);

      nuevas.push({
        key: inv.clave,
        inv,
        archivo: file.name,
        docPath: error ? null : path,
        marcada: true,
        yaRegistrada: false,
        projectId: obraTodas,
        category: catTodas,
      });
    }

    // Marcar las que ya existen en la base para no intentar duplicarlas.
    if (nuevas.length > 0) {
      try {
        const yaEstan = await findRegisteredKeys(nuevas.map((f) => f.key));
        for (const f of nuevas) {
          if (yaEstan.includes(f.key)) {
            f.yaRegistrada = true;
            f.marcada = false;
          }
        }
      } catch {
        /* si falla la consulta, el índice único de la base igual protege */
      }
    }

    setFilas((prev) => [...prev, ...nuevas]);
    setAvisos(nuevosAvisos);
    setBusy(false);
  }

  function actualizar(key: string, patch: Partial<Fila>) {
    setFilas((fs) => fs.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }
  function aplicarATodas(campo: "projectId" | "category", valor: string) {
    if (campo === "projectId") setObraTodas(valor);
    else setCatTodas(valor);
    setFilas((fs) => fs.map((f) => (f.yaRegistrada ? f : { ...f, [campo]: valor })));
  }

  const seleccionadas = filas.filter((f) => f.marcada && !f.yaRegistrada);
  const total = seleccionadas.reduce((s, f) => s + (f.inv.totalComprobanteMinor ?? 0), 0);

  const rowsJson = JSON.stringify(
    seleccionadas.map((f) => ({
      einvoice_key: f.key,
      einvoice_number: f.inv.consecutivo,
      description: describeCrInvoice(f.inv),
      vendor: f.inv.emisorNombre,
      amount_minor: f.inv.totalComprobanteMinor ?? 0,
      tax_minor: f.inv.totalImpuestoMinor ?? 0,
      expense_date: f.inv.fecha,
      category: f.category || null,
      project_id: f.projectId || null,
      doc_path: f.docPath,
      doc_name: f.archivo,
    })),
  );

  const cell = "rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-900";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="text-sm font-medium text-slate-700">Soltá aquí todos los XML que tengas</p>
        <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500">
          Los que te mandan los proveedores por correo. Podés seleccionar muchos a la vez. Zentro lee cada uno y te
          arma la lista para que solo digas a qué trabajo va cada compra.
        </p>
        <label className="mt-3 inline-block cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {busy ? "Leyendo…" : "Elegir archivos XML"}
          <input type="file" accept=".xml,text/xml,application/xml" multiple className="hidden" onChange={onArchivos} disabled={busy} />
        </label>
        <p className="mt-2 text-[11px] text-slate-400">
          Zentro solo lee archivos que ya tenés. No se conecta con Hacienda ni necesita tus claves.
        </p>
      </div>

      {avisos.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          {avisos.map((a, i) => (<p key={i}>· {a}</p>))}
        </div>
      )}

      {filas.length > 0 && (
        <form action={importExpenses} className="space-y-4">
          <input type="hidden" name="rows" value={rowsJson} />
          <input type="hidden" name="account_id" value={accountId} />

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Asignar todo al trabajo</label>
              <select name="bulk_project" value={obraTodas} onChange={(e) => aplicarATodas("projectId", e.target.value)} className={`mt-1 ${cell}`}>
                <option value="">— Sin trabajo —</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Categoría de todos</label>
              <input list="cats-bulk" value={catTodas} onChange={(e) => aplicarATodas("category", e.target.value)} className={`mt-1 ${cell}`} />
              <datalist id="cats-bulk">{categories.map((c) => (<option key={c} value={c} />))}</datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Pagado desde</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={`mt-1 ${cell}`}>
                <option value="">— Ninguna cuenta —</option>
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
            </div>
            <p className="text-xs text-slate-400">Podés cambiar cada fila por separado abajo.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium"></th>
                  <th className="px-3 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium">Trabajo</th>
                  <th className="px-3 py-2 font-medium">Categoría</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map((f) => {
                  const aNombre = isForTaxId(f.inv, orgTaxId);
                  return (
                    <tr key={f.key} className={f.yaRegistrada ? "bg-slate-50 opacity-60" : ""}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={f.marcada && !f.yaRegistrada}
                          disabled={f.yaRegistrada}
                          onChange={(e) => actualizar(f.key, { marcada: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">{f.inv.emisorNombre ?? "—"}</p>
                        <p className="text-xs text-slate-400">{describeCrInvoice(f.inv)}</p>
                        {f.yaRegistrada && <p className="text-xs text-slate-500">Ya estaba registrada</p>}
                        {!f.yaRegistrada && aNombre === false && (
                          <p className="text-xs text-amber-700">No está a nombre de tu negocio</p>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600">{f.inv.fecha ?? "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-slate-900">
                        {formatMoney(f.inv.totalComprobanteMinor ?? 0, f.inv.moneda ?? currency)}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={f.projectId}
                          disabled={f.yaRegistrada}
                          onChange={(e) => actualizar(f.key, { projectId: e.target.value })}
                          className={`w-40 ${cell}`}
                        >
                          <option value="">— Sin trabajo —</option>
                          {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={f.category}
                          disabled={f.yaRegistrada}
                          onChange={(e) => actualizar(f.key, { category: e.target.value })}
                          list="cats-bulk"
                          className={`w-36 ${cell}`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setFilas((fs) => fs.filter((x) => x.key !== f.key))}
                          className="text-slate-300 hover:text-red-600"
                          aria-label="Quitar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              <b>{seleccionadas.length}</b> comprobante(s) por registrar ·{" "}
              <b className="text-slate-900">{formatMoney(total, currency)}</b>
            </p>
            <div className="flex items-center gap-2">
              <Link href="/expenses" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancelar
              </Link>
              <button
                disabled={seleccionadas.length === 0}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
              >
                Registrar {seleccionadas.length} gasto(s)
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
