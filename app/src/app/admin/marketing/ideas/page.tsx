import Link from "next/link";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { PILLAR_INFO, type Funnel, type Pillar } from "@/lib/marketing/types";
import { addIdea, deleteIdea } from "../actions";
import { Card, ErrorNotice, MigrationNotice, PillarBadge, SectionTitle, StatusPill } from "../parts";
import { FilterSelect } from "../ui";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pilar?: string; embudo?: string; dificultad?: string; tiempo?: string }>;
}) {
  const { error, pilar = "", embudo = "", dificultad = "", tiempo = "" } = await searchParams;
  const state = await loadMarketingState();
  const back = "/admin/marketing/ideas";

  let list = VIDEOS;
  if (pilar) list = list.filter((v) => v.pillar === (pilar as Pillar));
  if (embudo) list = list.filter((v) => v.funnel === (embudo as Funnel));
  if (dificultad === "facil") list = list.filter((v) => v.scores.facilidad >= 3);
  if (dificultad === "media") list = list.filter((v) => v.scores.facilidad === 2);
  if (dificultad === "dificil") list = list.filter((v) => v.scores.facilidad === 1);
  if (tiempo === "15") list = list.filter((v) => v.effortMin <= 15);
  if (tiempo === "30") list = list.filter((v) => v.effortMin <= 30);
  if (tiempo === "31") list = list.filter((v) => v.effortMin > 30);

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <SectionTitle sub="Las 60 ideas del plan + las tuyas. Filtra por lo que necesites HOY (¿tengo 15 min? ¿necesito conversión?).">
        Banco de ideas
      </SectionTitle>

      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          name="pilar"
          value={pilar}
          label="Pilar"
          options={[
            { value: "", label: "Todos" },
            ...(Object.keys(PILLAR_INFO) as Pillar[]).map((p) => ({ value: p, label: `${p} · ${PILLAR_INFO[p].name}` })),
          ]}
        />
        <FilterSelect
          name="embudo"
          value={embudo}
          label="Etapa del embudo"
          options={[
            { value: "", label: "Todas" },
            { value: "frio", label: "Frío (alcance)" },
            { value: "tibio", label: "Tibio (confianza)" },
            { value: "conversion", label: "Conversión (registro)" },
          ]}
        />
        <FilterSelect
          name="dificultad"
          value={dificultad}
          label="Dificultad"
          options={[
            { value: "", label: "Todas" },
            { value: "facil", label: "Fácil" },
            { value: "media", label: "Media" },
            { value: "dificil", label: "Exigente" },
          ]}
        />
        <FilterSelect
          name="tiempo"
          value={tiempo}
          label="Tiempo de grabación"
          options={[
            { value: "", label: "Cualquiera" },
            { value: "15", label: "≤ 15 min" },
            { value: "30", label: "≤ 30 min" },
            { value: "31", label: "> 30 min" },
          ]}
        />
        <span className="text-xs text-slate-500">{list.length} ideas</span>
      </div>

      <div className="mt-4 space-y-2">
        {list.map((v) => (
          <Link
            key={v.id}
            href={`/admin/marketing/biblioteca/${v.id}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 transition-colors hover:border-slate-600"
          >
            <span className="w-8 shrink-0 text-xs font-bold text-slate-500">#{v.id}</span>
            <span className="min-w-0 flex-1 text-sm font-medium text-white">{v.title}</span>
            <span className="hidden text-xs text-slate-500 md:block md:max-w-xs md:truncate">{v.hook}</span>
            <PillarBadge pillar={v.pillar} />
            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">~{v.effortMin} min</span>
            <StatusPill status={statusOf(state, v.id)} />
          </Link>
        ))}
      </div>

      {/* Ideas propias */}
      <SectionTitle sub="Lo que se te ocurra en la calle: apúntalo aquí antes de que se escape.">💡 Tus ideas nuevas</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form action={addIdea} className="space-y-3">
            <input type="hidden" name="back" value={back} />
            <label className="block text-xs text-slate-400">
              Título de la idea *
              <input name="title" required maxLength={140} placeholder="Ej: reaccionar al video viral de X sobre morosos"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-[#00C781]" />
            </label>
            <div className="flex gap-3">
              <label className="block text-xs text-slate-400">
                Pilar
                <select name="pillar" className="mt-1 block rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-white outline-none">
                  {(Object.keys(PILLAR_INFO) as Pillar[]).map((p) => (
                    <option key={p} value={p}>{p} · {PILLAR_INFO[p].name}</option>
                  ))}
                </select>
              </label>
              <label className="block flex-1 text-xs text-slate-400">
                Gancho (si ya lo tienes)
                <input name="hook" maxLength={200}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-[#00C781]" />
              </label>
            </div>
            <label className="block text-xs text-slate-400">
              Notas
              <textarea name="notes" rows={2} maxLength={500}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-[#00C781]" />
            </label>
            <button className="rounded-lg bg-[#00C781] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50" disabled={state.unavailable}>
              Guardar idea
            </button>
          </form>
        </Card>
        <div className="space-y-2">
          {state.ideas.length === 0 && (
            <Card><p className="text-sm text-slate-500">Aún no tienes ideas propias guardadas.</p></Card>
          )}
          {state.ideas.map(({ key, idea }) => (
            <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{idea.title}</p>
                  {idea.hook && <p className="mt-0.5 text-xs text-slate-400"><b className="text-slate-500">Gancho:</b> {idea.hook}</p>}
                  {idea.notes && <p className="mt-0.5 text-xs text-slate-500">{idea.notes}</p>}
                  <div className="mt-1.5"><PillarBadge pillar={idea.pillar} /></div>
                </div>
                <form action={deleteIdea}>
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="back" value={back} />
                  <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-red-900/30 hover:text-red-300">
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
