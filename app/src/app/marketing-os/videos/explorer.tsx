"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Pillar, Video, VideoStatus } from "@/lib/marketing/types";
import { STATUS_ORDER } from "@/lib/marketing/types";
import { IconAlert, IconCamera, IconClock, IconFlame, IconTarget } from "../icons";
import { PILLAR_THEME, STATUS_THEME } from "../theme";

// Explorador de videos: búsqueda y filtros 100% en el cliente → cero espera.

type Row = { v: Video; status: VideoStatus };
type Order = "plan" | "fundadores" | "viral" | "facil" | "id";

const PLAN_ORDER = [5, 2, 1, 4, 3, 7, 6, 13, 10, 12, 14, 24, 34];

export function VideoExplorer({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<VideoStatus | "">("");
  const [pilar, setPilar] = useState<Pillar | "">("");
  const [orden, setOrden] = useState<Order>("plan");

  const list = useMemo(() => {
    let out = rows;
    if (estado) out = out.filter((r) => r.status === estado);
    if (pilar) out = out.filter((r) => r.v.pillar === pilar);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((r) => `#${r.v.id} ${r.v.title} ${r.v.hook} ${r.v.summary}`.toLowerCase().includes(needle));
    }
    const sorted = [...out];
    if (orden === "plan") {
      sorted.sort((a, b) => {
        const ia = PLAN_ORDER.indexOf(a.v.id); const ib = PLAN_ORDER.indexOf(b.v.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.v.id - b.v.id;
      });
    } else if (orden === "fundadores") sorted.sort((a, b) => b.v.scores.fundadores - a.v.scores.fundadores || b.v.scores.confianza - a.v.scores.confianza);
    else if (orden === "viral") sorted.sort((a, b) => b.v.scores.viral - a.v.scores.viral || b.v.scores.facilidad - a.v.scores.facilidad);
    else if (orden === "facil") sorted.sort((a, b) => b.v.scores.facilidad - a.v.scores.facilidad || a.v.effortMin - b.v.effortMin);
    else sorted.sort((a, b) => a.v.id - b.v.id);
    return sorted;
  }, [rows, q, estado, pilar, orden]);

  const counts = useMemo(() => {
    const c: Record<VideoStatus, number> = { pendiente: 0, grabado: 0, editado: 0, publicado: 0 };
    rows.forEach((r) => c[r.status]++);
    return c;
  }, [rows]);

  const select = "rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-zinc-200 outline-none ring-1 ring-white/[0.08] focus:ring-[#00C781]/50";

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por título, gancho o número…"
          className="min-w-0 flex-1 rounded-xl bg-white/[0.04] px-3.5 py-2 text-sm text-white outline-none ring-1 ring-white/[0.08] placeholder:text-zinc-600 focus:ring-[#00C781]/50 sm:max-w-xs"
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value as VideoStatus | "")} className={select} aria-label="Filtrar por estado">
          <option value="">Estado: todos ({rows.length})</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_THEME[s].label} ({counts[s]})</option>)}
        </select>
        <select value={pilar} onChange={(e) => setPilar(e.target.value as Pillar | "")} className={select} aria-label="Filtrar por pilar">
          <option value="">Pilar: todos</option>
          {(Object.keys(PILLAR_THEME) as Pillar[]).map((p) => <option key={p} value={p}>{p} · {PILLAR_THEME[p].name}</option>)}
        </select>
        <select value={orden} onChange={(e) => setOrden(e.target.value as Order)} className={select} aria-label="Ordenar">
          <option value="plan">Orden del plan</option>
          <option value="fundadores">Trae fundadores</option>
          <option value="viral">Potencial viral</option>
          <option value="facil">Más fácil de grabar</option>
          <option value="id">Número</option>
        </select>
      </div>

      {/* Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(({ v, status }) => {
          const pt = PILLAR_THEME[v.pillar];
          const st = STATUS_THEME[status];
          return (
            <Link
              key={v.id}
              href={`/marketing-os/videos/${v.id}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.05] hover:ring-white/[0.16]"
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${pt.dot} opacity-60`} />
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-zinc-600">#{v.id}</span>
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ${st.chip}`}>{st.label}</span>
              </div>
              <h3 className="mt-2 font-display text-[15px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-[#3ee6a8]">
                {v.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                <span className="text-zinc-400">Gancho:</span> {v.hook}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${pt.chip}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pt.dot}`} /> {v.pillar} · {pt.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
                  <IconClock className="h-3 w-3" /> {v.durationSec} s
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">
                  <IconCamera className="h-3 w-3" /> ~{v.effortMin} min
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="flex items-center gap-1">
                  {[1, 2, 3].map((i) => {
                    const idx = STATUS_ORDER.indexOf(status);
                    return <span key={i} className={`h-1.5 rounded-full transition-all ${i <= idx ? "w-5 bg-[#00C781]" : "w-3 bg-white/[0.09]"}`} />;
                  })}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                  {v.requiresReal ? (
                    <><IconAlert className="h-3.5 w-3.5 text-amber-400" /> material real</>
                  ) : v.scores.fundadores >= 3 ? (
                    <><IconTarget className="h-3.5 w-3.5 text-[#3ee6a8]" /> trae fundadores</>
                  ) : v.scores.viral >= 3 ? (
                    <><IconFlame className="h-3.5 w-3.5 text-rose-400" /> alcance</>
                  ) : null}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="mt-8 grid min-h-32 place-items-center rounded-2xl border border-dashed border-white/[0.08] text-sm text-zinc-600">
          Ningún video coincide con esos filtros.
        </div>
      )}
    </div>
  );
}
