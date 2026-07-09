import Link from "next/link";
import type { Pillar, Score, Video, VideoStatus } from "@/lib/marketing/types";
import { STATUS_ORDER } from "@/lib/marketing/types";
import { IconAlert, IconCamera, IconClock, IconFlame, IconTarget } from "./icons";
import { PILLAR_THEME, STATUS_THEME } from "./theme";

// Piezas visuales (server components) del Marketing OS v2.

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.07] ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mt-10 mb-4">
      <h2 className="font-display text-lg font-bold tracking-tight text-white">{children}</h2>
      {sub && <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500">{sub}</p>}
    </div>
  );
}

export function PillarChip({ pillar, small }: { pillar: Pillar; small?: boolean }) {
  const t = PILLAR_THEME[pillar];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ${t.chip} ${small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {pillar} · {t.name}
    </span>
  );
}

export function StatusChip({ status }: { status: VideoStatus }) {
  const t = STATUS_THEME[status];
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${t.chip}`}>{t.label}</span>;
}

export function ProgressDots({ status }: { status: VideoStatus }) {
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <span className="flex items-center gap-1" title={`Estado: ${status}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i <= idx ? "w-5 bg-[#00C781]" : "w-3 bg-white/[0.09]"}`} />
      ))}
    </span>
  );
}

export function ScoreBar({ value, label }: { value: Score; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-[11px] text-zinc-500">{label}</span>
      <span className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= value ? "bg-[#00C781]" : "bg-white/[0.07]"}`} />
        ))}
      </span>
    </div>
  );
}

/** Tarjeta de video v2 — jerarquía: título → gancho → señales. */
export function VideoCard({ video, status }: { video: Video; status: VideoStatus }) {
  const pt = PILLAR_THEME[video.pillar];
  return (
    <Link
      href={`/marketing-os/videos/${video.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:ring-white/[0.16]"
    >
      <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${pt.dot} opacity-60`} />
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-xs font-bold text-zinc-600">#{video.id}</span>
        <StatusChip status={status} />
      </div>
      <h3 className="mt-2 font-display text-[15px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-[#3ee6a8]">
        {video.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
        <span className="text-zinc-400">Gancho:</span> {video.hook}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <PillarChip pillar={video.pillar} small />
        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
          <IconClock className="h-3 w-3" /> {video.durationSec} s
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
          <IconCamera className="h-3 w-3" /> ~{video.effortMin} min
        </span>
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <ProgressDots status={status} />
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
          {video.requiresReal ? (
            <><IconAlert className="h-3.5 w-3.5 text-amber-400" /> material real</>
          ) : video.scores.fundadores >= 3 ? (
            <><IconTarget className="h-3.5 w-3.5 text-[#3ee6a8]" /> trae fundadores</>
          ) : video.scores.viral >= 3 ? (
            <><IconFlame className="h-3.5 w-3.5 text-rose-400" /> alcance</>
          ) : null}
        </span>
      </div>
    </Link>
  );
}

export function MigrationNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-amber-400/[0.07] p-4 text-sm text-amber-300 ring-1 ring-amber-400/20">
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        La tabla <code className="font-mono text-xs">marketing_state</code> no existe: el contenido se ve, pero el progreso no se guarda.
        Aplica la migración <code className="font-mono text-xs">0039_marketing_os.sql</code>.
      </p>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-white/[0.08] p-8 text-center">
      <div>
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        {hint && <p className="mt-1 text-xs text-zinc-600">{hint}</p>}
      </div>
    </div>
  );
}
