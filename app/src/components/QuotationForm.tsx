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

export function QuotationForm({
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
  /** Trabajos abiertos, para ligar la cotización (o el adicional) a uno. */
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

  // Costeo PRIVADO: lo que a ti te cuesta hacer el trabajo. El cliente nunca
  // lo ve; sirve para no vender por debajo del costo y para sembrar el costo
  // estimado del proyecto cuando la cotización se acepta.
  const [cost, setCost] = useState({ materials: "", labor: "", subcontract: "", other: "" });

  function update(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    // Hereda la partida de la última línea: en un presupuesto por capítulos
    // se escriben varias líneas seguidas del mismo capítulo.
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

  // Subtotal por partida, en el orden en que aparecen las partidas.
  const bySection = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lines) {
      const name = l.section.trim();
      if (!name) continue;
      const qty = parseFloat(l.quantity) || 0;
      const net = Math.round(qty * toMinor(l.unit_price || "0"));
      map.set(name, (map.get(name) ?? 0) + net);
    }
    return [...map.entries()];
  }, [lines]);

  const sectionOptions = useMemo(
    () => [...new Set(lines.map((l) => l.section.trim()).filter(Boolean))],
    [lines],
  );

  // El costo se compara contra el SUBTOTAL (sin impuestos): el IVA que
  // cobras no es tuyo, es del fisco. Compararlo contra el total daría un
  // margen inflado.
  const costTotal =
    toMinor(cost.materials || "0") +
    toMinor(cost.labor || "0") +
    toMinor(cost.subcontract || "0") +
    toMinor(cost.other || "0");
  const gain = totals.subtotal - costTotal;
  const marginPct = totals.subtotal > 0 ? Math.round((gain / totals.subtotal) * 100) : 0;

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
  const costCell = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-slate-900 outline-none focus:border-slate-900";

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="cost_materials" value={cost.materials || "0"} />
      <input type="hidden" name="cost_labor" value={cost.labor || "0"} />
      <input type="hidden" name="cost_subcontract" value={cost.subcontract || "0"} />
      <input type="hidden" name="cost_other" value={cost.other || "0"} />

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Cliente *</label>
            <select name="customer_id" required defaultValue={defaultCustomerId} className={`mt-1 w-full ${cell}`}>
              <option value="" disabled>Selecciona…</option>
              {customers.map((c) => (<option key={c.id} value={c.id}>{c.legal_name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <input type="date" name="issue_date" defaultValue={today} className={`mt-1 w-full ${cell}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Válida hasta *</label>
            <input type="date" name="due_date" defaultValue={in15} required className={`mt-1 w-full ${cell}`} />
          </div>
        </div>

        {projects.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Trabajo relacionado (opcional)</label>
            <select name="project_id" defaultValue={defaultProjectId} className={`mt-1 w-full ${cell}`}>
              <option value="">— Ninguno: es un trabajo nuevo —</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Si el cliente te pidió un cambio o un extra durante un trabajo que ya está abierto, elígelo aquí: la
              cotización queda registrada como <b>adicional</b> de ese trabajo y suma a su precio.
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
                      list="partidas"
                      placeholder="Sin agrupar"
                      className={`w-32 ${cell}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select value={l.product_id} onChange={(e) => onPickProduct(l.key, e.target.value)} className={`w-40 ${cell}`}>
                      <option value="">— Libre —</option>
                      {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="Concepto" className={`w-full min-w-40 ${cell}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" step="0.01" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} className={`w-20 text-right ${cell}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} list="unidades" placeholder="unidad" className={`w-24 ${cell}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" step="0.01" value={l.unit_price} onChange={(e) => update(l.key, { unit_price: e.target.value })} placeholder="0.00" className={`w-28 text-right ${cell}`} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="0" step="0.01" value={l.tax_pct} onChange={(e) => update(l.key, { tax_pct: e.target.value })} className={`w-16 text-right ${cell}`} />
                  </td>
                  <td className="px-3 py-2 text-right text-slate-900">{formatMoney(net + lineTax, currency)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" onClick={() => moveLine(l.key, -1)} disabled={i === 0} className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-25" aria-label="Subir" title="Subir">↑</button>
                    <button type="button" onClick={() => moveLine(l.key, 1)} disabled={i === lines.length - 1} className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-25" aria-label="Bajar" title="Bajar">↓</button>
                    <button type="button" onClick={() => duplicateLine(l.key)} className="px-1 text-slate-400 hover:text-slate-900" aria-label="Duplicar" title="Duplicar">⧉</button>
                    <button type="button" onClick={() => removeLine(l.key)} className="px-1 text-slate-400 hover:text-red-600" aria-label="Quitar" title="Quitar">✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <datalist id="partidas">
          {sectionOptions.map((s) => (<option key={s} value={s} />))}
        </datalist>
        <datalist id="unidades">
          {["unidad", "m²", "m³", "ml", "m", "día", "hora", "punto", "saco", "viaje", "juego", "global"].map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>

        <div className="border-t border-slate-100 p-3">
          <button type="button" onClick={addLine} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            + Agregar línea
          </button>
          <span className="ml-3 text-xs text-slate-400">
            Escribe una <b>partida</b> (ej. Demolición, Obra gris, Acabados) para agrupar las líneas por capítulos.
          </span>
        </div>
      </div>

      {bySection.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">Resumen por partidas</h2>
          <div className="mt-3 space-y-1 text-sm">
            {bySection.map(([name, amount]) => (
              <div key={name} className="flex justify-between border-b border-slate-100 py-1 last:border-0">
                <span className="text-slate-600">{name}</span>
                <span className="font-medium text-slate-900">{formatMoney(amount, currency)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">Montos sin impuestos. Así es como el cliente verá agrupada la cotización.</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700">Alcance, exclusiones y forma de pago</label>
        <textarea
          name="notes"
          rows={4}
          placeholder={"Ej. Incluye: materiales, mano de obra y acarreo de escombro.\nNo incluye: permisos municipales ni acabados de lujo.\nForma de pago: 40% de anticipo, 40% al 50% de avance, 20% contra entrega.\nPlazo estimado: 3 semanas a partir del anticipo."}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
        <p className="mt-1 text-xs text-slate-400">
          Sale impreso en el PDF. Es tu mejor defensa: lo que no está escrito aquí, después se discute.
        </p>
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-6">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          🔒 ¿Cuánto te cuesta a ti? <span className="font-normal text-slate-400">— privado, el cliente nunca lo ve</span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">Materiales</label>
            <input type="number" min="0" step="0.01" value={cost.materials} onChange={(e) => setCost({ ...cost, materials: e.target.value })} placeholder="0.00" className={costCell} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Mano de obra</label>
            <input type="number" min="0" step="0.01" value={cost.labor} onChange={(e) => setCost({ ...cost, labor: e.target.value })} placeholder="0.00" className={costCell} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Subcontratos</label>
            <input type="number" min="0" step="0.01" value={cost.subcontract} onChange={(e) => setCost({ ...cost, subcontract: e.target.value })} placeholder="0.00" className={costCell} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Transporte y otros</label>
            <input type="number" min="0" step="0.01" value={cost.other} onChange={(e) => setCost({ ...cost, other: e.target.value })} placeholder="0.00" className={costCell} />
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between text-slate-600"><span>Te cuesta</span><span>{formatMoney(costTotal, currency)}</span></div>
          <div className="flex justify-between text-slate-600"><span>Cobras (sin impuestos)</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
          <div className={`flex justify-between border-t border-slate-200 pt-1 text-base font-bold ${costTotal === 0 ? "text-slate-400" : gain >= 0 ? "text-green-600" : "text-red-600"}`}>
            <span>Tu ganancia</span>
            <span>{costTotal === 0 ? "—" : `${formatMoney(gain, currency)} · ${marginPct}%`}</span>
          </div>
          {costTotal > 0 && gain < 0 && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              ⚠️ Estás cotizando por debajo de tu costo: este trabajo te haría perder dinero.
            </p>
          )}
          {costTotal > 0 && gain >= 0 && marginPct < 15 && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              Margen apretado ({marginPct}%). Recuerda que aquí todavía no están tus gastos fijos ni los imprevistos.
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            Cuando abras el trabajo desde esta cotización, este costo se copia como <b>costo estimado</b> del proyecto y
            se compara solo contra lo que realmente gastes.
          </p>
        </div>
      </details>

      <div className="flex flex-col items-end gap-1 rounded-2xl border border-slate-200 bg-white p-6 text-sm">
        <div className="flex w-64 justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>
        <div className="flex w-64 justify-between text-slate-600"><span>Impuestos</span><span>{formatMoney(totals.tax, currency)}</span></div>
        <div className="flex w-64 justify-between border-t border-slate-200 pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{formatMoney(totals.total, currency)}</span></div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="submit" name="intent" value="draft" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Guardar borrador</button>
        <button type="submit" name="intent" value="send" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Guardar y marcar enviada</button>
      </div>
    </form>
  );
}
