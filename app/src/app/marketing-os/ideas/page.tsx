import Link from "next/link";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { IdeasBoard } from "../client";
import { MigrationNotice, PageHeader, SectionTitle } from "../parts";
import { PILLAR_THEME, STATUS_THEME } from "../theme";

export const dynamic = "force-dynamic";

// El banco de ideas: acceso rápido por situación ("tengo 15 min", "necesito
// conversión") en vez de filtros que hay que pensar.

const SHELVES: { title: string; hint: string; ids: number[] }[] = [
  { title: "Tengo 15 minutos", hint: "Los más rápidos de grabar", ids: [34, 20, 14, 33, 23, 35] },
  { title: "Necesito alcance", hint: "Potencial viral alto, embudo frío", ids: [19, 8, 14, 13, 44, 46] },
  { title: "Necesito fundadores", hint: "Los que convierten en registros", ids: [4, 41, 52, 53, 60, 45] },
  { title: "Construir confianza", hint: "Los que te vuelven creíble", ids: [12, 11, 28, 32, 49, 55] },
  { title: "Explicar Zentro", hint: "Demos y momento dinero", ids: [5, 34, 36, 38, 40, 37] },
  { title: "Requieren material real", hint: "Espera a que pase de verdad", ids: [8, 11, 41, 47, 53, 56] },
];

export default async function IdeasPage() {
  const state = await loadMarketingState();
  const byId = new Map(VIDEOS.map((v) => [v.id, v]));

  return (
    <div>
      <PageHeader
        title="Ideas"
        sub="60 ideas listas organizadas por situación + tu bandeja de ideas nuevas. Todo al toque, sin esperas."
      />
      <MigrationNotice show={state.unavailable} />

      {/* Tu bandeja */}
      <IdeasBoard initial={state.ideas} disabled={state.unavailable} />

      {/* Estantes por situación */}
      {SHELVES.map((shelf) => (
        <div key={shelf.title}>
          <SectionTitle sub={shelf.hint}>{shelf.title}</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.ids.map((vid) => {
              const v = byId.get(vid)!;
              const st = STATUS_THEME[statusOf(state, vid)];
              const pt = PILLAR_THEME[v.pillar];
              return (
                <Link
                  key={vid}
                  href={`/marketing-os/videos/${vid}`}
                  className="group flex items-center gap-3 rounded-xl bg-white/[0.03] px-3.5 py-3 ring-1 ring-white/[0.06] transition-all duration-150 hover:bg-white/[0.05] hover:ring-white/[0.14]"
                >
                  <span className={`h-8 w-1 shrink-0 rounded-full ${pt.dot} opacity-60`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-200 group-hover:text-[#3ee6a8]">
                      <span className="font-display text-xs font-bold text-zinc-600">#{vid}</span> {v.title}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-500">{v.hook}</span>
                  </span>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${st.chip}`}>{st.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <p className="mt-8 text-center text-xs text-zinc-600">
        ¿Buscas la lista completa con filtros? Está en <Link href="/marketing-os/videos" className="text-[#3ee6a8] underline decoration-dotted">Videos</Link>.
      </p>
    </div>
  );
}
