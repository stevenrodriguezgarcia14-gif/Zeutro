import { CHECKLISTS } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import { resetChecklist } from "../actions";
import { Card, Check, ErrorNotice, MigrationNotice, SectionTitle } from "../parts";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await loadMarketingState();
  const back = "/admin/marketing/checklists";

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <SectionTitle sub="Versión general (para la sesión de hoy). Cada video tiene además sus checklists propios en su página de la Biblioteca. “Reiniciar” los deja limpios para la próxima sesión.">
        Checklists de trabajo
      </SectionTitle>

      <div className="grid gap-4 md:grid-cols-2">
        {CHECKLISTS.map((cl) => {
          const done = cl.items.filter((_, i) => state.checks.has(`chk:general:${cl.id}:${i}`)).length;
          const complete = done === cl.items.length;
          return (
            <Card key={cl.id} className={complete ? "border-[#00C781]/50" : ""}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{cl.title} {complete && <span className="text-[#2fe3a5]">✓</span>}</p>
                  <p className="text-xs text-slate-500">{cl.moment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{done}/{cl.items.length}</span>
                  <form action={resetChecklist}>
                    <input type="hidden" name="scope" value="general" />
                    <input type="hidden" name="list_id" value={cl.id} />
                    <input type="hidden" name="back" value={back} />
                    <button
                      className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:bg-slate-800"
                      disabled={state.unavailable || done === 0}
                    >
                      ↺ Reiniciar
                    </button>
                  </form>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-[#00C781] transition-all" style={{ width: `${(done / cl.items.length) * 100}%` }} />
              </div>
              <div className="mt-3 space-y-0.5">
                {cl.items.map((item, i) => (
                  <Check
                    key={i}
                    k={`chk:general:${cl.id}:${i}`}
                    checked={state.checks.has(`chk:general:${cl.id}:${i}`)}
                    label={item}
                    back={back}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
