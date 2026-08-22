"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { parseCrInvoiceXml, describeCrInvoice, isForTaxId, type CrInvoice } from "@/lib/crInvoice";

type Opt = { id: string; name: string };

/**
 * Formulario de gasto, con lector del XML del comprobante electrónico.
 *
 * El XML que la ferretería manda por correo trae proveedor, fecha, monto e
 * IVA ya calculados. Leerlo evita teclearlos y evita el error de digitación
 * que después descuadra la rentabilidad del trabajo. No hay conexión con
 * Hacienda: es un archivo que el usuario ya tiene.
 */
export function ExpenseForm({
  action,
  categories,
  accounts,
  projects,
  defaultProjectId = "",
  today,
  currency,
  orgId,
  orgTaxId,
}: {
  action: (formData: FormData) => void;
  categories: string[];
  accounts: Opt[];
  projects: Opt[];
  defaultProjectId?: string;
  today: string;
  currency: string;
  orgId: string;
  orgTaxId: string | null;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState("");
  const [date, setDate] = useState(today);

  const [inv, setInv] = useState<CrInvoice | null>(null);
  const [docPath, setDocPath] = useState("");
  const [docName, setDocName] = useState("");
  const [busy, setBusy] = useState(false);
  const [impErr, setImpErr] = useState<string | null>(null);

  async function onXml(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImpErr(null);
    setBusy(true);
    try {
      const parsed = parseCrInvoiceXml(await file.text());
      if (!parsed) {
        setImpErr("Ese archivo no parece un comprobante electrónico de Hacienda. Buscá el .xml que te llegó por correo (no el PDF).");
        return;
      }

      // El monto del gasto es el TOTAL del comprobante, y aparte se guarda
      // cuánto de eso fue impuesto.
      const totalMinor = parsed.totalComprobanteMinor;
      setInv(parsed);
      setVendor(parsed.emisorNombre ?? "");
      setDescription(describeCrInvoice(parsed));
      if (parsed.fecha) setDate(parsed.fecha);
      if (totalMinor != null) setAmount((totalMinor / 100).toFixed(2));
      if (parsed.totalImpuestoMinor != null) setTax((parsed.totalImpuestoMinor / 100).toFixed(2));
      if (!category) setCategory("Materiales de obra");

      // El XML queda guardado como respaldo del gasto.
      const supabase = createClient();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${orgId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (!error) {
        setDocPath(path);
        setDocName(file.name);
      }
    } catch {
      setImpErr("No se pudo leer el archivo.");
    } finally {
      setBusy(false);
    }
  }

  function limpiarImport() {
    setInv(null);
    setDocPath("");
    setDocName("");
    setImpErr(null);
  }

  const aNombre = inv ? isForTaxId(inv, orgTaxId) : null;
  const monedaDistinta = inv?.moneda != null && inv.moneda !== currency;
  const field = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900";

  return (
    <form action={action} className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <input type="hidden" name="einvoice_key" value={inv?.clave ?? ""} />
      <input type="hidden" name="einvoice_number" value={inv?.consecutivo ?? ""} />
      <input type="hidden" name="doc_path" value={docPath} />
      <input type="hidden" name="doc_name" value={docName} />

      {/* ---------- Lector del comprobante ---------- */}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        {!inv ? (
          <>
            <p className="text-sm font-medium text-slate-700">¿Tenés el XML de la factura?</p>
            <p className="mt-0.5 text-xs text-slate-500">
              El de la ferretería, el que te llega por correo junto al PDF. Lo leo y lleno el gasto por vos.
            </p>
            <label className="mt-2 inline-block cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {busy ? "Leyendo…" : "Subir XML"}
              <input type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={onXml} disabled={busy} />
            </label>
            <p className="mt-2 text-[11px] text-slate-400">
              Zentro solo lee el archivo que ya tenés. No se conecta con Hacienda ni necesita tus claves.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {inv.tipoLabel} · {inv.emisorNombre ?? "Proveedor desconocido"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {inv.fecha ?? "sin fecha"}
                  {inv.consecutivo ? ` · N.º ${inv.consecutivo}` : ""}
                  {inv.totalComprobanteMinor != null
                    ? ` · ${formatMoney(inv.totalComprobanteMinor, inv.moneda ?? currency)}`
                    : ""}
                </p>
              </div>
              <button type="button" onClick={limpiarImport} className="text-xs text-slate-400 hover:text-red-600">
                Quitar
              </button>
            </div>

            {aNombre === false && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                ⚠️ Este comprobante está a nombre de <b>{inv.receptorNombre ?? "otra persona"}</b>, no del tuyo. Te
                sirve para llevar el control del gasto, pero no como respaldo de crédito de IVA.
              </p>
            )}
            {aNombre === null && inv.receptorCedula == null && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                ⚠️ Es un comprobante sin cédula de comprador. Sirve para tu control interno, pero pedí siempre la
                factura a tu nombre si querés usarla ante Hacienda.
              </p>
            )}
            {monedaDistinta && (
              <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                ⚠️ El comprobante viene en <b>{inv.moneda}</b> y tu negocio lleva {currency}. Revisá el monto antes de
                guardar.
              </p>
            )}
            {docPath && <p className="mt-2 text-[11px] text-slate-400">El XML queda guardado como respaldo del gasto.</p>}
          </>
        )}
        {impErr && <p className="mt-2 text-xs text-red-600">{impErr}</p>}
      </div>

      {/* ---------- Campos ---------- */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Descripción *</label>
        <input
          name="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Cemento y arena para la obra"
          className={field}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Categoría</label>
          <input name="category" list="categorias" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Elige o escribe" className={field} />
          <datalist id="categorias">
            {categories.map((c) => (<option key={c} value={c} />))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Proveedor</label>
          <input name="vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Opcional" className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Monto *</label>
          <input name="amount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Impuesto incluido (opcional)</label>
          <input name="tax" type="number" step="0.01" min="0" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0.00" className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Fecha</label>
          <input name="expense_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Estado</label>
          <select name="payment_status" defaultValue="paid" className={field}>
            <option value="paid">Pagado</option>
            <option value="pending">Pendiente de pagar</option>
          </select>
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700">¿Es de algún trabajo? (opcional)</label>
          <select name="project_id" defaultValue={defaultProjectId} className={field}>
            <option value="">— Gasto general del negocio —</option>
            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Elígelo y este gasto se descuenta de la ganancia de ese trabajo. Si no lo ligas, el trabajo se ve más
            rentable de lo que es.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Pagado desde la cuenta (opcional)</label>
        <select name="account_id" defaultValue="" className={field}>
          <option value="">— Ninguna —</option>
          {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
        </select>
        <p className="mt-1 text-xs text-slate-400">Si eliges una cuenta y el gasto está pagado, se descontará de su saldo.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="is_deductible" defaultChecked className="rounded border-slate-300" />
        Es deducible de impuestos
      </label>

      <button type="submit" className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
        Guardar gasto
      </button>
    </form>
  );
}
