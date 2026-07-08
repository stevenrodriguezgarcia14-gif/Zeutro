import Link from "next/link";
import { toggleCheck } from "./actions";
import { PILLAR_INFO, STATUS_ORDER, type Pillar, type Score, type Video, type VideoStatus } from "@/lib/marketing/types";

// Piezas de UI compartidas (server components) del Marketing OS.

export const GREEN = "#00C781";

const STATUS_STYLE: Record<VideoStatus, string> = {
  pendiente: "bg-slate-700/40 text-slate-300",
  grabado: "bg-sky-500/20 text-sky-300",
  editado: "bg-violet-500/20 text-violet-300",
  publicado: "bg-[#00C781]/20 text-[#2fe3a5]",
};

export function StatusPill({ status }: { status: VideoStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

/** Barra de progreso pendiente → grabado → editado → publicado. */
export function ProgressSteps({ status }: { status: VideoStatus }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center gap-1" title={`Progreso: ${status}`}>
      {["grabado", "editado", "publicado"].map((s, i) => (
        <span
          key={s}
          className={`h-1.5 w-6 rounded-full ${i < idx ? "bg-[#00C781]" : "bg-slate-700"}`}
        />
      ))}
    </div>
  );
}

export function PillarBadge({ pillar }: { pillar: Pillar }) {
  return (
    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400" title={PILLAR_INFO[pillar].role}>
      {pillar} · {PILLAR_INFO[pillar].name}
    </span>
  );
}

export function ScoreDots({ value, label }: { value: Score; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
      <span>{label}</span>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= value ? "bg-[#00C781]" : "bg-slate-700"}`} />
        ))}
      </span>
    </div>
  );
}

/**
 * Checkbox persistente: cada click hace submit de un form con la server
 * action toggleCheck (la clave se guarda/borra en marketing_state).
 */
export function Check({
  k,
  checked,
  label,
  back,
  detail,
  disabled,
}: {
  k: string;
  checked: boolean;
  label: string;
  back: string;
  detail?: string;
  disabled?: boolean;
}) {
  return (
    <form action={toggleCheck} className="w-full">
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name="checked" value={checked ? "1" : "0"} />
      <input type="hidden" name="back" value={back} />
      <button
        type="submit"
        disabled={disabled}
        className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "text-slate-500" : "text-slate-200"
        }`}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
            checked ? "border-[#00C781] bg-[#00C781] text-slate-950" : "border-slate-600"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
        <span className={checked ? "line-through decoration-slate-600" : ""}>
          {label}
          {detail && <span className="mt-0.5 block text-xs text-slate-500 no-underline">{detail}</span>}
        </span>
      </button>
    </form>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mt-8 mb-3">
      <h2 className="text-lg font-semibold text-white">{children}</h2>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-800 bg-slate-900 p-5 ${className}`}>{children}</div>;
}

/** Tarjeta de video para Biblioteca / Ideas / Panel. */
export function VideoCard({ video, status, back }: { video: Video; status: VideoStatus; back?: string }) {
  void back;
  return (
    <Link
      href={`/admin/marketing/biblioteca/${video.id}`}
      className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-600"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-slate-500">#{video.id}</span>
        <StatusPill status={status} />
      </div>
      <h3 className="mt-1.5 text-sm font-semibold leading-snug text-white group-hover:text-[#2fe3a5]">
        {video.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{video.objective}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PillarBadge pillar={video.pillar} />
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
          {video.durationSec} s final
        </span>
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
          ~{video.effortMin} min grabar
        </span>
        {video.requiresReal && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300" title={video.requiresReal}>
            material real
          </span>
        )}
      </div>
      <div className="mt-auto pt-3">
        <p className="line-clamp-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">Gancho:</span> {video.hook}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <ProgressSteps status={status} />
          <span className="text-[11px] text-slate-500">
            {video.scores.fundadores >= 3 ? "🎯 trae fundadores" : video.scores.viral >= 3 ? "🔥 alcance" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MigrationNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">
      ⚠️ La tabla <code className="font-mono">marketing_state</code> no existe todavía: el contenido se ve, pero el
      progreso no se puede guardar. Aplica la migración <code className="font-mono">0039_marketing_os.sql</code>.
    </p>
  );
}

export function ErrorNotice({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-4 rounded-lg bg-red-500/15 p-3 text-sm text-red-300">{error}</p>;
}
