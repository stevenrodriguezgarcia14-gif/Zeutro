import { formatMoney } from "@/lib/money";
import { CHART, compactMoney } from "./theme";

export type MonthProfit = { label: string; utilidad: number };

/**
 * Columnas divergentes desde una línea de cero: utilidad (verde, hacia
 * arriba) o pérdida (rojo, hacia abajo) por mes.
 * Pregunta que responde: "¿gané o perdí cada mes?"
 * El color aquí es de estado (ganancia/pérdida), no de serie, y SIEMPRE va
 * reforzado por la dirección de la barra y el signo del monto (tooltip,
 * ticks y tabla) — nunca color solo.
 */
export function ProfitColumns({ data, currency }: { data: MonthProfit[]; currency: string }) {
  const maxPos = Math.max(...data.map((d) => Math.max(d.utilidad, 0)), 0);
  const maxNeg = Math.max(...data.map((d) => Math.max(-d.utilidad, 0)), 0);
  const span = Math.max(maxPos + maxNeg, 1);
  // La línea de cero se coloca proporcionalmente; con todo positivo queda abajo.
  const zeroPct = maxNeg === 0 ? 100 : maxPos === 0 ? 0 : (maxPos / span) * 100;
  const hPct = (v: number) => Math.max(v === 0 ? 0 : 2, (Math.abs(v) / span) * 100);

  return (
    <div>
      <div className="flex">
        {/* Eje Y mínimo: tope, cero y fondo */}
        <div className="relative mr-2 h-36 w-9 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
          {maxPos > 0 && <span className="absolute right-0 top-0 -translate-y-1/2">{compactMoney(maxPos)}</span>}
          <span className="absolute right-0 -translate-y-1/2" style={{ top: `${zeroPct}%` }}>0</span>
          {maxNeg > 0 && <span className="absolute bottom-0 right-0 translate-y-1/2">−{compactMoney(maxNeg)}</span>}
        </div>

        <div className="relative h-36 flex-1">
          {/* Línea de cero: el único eje con peso */}
          <div className="absolute inset-x-0 z-[1] h-px bg-slate-300" style={{ top: `${zeroPct}%` }} />

          <div className="absolute inset-0 flex">
            {data.map((d) => {
              const positive = d.utilidad >= 0;
              return (
                <div
                  key={d.label}
                  tabIndex={0}
                  aria-label={`${d.label}: ${positive ? "utilidad" : "pérdida"} de ${formatMoney(Math.abs(d.utilidad), currency)}`}
                  className="group relative h-full flex-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus:block"
                  >
                    <p className="font-medium capitalize text-slate-300">{d.label}</p>
                    <p className="mt-1">
                      <b className="tabular-nums">{d.utilidad < 0 ? "−" : "+"}{formatMoney(Math.abs(d.utilidad), currency)}</b>{" "}
                      <span className="text-slate-400">{positive ? "de utilidad" : "de pérdida"}</span>
                    </p>
                  </div>

                  {positive ? (
                    <div
                      className="zchart-col absolute left-1/2 w-3 -translate-x-1/2 rounded-t-[4px] transition-[filter] group-hover:brightness-110 sm:w-3.5"
                      style={{ bottom: `${100 - zeroPct}%`, height: `${hPct(d.utilidad)}%`, background: CHART.in }}
                    />
                  ) : (
                    <div
                      className="zchart-col-down absolute left-1/2 w-3 -translate-x-1/2 rounded-b-[4px] transition-[filter] group-hover:brightness-110 sm:w-3.5"
                      style={{ top: `${zeroPct}%`, height: `${hPct(d.utilidad)}%`, background: CHART.bad }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="ml-11 flex">
        {data.map((d) => (
          <p key={d.label} className="flex-1 pt-1.5 text-center text-[10px] capitalize text-slate-400">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}
