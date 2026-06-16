"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importCustomers, type ImportRow, type ImportResult } from "@/app/(app)/customers/actions";

// Normaliza encabezados: minúsculas, sin acentos, sin espacios extra.
function norm(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

// Parser CSV robusto (maneja comillas, comas y saltos de línea dentro de campos).
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // Quitar BOM si existe
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === "," || c === ";") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* ignorar */ }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function mapType(v: string): string {
  const n = norm(v);
  if (n.startsWith("pers") || n === "individuo" || n === "person") return "person";
  return "company";
}

function mapTerms(v: string): string {
  const n = norm(v).replace(/\s/g, "");
  if (n.includes("15")) return "net15";
  if (n.includes("30")) return "net30";
  if (n.includes("60")) return "net60";
  return "contado";
}

export default function CustomerImporter() {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function downloadTemplate() {
    const csv = "nombre,tipo,correo,telefono,rfc,terminos\nEjemplo S.A.,empresa,contacto@ejemplo.com,5512345678,XAXX010101000,contado\nMaría Pérez,persona,maria@correo.com,5598765432,,net30\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    setRows([]);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const matrix = parseCSV(text);
      if (matrix.length < 2) {
        setError("El archivo no tiene datos (necesita una fila de encabezados y al menos un cliente).");
        return;
      }
      const headers = matrix[0].map(norm);
      const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));
      const iName = idx(["nombre", "razon social", "razonsocial", "cliente", "nombre/razon social"]);
      const iType = idx(["tipo"]);
      const iEmail = idx(["correo", "email", "e-mail", "mail"]);
      const iPhone = idx(["telefono", "tel", "celular", "whatsapp", "movil"]);
      const iTax = idx(["rfc", "tax id", "taxid", "nit", "cedula", "identificacion fiscal", "ruc", "dni"]);
      const iTerms = idx(["terminos", "condiciones de pago", "terminos de pago", "pago"]);

      if (iName === -1) {
        setError('No encontré una columna de nombre. Asegúrate de que la primera fila tenga un encabezado "nombre" (descarga la plantilla como guía).');
        return;
      }

      const parsed: ImportRow[] = matrix.slice(1).map((r) => ({
        legal_name: (r[iName] ?? "").trim(),
        type: iType >= 0 ? mapType(r[iType] ?? "") : "company",
        email: iEmail >= 0 ? (r[iEmail] ?? "").trim() || null : null,
        phone: iPhone >= 0 ? (r[iPhone] ?? "").trim() || null : null,
        tax_id: iTax >= 0 ? (r[iTax] ?? "").trim() || null : null,
        payment_terms: iTerms >= 0 ? mapTerms(r[iTerms] ?? "") : "contado",
      })).filter((r) => r.legal_name);

      if (parsed.length === 0) {
        setError("No se encontró ningún cliente con nombre en el archivo.");
        return;
      }
      setRows(parsed);
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un CSV válido.");
    } finally {
      e.target.value = "";
    }
  }

  async function doImport() {
    setBusy(true);
    setError(null);
    try {
      const res = await importCustomers(rows);
      setResult(res);
      if (res.inserted > 0) {
        setRows([]);
        router.refresh();
      }
    } catch {
      setError("Ocurrió un error al importar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">1. Prepara tu archivo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Si tienes los clientes en Excel, ábrelo y usa <strong>Archivo → Guardar como → CSV (delimitado por comas)</strong>.
          Las columnas reconocidas son: <code>nombre</code> (obligatoria), <code>tipo</code>, <code>correo</code>, <code>telefono</code>, <code>rfc</code>, <code>terminos</code>.
        </p>
        <button
          onClick={downloadTemplate}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ⬇ Descargar plantilla de ejemplo
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">2. Sube el archivo</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
        {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {result && (
          <p className={`mt-3 rounded-lg p-3 text-sm ${result.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {result.error
              ? `Error: ${result.error}`
              : `✓ Se importaron ${result.inserted} cliente(s)${result.skipped ? `, se omitieron ${result.skipped} sin nombre` : ""}.`}
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">3. Vista previa ({rows.length} cliente(s))</h2>
            <button
              onClick={doImport}
              disabled={busy}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Importando…" : `Importar ${rows.length} cliente(s)`}
            </button>
          </div>
          <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Correo</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">RFC/ID</th>
                  <th className="px-3 py-2 font-medium">Términos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-900">{r.legal_name}</td>
                    <td className="px-3 py-2 text-slate-600">{r.type === "person" ? "Persona" : "Empresa"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.email ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.phone ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.tax_id ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{r.payment_terms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && <p className="mt-2 text-xs text-slate-500">Mostrando los primeros 50 de {rows.length}.</p>}
        </div>
      )}
    </div>
  );
}
