import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { CHART } from "./theme";

export type ReceivablesBuckets = {
  alDia: { total: number; count: number };
  porVencer: { total: number; count: number }; // vence en ≤ 7 días
  vencida: { total: number; count: number };
};

/**
 * Barra apilada única del dinero por cobrar, en 3 estados de urgencia.
 * Pregunta que responde: "¿cuánto me deben y cuánto peligra?"
 * Colores de ESTADO (bueno/atención/serio) — nunca reutilizados como series —
 * y siempre con etiqueta + monto + conteo (el color jamás va solo). Huecos de
 * 2px en color de superficie separan los segmentos.
 */
export function ReceivablesBar({ data, currency }: { data: ReceivablesBuckets; currency: string }) {
  const total = data.alDia.total + data.porVencer.total + data.vencida.total;
  const segs = [
    { key: "Al día", desc: "aún no vencen", ...data.alDia, color: CHART.in },
    { key: "Vence pronto", desc: "en 7 días o menos", ...data.porVencer, color: CHART.out },
    { key: "Vencido", desc: "requiere cobranza ya", ...data.vencida, color: CHART.bad },
  ];

  return (
    <div>
      <p className="text-2xl font-bold text-slate-900">{formatMoney(total, currency)}</p>
      <p className="text-xs text-slate-400">Total por cobrar en facturas abiertas</p>

      <div className="mt-3 flex h-4 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={segs.map((s) => `${s.key}: ${formatMoney(s.total, currency)} en ${s.count} factura(s)`).join("; ")}>
        {segs
          .filter((s) => s.total > 0)
          .map((s) => (
            <div
              key={s.key}
              className="zchart-bar h-full"
              style={{ width: `${(s.total / total) * 100}%`, background: s.color }}
              title={`${s.key}: ${formatMoney(s.total, currency)}`}
            />
          ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">
              {s.key} <span className="text-xs text-slate-400">({s.desc})</span>
            </span>
            <span className="ml-auto font-medium tabular-nums text-slate-800">{formatMoney(s.total, currency)}</span>
            <span className="w-14 text-right text-xs tabular-nums text-slate-400">{s.count} fact.</span>
          </li>
        ))}
      </ul>

      {data.vencida.count > 0 && (
        <Link
          href="/collections"
          className="mt-3 inline-block rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          Cobrar lo vencido →
        </Link>
      )}
    </div>
  );
}
