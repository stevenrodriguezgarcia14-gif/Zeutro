import Link from "next/link";
import { CALENDAR, DAILY_HABITS, FOUNDERS_TARGET, REF_LINK } from "@/lib/marketing/plan";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import type { VideoStatus } from "@/lib/marketing/types";
import { STATUS_ORDER } from "@/lib/marketing/types";
import { CheckItem, GoalEditor } from "./client";
import { IconArrowR, IconCamera, IconScissors, IconSend } from "./icons";
import { Card, MigrationNotice, PageHeader, SectionTitle, VideoCard } from "./parts";
import { KIND_THEME, STATUS_THEME, fmtShort, todayISO } from "./theme";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const state = await loadMarketingState();
  const today = todayISO();

  const effDate = (t: (typeof CALENDAR)[number]) => state.moves.get(t.id) ?? t.date;
  const todayTasks = CALENDAR.filter((t) => effDate(t) === today);
  const overdue = CALENDAR.filter(
    (t) => effDate(t) < today && !state.checks.has(`cal:${t.date}:${t.id}`) && t.kind !== "campaña" && t.kind !== "comunidad",
  ).slice(0, 5);
  const upcoming = CALENDAR.filter((t) => effDate(t) > today).slice(0, 4);

  const counts: Record<VideoStatus, number> = { pendiente: 0, grabado: 0, editado: 0, publicado: 0 };
  for (const v of VIDEOS) counts[statusOf(state, v.id)]++;

  const nextToRecord = [5, 2, 1, 4, 3, 7, 6, 13].map((id) => VIDEOS.find((v) => v.id === id)!).filter((v) => statusOf(state, v.id) === "pendiente").slice(0, 3);
  const toEdit = VIDEOS.filter((v) => statusOf(state, v.id) === "grabado").slice(0, 3);
  const toPublish = VIDEOS.filter((v) => statusOf(state, v.id) === "editado").slice(0, 3);

  const stageCards = [
    { title: "Grabar ahora", icon: IconCamera, tone: "text-sky-300", items: nextToRecord, empty: "Nada pendiente del lote actual" },
    { title: "Editar", icon: IconScissors, tone: "text-violet-300", items: toEdit, empty: "Nada grabado sin editar" },
    { title: "Publicar", icon: IconSend, tone: "text-[#3ee6a8]", items: toPublish, empty: "Nada editado sin publicar" },
  ];

  return (
    <div>
      <PageHeader
        title="Hoy"
        sub="Abre esto cada mañana: qué hacer hoy, en qué va la meta y cuál es el siguiente video."
      />
      <MigrationNotice show={state.unavailable} />

      {/* Meta + pipeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Meta de la campaña</p>
          <div className="mt-2">
            <GoalEditor initial={state.goal} target={FOUNDERS_TARGET} disabled={state.unavailable} />
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            La única métrica de verdad. Link medible: <code className="font-mono">{REF_LINK}</code>
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Pipeline de videos</p>
          <div className="mt-3 space-y-2.5">
            {STATUS_ORDER.map((s) => {
              const t = STATUS_THEME[s];
              const pct = Math.round((counts[s] / VIDEOS.length) * 100);
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">{t.label}</span>
                    <span className="font-display font-bold tabular-nums text-white">{counts[s]}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.max(pct, counts[s] > 0 ? 4 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/marketing-os/videos" className="mt-4 inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-[#3ee6a8]">
            Ver los 60 videos <IconArrowR className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      {/* Hoy + próximos */}
      <SectionTitle sub={`Marca cada tarea al completarla. Hábito diario: ${DAILY_HABITS[0].toLowerCase()}.`}>
        Tu día
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Hoy · {fmtShort(today)}</p>
          <div className="mt-2 space-y-0.5">
            {todayTasks.length === 0 && (
              <p className="py-3 text-sm text-zinc-600">
                Sin tareas fechadas hoy — revisa el <Link href="/marketing-os/calendario" className="text-[#3ee6a8] underline decoration-dotted">calendario</Link>.
              </p>
            )}
            {todayTasks.map((t) => (
              <div key={t.id} className="flex items-start gap-2">
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${KIND_THEME[t.kind].dot}`} />
                <div className="flex-1">
                  <CheckItem
                    k={`cal:${t.date}:${t.id}`}
                    initial={state.checks.has(`cal:${t.date}:${t.id}`)}
                    label={t.label}
                    detail={t.detail}
                    disabled={state.unavailable}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          {overdue.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400/90">Atrasadas</p>
              <div className="mt-1 space-y-0.5">
                {overdue.map((t) => (
                  <CheckItem
                    key={`${t.date}-${t.id}`}
                    k={`cal:${t.date}:${t.id}`}
                    initial={false}
                    label={`${fmtShort(effDate(t))} · ${t.label}`}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
              <div className="my-3 h-px bg-white/[0.06]" />
            </>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Próximos días</p>
          <ul className="mt-2 space-y-2">
            {upcoming.map((t) => (
              <li key={`${t.date}-${t.id}`} className="flex items-start gap-2.5 text-sm text-zinc-300">
                <span className="mt-0.5 shrink-0 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-500 ring-1 ring-white/[0.06]">
                  {fmtShort(effDate(t))}
                </span>
                <span className="leading-snug">{t.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Siguiente por etapa */}
      <SectionTitle sub="El orden ya está decidido: tú solo ejecuta.">Siguiente en cada etapa</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        {stageCards.map((s) => (
          <Card key={s.title}>
            <p className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${s.tone}`}>
              <s.icon className="h-4 w-4" /> {s.title}
            </p>
            <ul className="mt-3 space-y-2.5">
              {s.items.length === 0 && <li className="text-sm text-zinc-600">{s.empty}</li>}
              {s.items.map((v) => (
                <li key={v.id}>
                  <Link href={`/marketing-os/videos/${v.id}`} className="group flex items-baseline gap-2 text-sm text-zinc-200 transition hover:text-[#3ee6a8]">
                    <span className="font-display text-xs font-bold text-zinc-600 group-hover:text-[#3ee6a8]/70">#{v.id}</span>
                    <span className="leading-snug">{v.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* Lote 1 */}
      <SectionTitle sub="De más fácil a más importante: #5 → #2 → #1 → #4. El #4 se fija en los 3 perfiles.">
        Lote 1 · los que deciden todo
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[5, 2, 1, 4].map((id) => {
          const v = VIDEOS.find((x) => x.id === id)!;
          return <VideoCard key={id} video={v} status={statusOf(state, id)} />;
        })}
      </div>
    </div>
  );
}
