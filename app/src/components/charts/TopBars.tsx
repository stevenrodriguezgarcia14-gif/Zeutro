import { formatMoney } from "@/lib/money";

export type TopBarRow = { name: string; value: number };

/**
 * Barras horizontales para rankings (clientes, productos, categorías).
 * Categorías nominales = UNA serie → un solo color para todas las barras
 * (nunca un degradado por valor: la longitud ya dice quién es mayor).
 * Cada barra lleva su valor a la derecha (etiqueta directa), así que no
 * necesita tooltip ni leyenda; ideal en móvil.
 */
export function TopBars({
  data,
  currency,
  color,
}: {
  data: TopBarRow[];
  currency: string;
  color: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.name} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 sm:grid-cols-[8rem_1fr_auto]">
          <p className="truncate text-xs text-slate-600" title={d.name}>
            {d.name}
          </p>
          <div className="h-3">
            <div
              className="zchart-bar h-full rounded-r-[4px]"
              style={{ width: `${Math.max((d.value / max) * 100, 2)}%`, background: color }}
            />
          </div>
          <p className="text-right text-xs font-medium tabular-nums text-slate-700">
            {formatMoney(d.value, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}
