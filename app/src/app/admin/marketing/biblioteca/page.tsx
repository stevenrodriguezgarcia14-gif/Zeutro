import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { PILLAR_INFO, STATUS_ORDER, type Pillar, type VideoStatus } from "@/lib/marketing/types";
import { ErrorNotice, MigrationNotice, VideoCard } from "../parts";
import { FilterSelect } from "../ui";

export const dynamic = "force-dynamic";

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; estado?: string; pilar?: string; orden?: string }>;
}) {
  const { error, estado = "", pilar = "", orden = "plan" } = await searchParams;
  const state = await loadMarketingState();

  let list = VIDEOS.map((v) => ({ v, status: statusOf(state, v.id) }));
  if (estado) list = list.filter((x) => x.status === (estado as VideoStatus));
  if (pilar) list = list.filter((x) => x.v.pillar === (pilar as Pillar));

  const PLAN_ORDER = [5, 2, 1, 4, 3, 7, 6, 13, 10, 12, 14, 24, 34];
  if (orden === "plan") {
    list.sort((a, b) => {
      const ia = PLAN_ORDER.indexOf(a.v.id);
      const ib = PLAN_ORDER.indexOf(b.v.id);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.v.id - b.v.id;
    });
  } else if (orden === "fundadores") {
    list.sort((a, b) => b.v.scores.fundadores - a.v.scores.fundadores || b.v.scores.confianza - a.v.scores.confianza);
  } else if (orden === "viral") {
    list.sort((a, b) => b.v.scores.viral - a.v.scores.viral || b.v.scores.facilidad - a.v.scores.facilidad);
  } else if (orden === "facil") {
    list.sort((a, b) => b.v.scores.facilidad - a.v.scores.facilidad || a.v.effortMin - b.v.effortMin);
  } else {
    list.sort((a, b) => a.v.id - b.v.id);
  }

  const counts: Record<VideoStatus, number> = { pendiente: 0, grabado: 0, editado: 0, publicado: 0 };
  for (const v of VIDEOS) counts[statusOf(state, v.id)]++;

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FilterSelect
          name="estado"
          value={estado}
          label="Estado"
          options={[
            { value: "", label: `Todos (${VIDEOS.length})` },
            ...STATUS_ORDER.map((s) => ({ value: s, label: `${s} (${counts[s]})` })),
          ]}
        />
        <FilterSelect
          name="pilar"
          value={pilar}
          label="Pilar"
          options={[
            { value: "", label: "Todos" },
            ...(Object.keys(PILLAR_INFO) as Pillar[]).map((p) => ({
              value: p,
              label: `${p} · ${PILLAR_INFO[p].name} (${PILLAR_INFO[p].mix})`,
            })),
          ]}
        />
        <FilterSelect
          name="orden"
          value={orden}
          label="Ordenar por"
          options={[
            { value: "plan", label: "Orden del plan" },
            { value: "fundadores", label: "Trae fundadores" },
            { value: "viral", label: "Potencial viral" },
            { value: "facil", label: "Más fácil de grabar" },
            { value: "id", label: "Número" },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map(({ v, status }) => (
          <VideoCard key={v.id} video={v} status={status} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">Ningún video coincide con esos filtros.</p>
      )}
    </div>
  );
}
