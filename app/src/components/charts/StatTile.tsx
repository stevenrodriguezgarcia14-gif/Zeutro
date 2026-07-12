import { CHART } from "./theme";

/**
 * Sparkline de 12 puntos para una tarjeta KPI: la historia en gris de
 * contexto y el tramo final en el verde de marca (acento pequeño, junto a
 * un valor en texto — el color nunca carga el dato solo).
 */
export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2 || points.every((p) => p === 0)) return null;
  const W = 120;
  const H = 30;
  const PAD = 4;
  const max = Math.max(...points, 1);
  const step = (W - PAD * 2) / (points.length - 1);
  const xy = points.map((p, i) => [PAD + i * step, H - PAD - (p / max) * (H - PAD * 2)] as const);
  const path = (pts: (readonly [number, number])[]) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="mt-2">
      <path d={path(xy)} fill="none" stroke={CHART.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path(xy.slice(-2))} fill="none" stroke={CHART.accent} strokeWidth="2" strokeLinecap="round" />
      {/* Marcador final ≥8px con anillo de superficie de 2px */}
      <circle cx={last[0]} cy={last[1]} r="4" fill={CHART.accent} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

/**
 * Tarjeta KPI (contrato de stat tile): etiqueta · valor (cifras
 * proporcionales, nunca tabular en display) · delta con signo y color por
 * dirección · pista breve · sparkline opcional.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaGood,
  hint,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  hint?: string;
  spark?: number[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {delta && (
          <p className={`text-xs font-semibold ${deltaGood ? "text-emerald-600" : "text-red-600"}`}>{delta}</p>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {spark && <Sparkline points={spark} />}
    </div>
  );
}
