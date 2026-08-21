"use client";

import { useMemo, useState } from "react";
import { formatMoney, toMinor } from "@/lib/money";
import { addDays } from "@/lib/weeks";

type CustomerOpt = { id: string; legal_name: string };
type ProductOpt = { id: string; name: string; sale_price_minor: number; unit?: string | null };
type ProjectOpt = { id: string; name: string };
type Line = {
  key: number;
  section: string;
  product_id: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  tax_pct: string;
};

function newLine(key: number, taxPct = "0", section = ""): Line {
  return { key, section, product_id: "", description: "", quantity: "1", unit: "", unit_price: "", tax_pct: taxPct };
}

export function InvoiceForm({
  customers,
  products,
  projects = [],
  currency,
  action,
  defaultCustomerId = "",
  defaultProjectId = "",
  defaultTaxPct = 0,
  today,
}: {
  customers: CustomerOpt[];
  products: ProductOpt[];
  /** Trabajos abiertos, para que lo facturado cuente en su rentabilidad. */
  projects?: ProjectOpt[];
  currency: string;
  action: (formData: FormData) => void;
  defaultCustomerId?: string;
  defaultProjectId?: string;
  defaultTaxPct?: number;
  /** Día de HOY del negocio (su zona horaria), calculado en el servidor. */
  today: string;
}) {
  // Fechas por defecto: el día del negocio llega ya resuelto desde el
  // servidor (zona horaria de la organización). Calcularlo aquí con
  // toISOString() daba el día en UTC: después de las 6 de la tarde en
  // América la factura nacía fechada mañana.
  const [{ in15 }] = useState(() => ({
    in15: addDays(today, 15),
  }));
  const taxDefault = String(defaultTaxPct);

  const [lines, setLines] = useState<Line[]>(() => [newLine(1, taxDefault)]);
  const [nextKey, setNextKey] = useState(2);

  function update(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    const lastSection = lines.length > 0 ? lines[lines.length - 1].section : "";
    setLines((ls) => [...ls, newLine(nextKey, taxDefault, lastSection)]);
    setNextKey((k) => k + 1);
  }
  function duplicateLine(key: number) {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.key === key);
      if (i < 0) return ls;
      const copy = { ...ls[i], key: nextKey };
      return [...ls.slice(0, i + 1), copy, ...ls.slice(i + 1)];
    });
    setNextKey((k) => k + 1);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  }
  function moveLine(key: number, dir: -1 | 1) {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const next = [...ls];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function onPickProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (p) {
      update(key, {
        product_id: productId,
        description: p.name,
        unit_price: String(p.sale_price_minor / 100),
        unit: p.unit ?? "",
      });
    } else {
      update(key, { product_id: "" });
    }
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const qty = parseFloat(l.quantity) || 0;
      const unit = toMinor(l.unit_price || "0");
      const net = Math.round(qty * unit);
      const taxBps = Math.round((parseFloat(l.tax_pct) || 0) * 100);
      subtotal += net;
      tax += Math.round((net * taxBps) / 10000);
    }
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  const sectionOptions = useMemo(
    () => [...new Set(lines.map((l) => l.section.trim()).filter(Boolean))],
    [lines],
  );

  const itemsJson = JSON.stringify(
    lines.map((l, i) => ({
      product_id: l.product_id || null,
      section: l.section.trim() || null,
      description: l.description,
      quantity: parseFloat(l.quantity) || 0,
      unit: l.unit.trim() || null,
      unit_price: l.unit_price || "0",
      tax_pct: parseFloat(l.tax_pct) || 0,
      position: i,
    })),
  );

  const cell = "rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900 outline-none focus:border-slate-900";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={itemsJson} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700">Cliente *</label>
            <select
              name="customer_id"
              required
              defaultValue={defaultCustomerId}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legal_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha de emisión</label>
            <input
              type="date"
              name="issue_date"
              defaultValue={today}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Vence *</label>
            <input
              type="date"
              name="due_date"
              defaultValue={in15}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Trabajo que estás cobrando (opcional)</label>
            <select name="project_id" defaultValue={defaultProjectId} className={`mt-1 w-full ${cell}`}>
              <option value="">— Ninguno —</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Si la eliges, lo facturado y lo cobrado cuentan en la ganancia de ese trabajo.
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Partida</th>
              <th className="px-3 py-2 font-medium">Producto/servicio</th>
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="px-3 py-2 font-medium text-right">Cant.</th>
              <th className="px-3 py-2 font-medium">Unidad</th>
              <th className="px-3 py-2 font-medium text-right">Precio</th>
              <th className="px-3 py-2 font-medium text-right">IVA %</th>
              <th className="px-3 py-2 font-medium text-right">Importe</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l, i) => {
              const qty = parseFloat(l.quantity) || 0;
              const unit = toMinor(l.unit_price || "0");
              const net = Math.round(qty * unit);
              const lineTax = Math.round((net * Math.round((parseFloat(l.tax_pct) || 0) * 100)) / 10000);
              return (
                <tr key={l.key}>
                  <td className="px-3 py-2">
                    <input
                      value={l.section}
                      onChange={(e) => update(l.key, { section: e.target.value })}
                      list="partidas-factura"
                      placeholder="Sin agrupar"
                      className={`w-32 ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.product_id}
                      onChange={(e) => onPickProduct(l.key, e.target.value)}
                      className={`w-40 ${cell}`}
                    >
                      <option value="">— Libre —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={l.description}
                      onChange={(e) => update(l.key, { description: e.target.value })}
                      placeholder="Concepto"
                      className={`w-full min-w-40 ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.quantity}
                      onChange={(e) => update(l.key, { quantity: e.target.value })}
                      className={`w-20 text-right ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} list="unidades-factura" placeholder="unidad" className={`w-24 ${cell}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.unit_price}
                      onChange={(e) => update(l.key, { unit_price: e.target.value })}
                      placeholder="0.00"
                      className={`w-28 text-right ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.tax_pct}
                      onChange={(e) => update(l.key, { tax_pct: e.target.value })}
                      className={`w-16 text-right ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900">{formatMoney(net + lineTax, currency)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" onClick={() => moveLine(l.key, -1)} disabled={i === 0} className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-25" aria-label="Subir" title="Subir">↑</button>
                    <button type="button" onClick={() => moveLine(l.key, 1)} disabled={i === lines.length - 1} className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-25" aria-label="Bajar" title="Bajar">↓</button>
                    <button type="button" onClick={() => duplicateLine(l.key)} className="px-1 text-slate-400 hover:text-slate-900" aria-label="Duplicar" title="Duplicar">⧉</button>
                    <button type="button" onClick={() => removeLine(l.key)} className="px-1 text-slate-400 hover:text-red-600" aria-label="Quitar línea" title="Quitar">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <datalist id="partidas-factura">
          {sectionOptions.map((s) => (<option key={s} value={s} />))}
        </datalist>
        <datalist id="unidades-factura">
          {["unidad", "m²", "m³", "ml", "m", "día", "hora", "punto", "saco", "viaje", "juego", "global"].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Agregar línea
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700">Notas (opcional)</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Ej. Corresponde al 40% de anticipo del trabajo. Forma de pago: SINPE o transferencia."
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
        <p className="mt-1 text-xs text-slate-400">Sale impreso en el PDF de la factura.</p>
      </div>

      <div className="flex flex-col items-end gap-1 rounded-2xl border border-slate-200 bg-white p-6 text-sm">
        <div className="flex w-64 justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotal, currency)}</span>
        </div>
        <div className="flex w-64 justify-between text-slate-600">
          <span>Impuestos</span>
          <span>{formatMoney(totals.tax, currency)}</span>
        </div>
        <div className="flex w-64 justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900">
          <span>Total</span>
          <span>{formatMoney(totals.total, currency)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Guardar borrador
        </button>
        <button
          type="submit"
          name="intent"
          value="issue"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Emitir factura
        </button>
      </div>
    </form>
  );
}
