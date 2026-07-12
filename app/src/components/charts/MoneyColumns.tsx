import { formatMoney } from "@/lib/money";
import { CHART, compactMoney, niceTicks } from "./theme";

export type MonthMoney = { label: string; ingresos: number; gastos: number };

/**
 * Columnas agrupadas: dinero que entra vs. dinero que sale, por mes.
 * Pregunta que responde: "¿mi negocio crece o se achica?"
 * Specs de la skill dataviz: columnas ≤24px con punta redondeada 4px y base
 * recta, hueco de 2px entre marcas, gridlines hairline sólidas, leyenda
 * siempre (2 series), tooltip CSS por banda (hover + foco de teclado) y
 * valores alcanzables sin hover vía ticks + tabla twin.
 */
export function MoneyColumns({ data, currency }: { data: MonthMoney[]; currency: string }) {
  const max = Math.max(...data.map((d) => Math.max(d.ingresos, d.gastos)), 1);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const h = (v: number) => Math.max(v > 0 ? 2 : 0, (v / top) * 100);

  return (
    <div>
      {/* Leyenda (2 series: siempre presente) */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.in }} />
          Ingresos cobrados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART.out }} />
          Gastos
        </span>
      </div>

      <div className="mt-3 flex">
        {/* Eje Y: ticks limpios, compactos */}
        <div className="relative mr-2 h-36 w-9 shrink-0 text-right text-[10px] tabular-nums text-slate-400">
          <span className="absolute right-0 top-0 -translate-y-1/2">{compactMoney(top)}</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2">{compactMoney(top / 2)}</span>
          <span className="absolute bottom-0 right-0 translate-y-1/2">0</span>
        </div>

        {/* Área de dibujo */}
        <div className="relative h-36 flex-1">
          {/* Gridlines hairline sólidas, recesivas */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: CHART.grid }} />
          <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: CHART.grid }} />
          <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200" />

          <div className="absolute inset-0 flex items-end">
            {data.map((d) => (
              <div
                key={d.label}
                tabIndex={0}
                aria-label={`${d.label}: ingresos ${formatMoney(d.ingresos, currency)}, gastos ${formatMoney(d.gastos, currency)}`}
                className="group relative flex h-full flex-1 items-end justify-center gap-[2px] rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                {/* Tooltip CSS: aparece con hover o foco; el valor manda */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus:block"
                >
                  <p className="font-medium capitalize text-slate-300">{d.label}</p>
                  <p className="mt-1 flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded" style={{ background: CHART.in }} />
                    <b className="tabular-nums">{formatMoney(d.ingresos, currency)}</b>
                    <span className="text-slate-400">entró</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5">
                    <span className="h-0.5 w-3 rounded" style={{ background: CHART.out }} />
                    <b className="tabular-nums">{formatMoney(d.gastos, currency)}</b>
                    <span className="text-slate-400">salió</span>
                  </p>
                </div>

                <div
                  className="zchart-col w-2.5 rounded-t-[4px] transition-[filter] group-hover:brightness-110 sm:w-3"
                  style={{ height: `${h(d.ingresos)}%`, background: CHART.in }}
                />
                <div
                  className="zchart-col w-2.5 rounded-t-[4px] transition-[filter] group-hover:brightness-110 sm:w-3"
                  style={{ height: `${h(d.gastos)}%`, background: CHART.out }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eje X */}
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
