"use client";

import { useMemo, useState } from "react";
import { formatMoney, toMinor } from "@/lib/money";

type CustomerOpt = { id: string; legal_name: string };
type ProductOpt = { id: string; name: string; sale_price_minor: number };
type Line = {
  key: number;
  product_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_pct: string;
};

function newLine(key: number, taxPct = "0"): Line {
  return { key, product_id: "", description: "", quantity: "1", unit_price: "", tax_pct: taxPct };
}

export function InvoiceForm({
  customers,
  products,
  currency,
  action,
  defaultCustomerId = "",
  defaultTaxPct = 0,
}: {
  customers: CustomerOpt[];
  products: ProductOpt[];
  currency: string;
  action: (formData: FormData) => void;
  defaultCustomerId?: string;
  defaultTaxPct?: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const in15 = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
  const taxDefault = String(defaultTaxPct);

  const [lines, setLines] = useState<Line[]>([newLine(1, taxDefault)]);
  const [nextKey, setNextKey] = useState(2);

  function update(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((ls) => [...ls, newLine(nextKey, taxDefault)]);
    setNextKey((k) => k + 1);
  }
  function removeLine(key: number) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.key !== key) : ls));
  }
  function onPickProduct(key: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (p) update(key, { product_id: productId, description: p.name, unit_price: String(p.sale_price_minor / 100) });
    else update(key, { product_id: "" });
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

  const itemsJson = JSON.stringify(
    lines.map((l) => ({
      product_id: l.product_id || null,
      description: l.description,
      quantity: parseFloat(l.quantity) || 0,
      unit_price: l.unit_price || "0",
      tax_pct: parseFloat(l.tax_pct) || 0,
    })),
  );

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
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Producto/servicio</th>
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="px-3 py-2 font-medium text-right">Cant.</th>
              <th className="px-3 py-2 font-medium text-right">Precio</th>
              <th className="px-3 py-2 font-medium text-right">IVA %</th>
              <th className="px-3 py-2 font-medium text-right">Importe</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l) => {
              const qty = parseFloat(l.quantity) || 0;
              const unit = toMinor(l.unit_price || "0");
              const net = Math.round(qty * unit);
              const lineTax = Math.round((net * Math.round((parseFloat(l.tax_pct) || 0) * 100)) / 10000);
              return (
                <tr key={l.key}>
                  <td className="px-3 py-2">
                    <select
                      value={l.product_id}
                      onChange={(e) => onPickProduct(l.key, e.target.value)}
                      className="w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900 outline-none focus:border-slate-900"
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
                      className="w-full min-w-40 rounded-lg border border-slate-300 px-2 py-1.5 text-slate-900 outline-none focus:border-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.quantity}
                      onChange={(e) => update(l.key, { quantity: e.target.value })}
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-slate-900 outline-none focus:border-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.unit_price}
                      onChange={(e) => update(l.key, { unit_price: e.target.value })}
                      placeholder="0.00"
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-slate-900 outline-none focus:border-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.tax_pct}
                      onChange={(e) => update(l.key, { tax_pct: e.target.value })}
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-slate-900 outline-none focus:border-slate-900"
                    />
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900">{formatMoney(net + lineTax, currency)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine(l.key)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Quitar línea"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
