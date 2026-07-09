import { CALENDAR, DAILY_HABITS, WEEKLY_RHYTHM } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import { Card, MigrationNotice, PageHeader, SectionTitle } from "../parts";
import { todayISO } from "../theme";
import { CalendarBoard } from "./calendar";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const state = await loadMarketingState();
  const today = todayISO();

  return (
    <div>
      <PageHeader
        title="Calendario"
        sub="Mes para planear, semana para ejecutar, agenda para repasar. Arrastra una tarea a otro día para reprogramarla; en el teléfono usa el icono de mover."
      />
      <MigrationNotice show={state.unavailable} />

      <CalendarBoard
        tasks={CALENDAR}
        initialMoves={[...state.moves.entries()]}
        initialChecks={[...state.checks].filter((k) => k.startsWith("cal:"))}
        today={today}
        disabled={state.unavailable}
      />

      <SectionTitle sub="Cuando el plan fechado termine, este ritmo se repite cada semana. Las métricas del domingo deciden QUÉ videos entran en cada hueco.">
        Ritmo semanal permanente
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
        <p className="font-display text-sm font-bold text-white">Horarios de publicación (hasta tener datos propios)</p>
        <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
          <p><b className="text-zinc-200">TikTok:</b> 7-9 pm entre semana · 12-3 pm sábado</p>
          <p><b className="text-zinc-200">Reels/IG:</b> 11 am-1 pm o 7-9 pm</p>
          <p><b className="text-zinc-200">Facebook:</b> 11 am fijo · grupos mar-jue 8-10 pm</p>
        </div>
        <p className="mt-2 text-[11px] text-zinc-600">Tras 4 semanas, usa TU dato (hora de tus espectadores en las estadísticas de cada red).</p>
      </Card>
    </div>
  );
}
