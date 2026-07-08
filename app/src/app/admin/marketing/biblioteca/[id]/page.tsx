import Link from "next/link";
import { notFound } from "next/navigation";
import { getVideo } from "@/lib/marketing/videos";
import { getScript } from "@/lib/marketing/scripts";
import { CHECKLISTS, HASHTAG_SETS } from "@/lib/marketing/plan";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { STATUS_ORDER } from "@/lib/marketing/types";
import { saveMetrics, setVideoStatus } from "../../actions";
import { Card, Check, ErrorNotice, MigrationNotice, PillarBadge, ScoreDots, SectionTitle, StatusPill } from "../../parts";

export const dynamic = "force-dynamic";

const FUNNEL_LABEL = { frio: "Frío (descubrimiento)", tibio: "Tibio (confianza)", conversion: "Conversión (registro)" } as const;

export default async function VideoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: rawId } = await params;
  const { error } = await searchParams;
  const id = Number(rawId);
  const video = getVideo(id);
  if (!video) notFound();

  const script = getScript(id);
  const state = await loadMarketingState();
  const status = statusOf(state, id);
  const metrics = state.metrics.get(id) ?? {};
  const back = `/admin/marketing/biblioteca/${id}`;
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
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <div className="mt-4 flex items-center justify-between gap-2">
        <Link href="/admin/marketing/biblioteca" className="text-xs text-slate-400 hover:text-white">← Biblioteca</Link>
        <div className="flex gap-2">
          {id > 1 && getVideo(id - 1) && (
            <Link href={`/admin/marketing/biblioteca/${id - 1}`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">← #{id - 1}</Link>
          )}
          {getVideo(id + 1) && (
            <Link href={`/admin/marketing/biblioteca/${id + 1}`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">#{id + 1} →</Link>
          )}
        </div>
      </div>

      {/* Cabecera */}
      <Card className="mt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-500">#{video.id}</span>
              <StatusPill status={status} />
              {script?.badge && (
                <span className="rounded-full bg-[#00C781]/15 px-2 py-0.5 text-[11px] font-semibold text-[#2fe3a5]">⭐ {script.badge}</span>
              )}
              {video.requiresReal && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">⚠️ {video.requiresReal}</span>
              )}
            </div>
            <h1 className="mt-1 text-xl font-bold text-white">{video.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{video.objective}</p>
          </div>

          {/* Botones de estado */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <form key={s} action={setVideoStatus}>
                <input type="hidden" name="video_id" value={video.id} />
                <input type="hidden" name="status" value={s} />
                <input type="hidden" name="back" value={back} />
                <button
                  disabled={state.unavailable || s === status}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors disabled:cursor-default ${
                    s === status
                      ? "bg-[#00C781] text-slate-950"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                  }`}
                >
                  {s === "pendiente" ? "↺ pendiente" : `marcar ${s}`}
                </button>
              </form>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <p className="text-slate-300"><b className="text-slate-500">Gancho (3 s):</b> {video.hook}</p>
          <p className="text-slate-300"><b className="text-slate-500">CTA:</b> {video.cta}</p>
          <p className="text-slate-300"><b className="text-slate-500">Emociones:</b> {video.emotions.join(" → ")}</p>
          {video.audience && <p className="text-slate-300"><b className="text-slate-500">Público:</b> {video.audience}</p>}
          {video.problem && <p className="text-slate-300 sm:col-span-2"><b className="text-slate-500">Problema que resuelve:</b> {video.problem}</p>}
          {video.timing && <p className="text-amber-300 sm:col-span-2"><b>⏱ Timing:</b> {video.timing}</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
          <PillarBadge pillar={video.pillar} />
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{video.durationSec} s final</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">~{video.effortMin} min de grabación</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">{FUNNEL_LABEL[video.funnel]}</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">TikTok · Reels · FB</span>
        </div>

        <div className="mt-3 grid max-w-md grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-8">
          <ScoreDots value={video.scores.viral} label="Potencial viral" />
          <ScoreDots value={video.scores.facilidad} label="Facilidad de grabación" />
          <ScoreDots value={video.scores.confianza} label="Genera confianza" />
          <ScoreDots value={video.scores.fundadores} label="Trae fundadores" />
          <ScoreDots value={video.scores.explica} label="Explica Zentro" />
        </div>
      </Card>

      {script ? (
        <>
          {/* Información y preparación */}
          <SectionTitle>🎒 Preparación (antes de grabar)</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-xs font-semibold text-slate-500">Ropa</dt><dd className="text-slate-300">{script.prep.ropa}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Fondo</dt><dd className="text-slate-300">{script.prep.fondo}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Cámara</dt><dd className="text-slate-300">{script.prep.camara}</dd></div>
                <div><dt className="text-xs font-semibold text-slate-500">Plano</dt><dd className="text-slate-300">{script.prep.plano}</dd></div>
              </dl>
              {script.general.note && (
                <p className="mt-3 rounded-lg bg-slate-800/60 p-2.5 text-xs leading-relaxed text-slate-300">💡 {script.general.note}</p>
              )}
            </Card>
            <Card>
              <p className="text-xs font-semibold text-slate-500">Recursos listos ANTES de grabar</p>
              <div className="mt-1 space-y-1">
                {script.prep.recursos.map((r, i) => (
                  <Check
                    key={i}
                    k={`chk:video:${id}:prep:${i}`}
                    checked={state.checks.has(`chk:video:${id}:prep:${i}`)}
                    label={r}
                    back={back}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Línea de tiempo de producción */}
          <SectionTitle sub="Cada bloque se graba POR SEPARADO (pausa de 2 s entre bloques; los errores se borran en edición).">
            🎬 Guion segundo a segundo
          </SectionTitle>
          <div className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[27px] before:w-px before:bg-slate-800 sm:before:left-[35px]">
            {script.segments.map((seg, i) => (
              <div key={i} className="relative flex gap-3 sm:gap-4">
                <div className="z-[1] flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900 sm:h-[72px] sm:w-[72px]">
                  <span className="text-sm font-bold text-[#2fe3a5] sm:text-base">{seg.from}-{seg.to}</span>
                  <span className="text-[10px] text-slate-500">seg</span>
                </div>
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{seg.visual}</p>
                  <p className="mt-1.5 border-l-2 border-[#00C781] pl-3 text-sm font-medium leading-relaxed text-white">
                    “{seg.say}”
                  </p>
                  <div className="mt-2.5 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    {seg.tone && <p className="text-slate-400"><b className="text-slate-500">🗣 Tono:</b> {seg.tone}</p>}
                    {seg.gesture && <p className="text-slate-400"><b className="text-slate-500">🙌 Cara y manos:</b> {seg.gesture}</p>}
                    {seg.gaze && <p className="text-slate-400"><b className="text-slate-500">👁 Mirada:</b> {seg.gaze}</p>}
                  </div>
                  {seg.edit && (
                    <p className="mt-2 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-xs leading-relaxed text-violet-300">
                      ✂️ {seg.edit}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Edición y textos */}
          <SectionTitle>✂️ Edición en CapCut (este video)</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <ol className="space-y-2 text-sm text-slate-300">
                {script.editSteps.map((s, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-[#2fe3a5]">{i + 1}</span>
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-500">
                La receta base (subtítulos, zooms, música, marca de agua) está en el <Link href="/admin/marketing/manual" className="text-[#2fe3a5] underline">Manual</Link>.
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-slate-500">Textos en pantalla (capas que conviven)</p>
              <div className="mt-2 space-y-2">
                {script.screenTexts.map((t, i) => (
                  <div key={i} className="rounded-lg border border-slate-800 p-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        t.layer === "titulo" ? "bg-[#00C781]/15 text-[#2fe3a5]" : t.layer === "chip" ? "bg-sky-500/15 text-sky-300" : "bg-slate-700/50 text-slate-300"
                      }`}>
                        {t.layer === "titulo" ? "TEXTO GRANDE" : t.layer === "chip" ? "CHIPS" : "SUBTÍTULOS"}
                      </span>
                      <span className="text-[11px] text-slate-500">seg {t.from} → {t.to === "fin" ? "fin" : t.to} · {t.place}</span>
                    </div>
                    <p className="mt-1 text-sm text-white">{t.text}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{t.style}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-white">🎵 Ritmo</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
                {script.rhythm.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </Card>
            <Card className="border-red-900/50">
              <p className="text-sm font-semibold text-red-300">🚫 Errores típicos en ESTE video</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
                {script.mistakes.map((m, i) => <li key={i}>• {m}</li>)}
              </ul>
            </Card>
          </div>
        </>
      ) : (
        <Card className="mt-6">
          <p className="text-sm font-semibold text-white">📝 Idea desarrollada (formato brief)</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{video.summary}</p>
          <p className="mt-3 rounded-lg bg-slate-800/60 p-3 text-xs leading-relaxed text-slate-400">
            Este video aún no tiene guion segundo-a-segundo. Cuando le llegue el turno en el plan, pídele a Claude:
            <i className="text-slate-300"> “expande el guion #{video.id} al nivel del lote 1”</i> — usará el mismo formato
            (preparación, línea de tiempo, edición, textos, ritmo y errores) y aparecerá aquí.
          </p>
        </Card>
      )}

      {/* Hashtags y caption */}
      <SectionTitle>#️⃣ Hashtags para este video ({hashtagSet.pillar})</SectionTitle>
      <Card>
        <p className="font-mono text-sm text-[#2fe3a5]">{hashtagSet.tags}</p>
        <p className="mt-1.5 text-xs text-slate-500">{hashtagSet.why} · Nunca uses #fyp / #parati. Caption distinto por red: TikTok corto, IG con CTA de comentario, FB narrativo.</p>
      </Card>

      {/* Checklists del video */}
      <SectionTitle sub="Los checks se guardan por video: puedes cerrar y volver.">☑️ Checklists de este video</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {CHECKLISTS.map((cl) => {
          const done = cl.items.filter((_, i) => state.checks.has(`chk:video:${id}:${cl.id}:${i}`)).length;
          return (
            <details key={cl.id} className="group rounded-2xl border border-slate-800 bg-slate-900" open={done > 0 && done < cl.items.length}>
              <summary className="flex cursor-pointer list-none items-center justify-between p-4">
                <span className="text-sm font-semibold text-white">{cl.title}</span>
                <span className={`text-xs ${done === cl.items.length ? "text-[#2fe3a5]" : "text-slate-500"}`}>
                  {done}/{cl.items.length} {done === cl.items.length ? "✓" : ""}
                </span>
              </summary>
              <div className="space-y-0.5 px-3 pb-3">
                {cl.items.map((item, i) => (
                  <Check
                    key={i}
                    k={`chk:video:${id}:${cl.id}:${i}`}
                    checked={state.checks.has(`chk:video:${id}:${cl.id}:${i}`)}
                    label={item}
                    back={back}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {/* Métricas */}
      <SectionTitle sub="Anótalas 24-48 h después de publicar (estadísticas de TikTok/IG/FB).">📊 Métricas de este video</SectionTitle>
      <Card>
        <form action={saveMetrics} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input type="hidden" name="video_id" value={video.id} />
          <input type="hidden" name="back" value={back} />
          {(
            [
              ["views", "Visualizaciones", metrics.views],
              ["ret3s", "Retención 3 s (%)", metrics.ret3s],
              ["completion", "Lo terminan (%)", metrics.completion],
              ["comments", "Comentarios", metrics.comments],
              ["shares", "Compartidos", metrics.shares],
              ["saves", "Guardados", metrics.saves],
              ["clicks", "Clics al link", metrics.clicks],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="text-xs text-slate-400">
              {label}
              <input
                name={name}
                type="number"
                min={0}
                step="any"
                defaultValue={val ?? ""}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white outline-none focus:border-[#00C781]"
              />
            </label>
          ))}
          <label className="col-span-2 text-xs text-slate-400 sm:col-span-4">
            Notas (¿qué funcionó? ¿qué comentaron?)
            <input
              name="notes"
              defaultValue={metrics.notes ?? ""}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white outline-none focus:border-[#00C781]"
            />
          </label>
          <div className="col-span-2 sm:col-span-4">
            <button className="rounded-lg bg-[#00C781] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50" disabled={state.unavailable}>
              Guardar métricas
            </button>
          </div>
        </form>
      </Card>

      {/* IA (estructura futura) */}
      <Card className="mt-6 border-dashed">
        <p className="text-sm font-semibold text-slate-300">✧ Asistente IA <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">próximamente</span></p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Aquí vivirán: generar 5 variantes del gancho de este video · reescribir el CTA · analizar por qué esta métrica
          bajó · sugerir el siguiente video según lo que funcionó. Mientras tanto, pídeselo a Claude en el chat del proyecto.
        </p>
      </Card>
    </div>
  );
}
