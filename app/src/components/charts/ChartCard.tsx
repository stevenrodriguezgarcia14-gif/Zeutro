import type { ReactNode } from "react";

/**
 * Marco común de todo gráfico del dashboard: título = la pregunta que el
 * gráfico responde (en lenguaje de emprendedor, no de analista), subtítulo
 * con el periodo, y un twin de tabla accesible (<details>) para que ningún
 * valor dependa solo del color o del hover.
 */
export function ChartCard({
  question,
  period,
  children,
  table,
}: {
  question: string;
  period?: string;
  children: ReactNode;
  table?: ReactNode;
}) {
  return (
    <figure role="group" aria-label={question} className="m-0 rounded-2xl border border-slate-200 bg-white p-5">
      <figcaption>
        <p className="font-medium text-slate-900">{question}</p>
        {period && <p className="text-xs text-slate-400">{period}</p>}
      </figcaption>
      <div className="mt-4">{children}</div>
      {table && (
        <details className="mt-3">
          <summary className="cursor-pointer select-none text-xs text-slate-400 hover:text-slate-600">
            Ver como tabla
          </summary>
          <div className="mt-2 overflow-x-auto">{table}</div>
        </details>
      )}
    </figure>
  );
}

/** Estado vacío diseñado: qué falta y el paso que lo llena. */
export function ChartEmpty({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <p className="text-sm font-medium text-slate-500">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Tabla twin: números tabulares alineados a la derecha. */
export function TwinTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-slate-100 text-left text-slate-400">
          {headers.map((h, i) => (
            <th key={h} className={`py-1.5 pr-3 font-medium ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="border-b border-slate-50 text-slate-600">
            {r.map((c, ci) => (
              <td key={ci} className={`py-1.5 pr-3 ${ci > 0 ? "text-right tabular-nums" : ""}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
