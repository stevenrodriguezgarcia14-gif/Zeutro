import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/lib/marketing/videos";
import { getScript } from "@/lib/marketing/scripts";
import { CHECKLISTS, HASHTAG_SETS } from "@/lib/marketing/plan";
import { recipesForScript } from "@/lib/marketing/capcut";
import { fmtSeconds, scriptTimeline, scriptTotalSeconds } from "@/lib/marketing/timing";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { ChecklistCard, CheckItem, MetricsEditor, StatusStepper } from "../../client";
import { IconAlert, IconCamera, IconChevronL, IconChevronR, IconClock, IconEye, IconMic, IconScissors, IconSparkle, IconTag, IconUser } from "../../icons";
import { Card, MigrationNotice, PillarChip, ScoreBar, SectionTitle } from "../../parts";
import { PILLAR_THEME } from "../../theme";

export const dynamic = "force-dynamic";

const FUNNEL_LABEL = { frio: "Frío · descubrimiento", tibio: "Tibio · confianza", conversion: "Conversión · registro" } as const;

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const video = getVideo(id);
  if (!video) notFound();

  const script = getScript(id);
  const state = await loadMarketingState();
  const status = statusOf(state, id);
  const metrics = state.metrics.get(id) ?? {};
  const pt = PILLAR_THEME[video.pillar];

  // Tiempos REALES: los calcula el motor (2.3 palabras/seg + pausas + acción),
  // nunca están escritos a mano en el guion.
  const tl = script ? scriptTimeline(script) : [];
  const totalSec = script ? scriptTotalSeconds(script) : video.durationSec;
  const fmtRange = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));
  const recipes = script ? recipesForScript(script.editSteps, script.segments.map((s) => s.edit)) : [];

  const hashtagSet =
    HASHTAG_SETS.find((h) =>
      video.pillar === "P1" ? h.pillar.startsWith("Dolor") :
      video.pillar === "P2" ? h.pillar.startsWith("Build") :
      video.pillar === "P3" ? h.pillar.startsWith("Demo") :
      video.pillar === "P4" ? h.pillar.startsWith("Historia") :
      h.pillar.startsWith("Fundadores"),
    ) ?? HASHTAG_SETS[0];

  return (
    <div>
      {/* Barra superior */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/marketing-os/videos" className="inline-flex items-center gap-1 text-xs text-zinc-500 transition hover:text-zinc-200">
          <IconChevronL className="h-3.5 w-3.5" /> Videos
        </Link>
        <div className="flex gap-1.5">
          {getVideo(id - 1) && (
            <Link href={`/marketing-os/videos/${id - 1}`} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 ring-1 ring-white/[0.08] transition hover:bg-white/[0.05] hover:text-white" aria-label={`Video ${id - 1}`}>
              <IconChevronL className="h-4 w-4" />
            </Link>
          )}
          {getVideo(id + 1) && (
            <Link href={`/marketing-os/videos/${id + 1}`} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-500 ring-1 ring-white/[0.08] transition hover:bg-white/[0.05] hover:text-white" aria-label={`Video ${id + 1}`}>
              <IconChevronR className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <MigrationNotice show={state.unavailable} />

      {/* Cabecera */}
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] p-6 ring-1 ring-white/[0.07]">
        <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${pt.dot} opacity-70`} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold text-zinc-600">#{video.id}</span>
          <PillarChip pillar={video.pillar} />
          {script?.badge && (
            <span className="rounded-md bg-[#00C781]/12 px-2 py-0.5 text-[11px] font-semibold text-[#3ee6a8] ring-1 ring-[#00C781]/25">★ {script.badge}</span>
          )}
          {video.requiresReal && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-300 ring-1 ring-amber-400/20">
              <IconAlert className="h-3 w-3" /> {video.requiresReal}
            </span>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{video.title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{video.objective}</p>

        <div className="mt-5">
          <StatusStepper videoId={id} initial={status} disabled={state.unavailable} />
        </div>

        <div className="mt-5 grid gap-x-8 gap-y-2.5 border-t border-white/[0.06] pt-4 text-sm sm:grid-cols-2">
          <p className="text-zinc-300"><span className="text-zinc-500">Gancho (primeros {script && tl.length > 0 ? fmtRange(tl[0].seconds) : "3-5"} s): </span>{video.hook}</p>
          <p className="text-zinc-300"><span className="text-zinc-500">CTA: </span>{video.cta}</p>
          <p className="text-zinc-300"><span className="text-zinc-500">Emociones: </span>{video.emotions.join(" → ")}</p>
          {video.audience && <p className="text-zinc-300"><span className="text-zinc-500">Público: </span>{video.audience}</p>}
          {video.problem && <p className="text-zinc-300 sm:col-span-2"><span className="text-zinc-500">Problema que resuelve: </span>{video.problem}</p>}
          {video.timing && <p className="text-amber-300 sm:col-span-2">Timing: {video.timing}</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400 ring-1 ring-white/[0.06]" title={script ? "Calculado del guion a velocidad real de habla (2.3 palabras/seg + pausas)" : "Estimación a velocidad real de habla"}>
            <IconClock className="h-3.5 w-3.5" /> ≈{fmtSeconds(totalSec)} reales{script ? " · calculado del guion" : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400 ring-1 ring-white/[0.06]"><IconCamera className="h-3.5 w-3.5" /> ~{video.effortMin} min de grabación</span>
          <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400 ring-1 ring-white/[0.06]">{FUNNEL_LABEL[video.funnel]}</span>
          <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400 ring-1 ring-white/[0.06]">TikTok · Reels · FB</span>
        </div>

        <div className="mt-4 grid max-w-xl gap-1.5 sm:grid-cols-2 sm:gap-x-10">
          <ScoreBar value={video.scores.viral} label="Potencial viral" />
          <ScoreBar value={video.scores.facilidad} label="Facilidad" />
          <ScoreBar value={video.scores.confianza} label="Confianza" />
          <ScoreBar value={video.scores.fundadores} label="Trae fundadores" />
          <ScoreBar value={video.scores.explica} label="Explica Zentro" />
        </div>
      </div>

      {script ? (
        <>
          {/* Preparación */}
          <SectionTitle sub={script.general.note}>Preparación · antes de grabar</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <dl className="space-y-3 text-sm">
                {([["Ropa", script.prep.ropa], ["Fondo", script.prep.fondo], ["Cámara", script.prep.camara], ["Plano", script.prep.plano]] as const).map(([t, d]) => (
                  <div key={t}>
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{t}</dt>
                    <dd className="mt-0.5 leading-relaxed text-zinc-300">{d}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Recursos listos antes de grabar</p>
              <div className="mt-2 space-y-0.5">
                {script.prep.recursos.map((r, i) => (
                  <CheckItem
                    key={i}
                    k={`chk:video:${id}:prep:${i}`}
                    initial={state.checks.has(`chk:video:${id}:prep:${i}`)}
                    label={r}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Timeline de dirección */}
          <SectionTitle sub="Tiempos REALES calculados de lo que dices (2.3 palabras/seg + tus pausas): dilo a ritmo natural y el total cuadra solo. Cada bloque se graba POR SEPARADO (pausa de 2 s entre bloques; los errores se repiten sin cortar y se limpian en edición).">
            Guion dirigido · segundo a segundo
          </SectionTitle>
          <div className="relative space-y-4 before:absolute before:top-3 before:bottom-3 before:left-[34px] before:w-px before:bg-white/[0.08]">
            {script.segments.map((seg, i) => (
              <article key={i} className="relative flex gap-4">
                <div className="z-[1] flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#101513] ring-1 ring-white/[0.09]" title={`Bloque de ${fmtRange(tl[i].seconds)} s (calculado del texto)`}>
                  <span className="font-display text-sm font-bold tabular-nums text-[#3ee6a8]">{fmtRange(tl[i].from)}–{fmtRange(tl[i].to)}</span>
                  <span className="text-[10px] text-zinc-600">seg</span>
                </div>
                <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.07]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{seg.visual}</p>
                    {seg.pauseAfterSec && (
                      <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.08]" title="Silencio deliberado al final del bloque, ya contado en el tiempo. No lo recortes en edición.">
                        + silencio de {fmtRange(seg.pauseAfterSec)} s
                      </span>
                    )}
                    {seg.actionSec && (
                      <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.08]" title="Tiempo visual sin hablar (pantalla/acción), ya contado en el tiempo.">
                        + {fmtRange(seg.actionSec)} s de acción/pantalla
                      </span>
                    )}
                  </div>
                  <p className="mt-2 border-l-2 border-[#00C781] pl-3.5 font-display text-[15px] font-semibold leading-relaxed text-white">
                    “{seg.say}”
                  </p>
                  <div className="mt-3.5 grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2">
                    {seg.tone && <p className="flex gap-1.5 text-zinc-400"><IconMic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Tono:</b> {seg.tone}</span></p>}
                    {seg.energy && <p className="flex gap-1.5 text-zinc-400"><IconSparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Energía:</b> {seg.energy}</span></p>}
                    {seg.body && <p className="flex gap-1.5 text-zinc-400"><IconUser className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Cuerpo:</b> {seg.body}</span></p>}
                    {seg.camera && <p className="flex gap-1.5 text-zinc-400"><IconCamera className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Cámara:</b> {seg.camera}</span></p>}
                    {seg.gesture && <p className="flex gap-1.5 text-zinc-400"><IconUser className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Cara y manos:</b> {seg.gesture}</span></p>}
                    {seg.gaze && <p className="flex gap-1.5 text-zinc-400"><IconEye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" /><span><b className="text-zinc-300">Mirada:</b> {seg.gaze}</span></p>}
                  </div>
                  {seg.edit && (
                    <p className="mt-3 flex gap-1.5 rounded-xl bg-violet-400/[0.07] px-3 py-2 text-xs leading-relaxed text-violet-300 ring-1 ring-violet-400/15">
                      <IconScissors className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {seg.edit}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Edición + textos */}
          <SectionTitle>Edición en CapCut · este video</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <ol className="space-y-2.5 text-sm text-zinc-300">
                {script.editSteps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.06] font-display text-[11px] font-bold text-[#3ee6a8]">{i + 1}</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] text-zinc-600">
                La receta base (subtítulos, zooms, música, marca de agua) vive en el <Link href="/marketing-os/manual" className="text-[#3ee6a8] underline decoration-dotted">Manual</Link>.
              </p>
            </Card>
            <Card>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Textos en pantalla · capas que conviven</p>
              <div className="mt-2.5 space-y-2">
                {script.screenTexts.map((t, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${
                        t.layer === "titulo" ? "bg-[#00C781]/12 text-[#3ee6a8] ring-[#00C781]/25" : t.layer === "chip" ? "bg-sky-400/10 text-sky-300 ring-sky-400/25" : "bg-white/[0.06] text-zinc-400 ring-white/10"
                      }`}>
                        {t.layer === "titulo" ? "TEXTO GRANDE" : t.layer === "chip" ? "CHIPS" : "SUBTÍTULOS"}
                      </span>
                      <span className="text-[11px] tabular-nums text-zinc-600">
                        seg {fmtRange(tl[t.fromSeg]?.from ?? 0)} → {t.toSeg === "fin" ? "fin" : fmtRange(tl[t.toSeg]?.to ?? 0)} · {t.place}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-white">{t.text}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{t.style}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Guía CapCut tap por tap (solo lo que ESTE video usa) */}
          <SectionTitle sub="Cada acción de edición que pide este guion, explicada botón por botón en CapCut GRATIS. Abre la que necesites mientras editas.">
            Cómo se hace cada cosa en CapCut · tap por tap
          </SectionTitle>
          <div className="space-y-2">
            {recipes.map((r) => (
              <details key={r.id} className="group rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07] open:ring-[#00C781]/25">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-zinc-200">
                    <IconScissors className="h-4 w-4 text-zinc-500 group-open:text-[#3ee6a8]" />
                    {r.title}
                  </span>
                  <span className="text-xs text-zinc-600 transition group-open:rotate-90"><IconChevronR className="h-4 w-4" /></span>
                </summary>
                <div className="px-4 pb-4">
                  <p className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-zinc-400 ring-1 ring-white/[0.06]">
                    <b className="text-zinc-300">Dónde está:</b> {r.where}
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-zinc-300">
                    {r.steps.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/[0.06] font-display text-[11px] font-bold text-[#3ee6a8]">{i + 1}</span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                  {r.freeAlt && (
                    <p className="mt-3 rounded-lg bg-amber-400/[0.06] px-2.5 py-2 text-xs leading-relaxed text-amber-300/90 ring-1 ring-amber-400/15">
                      <b>Si es de pago (👑) o no aparece:</b> {r.freeAlt}
                    </p>
                  )}
                  <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                    <b className="text-[#3ee6a8]">Verifica:</b> {r.verify}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="font-display text-sm font-bold text-white">Ritmo</p>
              <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-zinc-300">
                {script.rhythm.map((r, i) => <li key={i} className="flex gap-2"><span className="text-[#3ee6a8]">·</span>{r}</li>)}
              </ul>
            </Card>
            <Card className="ring-rose-500/15">
              <p className="font-display text-sm font-bold text-rose-300">Errores típicos en ESTE video</p>
              <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-zinc-300">
                {script.mistakes.map((m, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">·</span>{m}</li>)}
              </ul>
            </Card>
          </div>
        </>
      ) : (
        <Card className="mt-6">
          <p className="font-display text-sm font-bold text-white">Idea en formato brief</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">{video.summary}</p>
          <p className="mt-4 rounded-xl bg-white/[0.03] p-3.5 text-xs leading-relaxed text-zinc-500 ring-1 ring-white/[0.06]">
            Este video aún no tiene guion dirigido. Cuando le llegue el turno, pídele a Claude:
            <i className="text-zinc-300"> “expande el guion #{video.id} al nivel de los 12 principales”</i> y aparecerá aquí
            con el mismo formato (preparación, timeline dirigido, edición, textos, ritmo y errores).
          </p>
        </Card>
      )}

      {/* Hashtags */}
      <SectionTitle>Hashtags y caption</SectionTitle>
      <Card>
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          <IconTag className="h-3.5 w-3.5" /> Set del pilar: {hashtagSet.pillar}
        </p>
        <p className="mt-2 select-all font-mono text-sm text-[#3ee6a8]">{hashtagSet.tags}</p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {hashtagSet.why} · Nunca #fyp / #parati. Caption distinto por red: TikTok corto y provocador · IG con CTA de comentario · FB narrativo.
        </p>
      </Card>

      {/* Checklists del video */}
      <SectionTitle sub="Se guardan por video: puedes cerrar y volver donde ibas.">Checklists de este video</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {CHECKLISTS.map((cl) => (
          <ChecklistCard
            key={cl.id}
            scope={`video:${id}`}
            listId={cl.id}
            title={cl.title}
            moment={cl.moment}
            items={cl.items}
            initialDone={cl.items.map((_, i) => state.checks.has(`chk:video:${id}:${cl.id}:${i}`))}
            disabled={state.unavailable}
          />
        ))}
      </div>

      {/* Métricas */}
      <SectionTitle sub="Anótalas 24-48 h después de publicar (estadísticas de TikTok/IG/FB). La retención a 3 s decide el mix del domingo.">
        Métricas de este video
      </SectionTitle>
      <Card>
        <MetricsEditor videoId={id} initial={metrics} disabled={state.unavailable} />
      </Card>
    </div>
  );
}
