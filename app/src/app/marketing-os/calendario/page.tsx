import { DAILY_HABITS, WEEKLY_RHYTHM } from "@/lib/marketing/plan";
import { buildSchedule } from "@/lib/marketing/schedule";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { ReplanButton } from "../client";
import { Card, MigrationNotice, PageHeader, SectionTitle } from "../parts";
import { todayISO } from "../theme";
import { CalendarBoard } from "./calendar";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const state = await loadMarketingState();
  const today = todayISO();

  // El plan se genera SIEMPRE desde hoy + el estado real de cada video:
  // nunca hay fechas vencidas ni "empieza el lunes" de un lunes que ya pasó.
  const schedule = buildSchedule(today, (id) => statusOf(state, id));

  return (
    <div>
      <PageHeader
        title="Calendario"
        sub="Se replanifica solo: cada día se genera desde HOY según qué videos ya grabaste, editaste o publicaste. Marca un video como grabado y el plan de mañana se reorganiza. Arrastra tareas para ajustes puntuales."
        right={<ReplanButton disabled={state.unavailable} />}
      />
      <MigrationNotice show={state.unavailable} />

      <CalendarBoard
        tasks={schedule.tasks}
        initialMoves={[...state.moves.entries()]}
        initialChecks={[...state.checks].filter((k) => k.startsWith("cal:"))}
        today={today}
        disabled={state.unavailable}
      />

      <SectionTitle sub="La lógica detrás del plan automático. Las métricas del domingo deciden QUÉ videos entran en cada hueco.">
        Ritmo semanal (la regla que sigue el planificador)
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WEEKLY_RHYTHM.map((d) => (
          <Card key={d.day} className="!p-4">
            <p className="font-display text-sm font-bold text-white">{d.day}</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-400">
              {d.tasks.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </Card>
        ))}
        <Card className="!p-4 ring-[#00C781]/25">
          <p className="font-display text-sm font-bold text-[#3ee6a8]">Todos los días</p>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-400">
            {DAILY_HABITS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <p className="font-display text-sm font-bold text-white">Cómo replanifica el sistema</p>
        <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-zinc-400">
          <li>· <b className="text-zinc-300">Atraso:</b> lo no hecho no se queda en el pasado — reaparece planificado desde hoy.</li>
          <li>· <b className="text-zinc-300">Adelanto:</b> ¿grabaste 5 videos hoy? Márcalos como grabados y mañana el plan salta directo a edición y publicación.</li>
          <li>· <b className="text-zinc-300">Orden estratégico:</b> la secuencia de publicación de la campaña no se rompe (#1 abre, #4 se fija en perfiles, luego alternancia dolor/demo/historia).</li>
          <li>· <b className="text-zinc-300">Videos con material real</b> (marcados en ámbar) no se auto-programan: entran cuando exista el material.</li>
          <li>· <b className="text-zinc-300">Carga por día:</b> el chip “≈min” estima el trabajo; si un día pasa de 90 min se marca “pesado” — arrastra algo a un día libre.</li>
          <li>· <b className="text-zinc-300">Horarios:</b> TikTok 7-9 pm · Reels/FB 11 am-1 pm · sábado TikTok 12-3 pm. Tras 4 semanas, usa TU dato de las estadísticas.</li>
        </ul>
      </Card>
    </div>
  );
}
