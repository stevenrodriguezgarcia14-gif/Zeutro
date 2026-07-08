import { CALENDAR, DAILY_HABITS, WEEKLY_RHYTHM } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import type { CalendarTask } from "@/lib/marketing/types";
import { Card, Check, ErrorNotice, MigrationNotice, SectionTitle } from "../parts";

export const dynamic = "force-dynamic";

const KIND_STYLE: Record<CalendarTask["kind"], { label: string; cls: string }> = {
  grabar: { label: "🎬 Grabar", cls: "bg-sky-500/15 text-sky-300" },
  editar: { label: "✂️ Editar", cls: "bg-violet-500/15 text-violet-300" },
  publicar: { label: "📤 Publicar", cls: "bg-[#00C781]/15 text-[#2fe3a5]" },
  revisar: { label: "📊 Revisar", cls: "bg-amber-500/15 text-amber-300" },
  campaña: { label: "🖼️ Campaña", cls: "bg-slate-700/50 text-slate-300" },
  comunidad: { label: "👥 Comunidad", cls: "bg-pink-500/15 text-pink-300" },
};

const DOW = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function dayName(date: string): string {
  return DOW[new Date(date + "T12:00:00Z").getUTCDay()];
}

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await loadMarketingState();
  const today = todayISO();
  const back = "/admin/marketing/calendario";

  // Agrupar por fecha, manteniendo el orden del plan.
  const byDate = new Map<string, CalendarTask[]>();
  for (const t of CALENDAR) {
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(t);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <SectionTitle sub="Cada tarea se marca al completarla. Las piezas de campaña ya están programadas en Meta: tu trabajo ahí es responder comentarios.">
        Plan fechado (julio 2026)
      </SectionTitle>

      <div className="space-y-3">
        {dates.map((date) => {
          const tasks = byDate.get(date)!;
          const isToday = date === today;
          const past = date < today;
          const allDone = tasks.every((t) => state.checks.has(`cal:${t.date}:${t.id}`));
          return (
            <div
              key={date}
              className={`rounded-2xl border p-4 ${
                isToday
                  ? "border-[#00C781]/60 bg-[#00C781]/5"
                  : past && allDone
                    ? "border-slate-800 bg-slate-900/40 opacity-70"
                    : "border-slate-800 bg-slate-900"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-white">
                  {isToday ? "HOY · " : ""}
                  <span className="capitalize">{dayName(date)}</span> {date.slice(8)}/{date.slice(5, 7)}
                </p>
                {past && !allDone && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">pendiente</span>}
                {allDone && <span className="rounded-full bg-[#00C781]/15 px-2 py-0.5 text-[11px] text-[#2fe3a5]">✓ completo</span>}
              </div>
              <div className="mt-2 space-y-1">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <span className={`mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${KIND_STYLE[t.kind].cls}`}>
                      {KIND_STYLE[t.kind].label}
                    </span>
                    <Check
                      k={`cal:${t.date}:${t.id}`}
                      checked={state.checks.has(`cal:${t.date}:${t.id}`)}
                      label={t.label}
                      detail={t.detail}
                      back={back}
                      disabled={state.unavailable}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle sub="Cuando el plan fechado termine, este ritmo se repite cada semana. Los datos (métricas del domingo) deciden QUÉ videos entran en cada hueco.">
        Ritmo semanal permanente
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WEEKLY_RHYTHM.map((d) => (
          <Card key={d.day} className="!p-4">
            <p className="text-sm font-semibold text-white">{d.day}</p>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
              {d.tasks.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Card>
        ))}
        <Card className="!p-4 border-[#00C781]/40">
          <p className="text-sm font-semibold text-[#2fe3a5]">Todos los días</p>
          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-slate-400">
            {DAILY_HABITS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="text-sm font-semibold text-white">Horarios de publicación (hasta tener datos propios)</p>
        <div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
          <p><b className="text-slate-200">TikTok:</b> 7-9 pm entre semana · 12-3 pm sábado</p>
          <p><b className="text-slate-200">Reels/IG:</b> 11 am-1 pm o 7-9 pm</p>
          <p><b className="text-slate-200">Facebook:</b> 11 am fijo · grupos mar-jue 8-10 pm</p>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Tras 4 semanas, ignora esta tabla y usa TU dato (hora de tus espectadores en las estadísticas de cada red).
        </p>
      </Card>
    </div>
  );
}
