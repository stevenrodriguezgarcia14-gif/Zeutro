import Link from "next/link";
import { CALENDAR, DAILY_HABITS, FOUNDERS_TARGET, REF_LINK } from "@/lib/marketing/plan";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { STATUS_ORDER, type VideoStatus } from "@/lib/marketing/types";
import { saveGoal } from "./actions";
import { Card, Check, ErrorNotice, MigrationNotice, SectionTitle, StatusPill, VideoCard } from "./parts";

export const dynamic = "force-dynamic";

/** Fecha local del fundador (LatAm, sin horario de verano). */
function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export default async function MarketingDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await loadMarketingState();
  const today = todayISO();
  const back = "/admin/marketing";

  const todayTasks = CALENDAR.filter((t) => t.date === today);
  const overdue = CALENDAR.filter(
    (t) => t.date < today && !state.checks.has(`cal:${t.date}:${t.id}`) && t.kind !== "campaña" && t.kind !== "comunidad",
  ).slice(0, 6);
  const upcoming = CALENDAR.filter((t) => t.date > today).slice(0, 4);

  const counts: Record<VideoStatus, number> = { pendiente: 0, grabado: 0, editado: 0, publicado: 0 };
  for (const v of VIDEOS) counts[statusOf(state, v.id)]++;

  // Semana actual (lunes a domingo) para el progreso semanal.
  const d = new Date(today + "T12:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // 0 = lunes
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - dow);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  const weekTasks = CALENDAR.filter((t) => t.date >= iso(monday) && t.date <= iso(sunday));
  const weekDone = weekTasks.filter((t) => state.checks.has(`cal:${t.date}:${t.id}`)).length;

  // Siguientes videos del plan (lote 1 primero).
  const nextToRecord = [5, 2, 1, 4, 3, 7, 6, 13].map((id) => VIDEOS.find((v) => v.id === id)!).filter((v) => statusOf(state, v.id) === "pendiente").slice(0, 4);
  const toEdit = VIDEOS.filter((v) => statusOf(state, v.id) === "grabado").slice(0, 4);
  const toPublish = VIDEOS.filter((v) => statusOf(state, v.id) === "editado").slice(0, 4);

  const goalPct = Math.min(100, Math.round((state.goal.current / FOUNDERS_TARGET) * 100));

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      {/* Meta de fundadores */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">🎯 Meta: {FOUNDERS_TARGET} Usuarios Fundadores</p>
            <p className="text-2xl font-bold text-[#2fe3a5]">
              {state.goal.current}<span className="text-sm text-slate-500"> / {FOUNDERS_TARGET}</span>
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-[#00C781] transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Registros con <code className="font-mono text-slate-300">?ref=fundadores</code>: <b className="text-white">{state.goal.registros}</b></span>
            <span>Lista de espera: <b className="text-white">{state.goal.waitlist}</b></span>
          </div>
          <form action={saveGoal} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="back" value={back} />
            {(
              [
                ["current", "Fundadores", state.goal.current],
                ["registros", "Registros ref", state.goal.registros],
                ["waitlist", "Lista espera", state.goal.waitlist],
              ] as const
            ).map(([name, label, val]) => (
              <label key={name} className="text-xs text-slate-400">
                {label}
                <input
                  name={name}
                  type="number"
                  min={0}
                  defaultValue={val}
                  className="mt-1 block w-24 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white outline-none focus:border-[#00C781]"
                />
              </label>
            ))}
            <button className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800" disabled={state.unavailable}>
              Guardar
            </button>
          </form>
          <p className="mt-2 text-[11px] text-slate-500">
            La única métrica de verdad. Link medible: <code className="font-mono">{REF_LINK}</code>
          </p>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-white">Pipeline de videos</p>
          <div className="mt-3 space-y-2">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusPill status={s} />
                <span className="text-lg font-bold text-white">{counts[s]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-slate-800 pt-2 text-xs text-slate-500">
            Esta semana: <b className="text-slate-300">{weekDone}/{weekTasks.length}</b> tareas del calendario hechas
          </p>
        </Card>
      </div>

      {/* Hoy */}
      <SectionTitle sub={`Hoy es ${today}. Marca cada tarea al completarla.`}>📌 Qué hacer hoy</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-slate-400">
              Sin tareas fechadas hoy. Toca ritmo semanal: revisa el <Link href="/admin/marketing/calendario" className="text-[#2fe3a5] underline">calendario</Link>.
            </p>
          ) : (
            <div className="space-y-1">
              {todayTasks.map((t) => (
                <Check
                  key={t.id}
                  k={`cal:${t.date}:${t.id}`}
                  checked={state.checks.has(`cal:${t.date}:${t.id}`)}
                  label={t.label}
                  detail={t.detail}
                  back={back}
                  disabled={state.unavailable}
                />
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-slate-800 pt-3 text-xs font-semibold text-slate-400">Hábitos diarios</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-500">
            {DAILY_HABITS.map((h) => <li key={h}>• {h}</li>)}
          </ul>
        </Card>

        <Card>
          {overdue.length > 0 && (
            <>
              <p className="text-xs font-semibold text-amber-300">⏰ Atrasadas (del plan)</p>
              <div className="mt-1 space-y-1">
                {overdue.map((t) => (
                  <Check
                    key={`${t.date}-${t.id}`}
                    k={`cal:${t.date}:${t.id}`}
                    checked={false}
                    label={`${t.date.slice(5)} · ${t.label}`}
                    back={back}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </>
          )}
          <p className={`text-xs font-semibold text-slate-400 ${overdue.length > 0 ? "mt-4 border-t border-slate-800 pt-3" : ""}`}>Próximos días</p>
          <ul className="mt-1 space-y-1.5">
            {upcoming.map((t) => (
              <li key={`${t.date}-${t.id}`} className="text-sm text-slate-300">
                <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400">{t.date.slice(5)}</span>
                {t.label}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Siguiente acción por etapa */}
      <SectionTitle sub="El orden ya está decidido (Parte C): tú solo ejecuta.">🎬 Siguiente en cada etapa</SectionTitle>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Grabar ahora</p>
          <ul className="mt-2 space-y-2">
            {nextToRecord.length === 0 && <li className="text-sm text-slate-500">Nada pendiente del lote actual 🎉</li>}
            {nextToRecord.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/marketing/biblioteca/${v.id}`} className="text-sm text-slate-200 hover:text-[#2fe3a5]">
                  #{v.id} {v.title} <span className="text-xs text-slate-500">(~{v.effortMin} min)</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">Editar</p>
          <ul className="mt-2 space-y-2">
            {toEdit.length === 0 && <li className="text-sm text-slate-500">Nada grabado sin editar.</li>}
            {toEdit.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/marketing/biblioteca/${v.id}`} className="text-sm text-slate-200 hover:text-[#2fe3a5]">
                  #{v.id} {v.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2fe3a5]">Publicar</p>
          <ul className="mt-2 space-y-2">
            {toPublish.length === 0 && <li className="text-sm text-slate-500">Nada editado sin publicar.</li>}
            {toPublish.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/marketing/biblioteca/${v.id}`} className="text-sm text-slate-200 hover:text-[#2fe3a5]">
                  #{v.id} {v.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Lote 1 */}
      <SectionTitle sub="De más fácil a más importante: #5 → #2 → #1 → #4. El #4 se fija en los 3 perfiles.">🚀 Lote 1 (los que deciden todo)</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[5, 2, 1, 4].map((id) => {
          const v = VIDEOS.find((x) => x.id === id)!;
          return <VideoCard key={id} video={v} status={statusOf(state, id)} />;
        })}
      </div>
    </div>
  );
}
