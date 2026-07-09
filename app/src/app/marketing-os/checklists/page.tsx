import { CHECKLISTS } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import { ChecklistCard } from "../client";
import { MigrationNotice, PageHeader } from "../parts";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  const state = await loadMarketingState();

  return (
    <div>
      <PageHeader
        title="Checklists"
        sub="Versión general para la sesión de hoy (cada video tiene además los suyos en su propia página). “Reiniciar” los deja limpios para la próxima sesión."
      />
      <MigrationNotice show={state.unavailable} />

      <div className="grid gap-4 md:grid-cols-2">
        {CHECKLISTS.map((cl) => (
          <ChecklistCard
            key={cl.id}
            scope="general"
            listId={cl.id}
            title={cl.title}
            moment={cl.moment}
            items={cl.items}
            initialDone={cl.items.map((_, i) => state.checks.has(`chk:general:${cl.id}:${i}`))}
            disabled={state.unavailable}
          />
        ))}
      </div>
    </div>
  );
}
