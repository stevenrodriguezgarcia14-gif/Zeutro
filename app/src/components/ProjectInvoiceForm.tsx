"use client";

import { useState } from "react";
import { formatMoney, toMinor } from "@/lib/money";

const CONCEPTS = [
  { key: "anticipo", label: "Anticipo", text: (n: string) => `Anticipo — ${n}` },
  { key: "avance", label: "Avance", text: (n: string) => `Avance de obra — ${n}` },
  { key: "liquidacion", label: "Liquidación", text: (n: string) => `Liquidación final — ${n}` },
  { key: "otro", label: "Otro", text: (n: string) => `${n}` },
];

/**
 * Cobra un pedazo del trabajo: anticipo, avance o liquidación.
 *
 * Todo se razona SIN impuestos (igual que las líneas de cotización y
 * factura): el IVA que cobras no es tuyo, así que los porcentajes se calculan
 * sobre el precio neto y el impuesto se suma al final.
 */
export function ProjectInvoiceForm({
  projectId,
  projectName,
  currency,
  quotedNetMinor,
  invoicedNetMinor,
  defaultTaxPct,
  action,
}: {
  projectId: string;
  projectName: string;
  currency: string;
  /** Precio acordado sin impuestos = cotizaciones aceptadas + adicionales. */
  quotedNetMinor: number;
  /** Ya facturado sin impuestos (sin contar anuladas). */
  invoicedNetMinor: number;
  defaultTaxPct: number;
  action: (formData: FormData) => void;
}) {
  const pending = Math.max(0, quotedNetMinor - invoicedNetMinor);
  const [concept, setConcept] = useState("anticipo");
  const [description, setDescription] = useState(CONCEPTS[0].text(projectName));
  const [amount, setAmount] = useState("");
  const [taxPct, setTaxPct] = useState(String(defaultTaxPct));

  function pickConcept(key: string) {
    setConcept(key);
    const c = CONCEPTS.find((x) => x.key === key);
    if (c) setDescription(c.text(projectName));
  }
  function setPct(pct: number) {
    if (quotedNetMinor <= 0) return;
    setAmount((Math.round((quotedNetMinor * pct) / 100) / 100).toFixed(2));
  }
  function setPending() {
    setAmount((pending / 100).toFixed(2));
  }

  const base = toMinor(amount || "0");
  const tax = Math.round((base * Math.round((parseFloat(taxPct) || 0) * 100)) / 10000);
  const total = base + tax;
  const overQuoted = quotedNetMinor > 0 && base > pending;

  const cell = "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="concept" value={description} />

      <div className="flex flex-wrap gap-2">
        {CONCEPTS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickConcept(c.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              concept === c.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Concepto que verá el cliente</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={`mt-1 w-full ${cell}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Monto sin impuestos</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`mt-1 w-full text-right ${cell}`}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {quotedNetMinor > 0 && [10, 25, 30, 40, 50].map((p) => (
              <button key={p} type="button" onClick={() => setPct(p)} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                {p}% del trabajo
              </button>
            ))}
            {pending > 0 && (
              <button type="button" onClick={setPending} className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                Saldo ({formatMoney(pending, currency)})
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">IVA %</label>
          <input type="number" step="0.01" min="0" name="tax_pct" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} className={`mt-1 w-full text-right ${cell}`} />
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <div className="flex justify-between text-slate-600"><span>Base</span><span>{formatMoney(base, currency)}</span></div>
        <div className="flex justify-between text-slate-600"><span>Impuestos</span><span>{formatMoney(tax, currency)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900"><span>Total a cobrar</span><span>{formatMoney(total, currency)}</span></div>
        {quotedNetMinor > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Del trabajo ({formatMoney(quotedNetMinor, currency)}) ya facturaste {formatMoney(invoicedNetMinor, currency)}.
            Queda por facturar {formatMoney(pending, currency)}.
          </p>
        )}
        {overQuoted && (
          <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
            ⚠️ Estás facturando más de lo que queda del trabajo. Si el cliente pidió algo extra, cotízalo primero como
            adicional para que quede por escrito.
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button type="submit" name="intent" value="draft" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Guardar borrador
        </button>
        <button type="submit" name="intent" value="issue" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Emitir y cobrar →
        </button>
      </div>
    </form>
  );
}
