import { RESOURCES } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import { CheckItem } from "../client";
import { Card, MigrationNotice, PageHeader } from "../parts";

export const dynamic = "force-dynamic";

export default async function RecursosPage() {
  const state = await loadMarketingState();
  const groups = [...new Set(RESOURCES.map((r) => r.group))];
  const total = RESOURCES.length;
  const done = RESOURCES.filter((r) => state.checks.has(`res:${r.id}`)).length;

  return (
    <div>
      <PageHeader
        title="Recursos"
        sub={`Todo se prepara UNA vez y se recorta mil veces. Progreso: ${done}/${total} listos.`}
      />
      <MigrationNotice show={state.unavailable} />

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#00C781] to-[#3ee6a8] transition-[width] duration-500" style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => {
          const items = RESOURCES.filter((r) => r.group === g);
          const gDone = items.filter((r) => state.checks.has(`res:${r.id}`)).length;
          return (
            <Card key={g}>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-white">{g}</p>
                <span className={`text-xs tabular-nums ${gDone === items.length ? "text-[#3ee6a8]" : "text-zinc-500"}`}>{gDone}/{items.length}</span>
              </div>
              <div className="mt-2.5 space-y-0.5">
                {items.map((r) => (
                  <CheckItem
                    key={r.id}
                    k={`res:${r.id}`}
                    initial={state.checks.has(`res:${r.id}`)}
                    label={r.label}
                    detail={[r.detail, r.path ? `Carpeta: ${r.path}` : ""].filter(Boolean).join(" · ")}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </Card>
          );
        })}
        <Card>
          <p className="font-display text-sm font-bold text-white">Cómo grabar las pantallas</p>
          <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-zinc-300">
            <li>· Usa la grabadora del PROPIO teléfono (menú rápido → “Grabar pantalla”), no la cámara al monitor.</li>
            <li>· Sesión con el usuario canónico de prueba (ya tiene datos creíbles; no re-sembrar).</li>
            <li>· Dedo LENTO y deliberado: el espectador sigue tu dedo.</li>
            <li>· Para build in public (#7, #26) sí vale cámara al monitor con código: lo “sucio” suma autenticidad.</li>
            <li>· Regeneración por Playwright: <code className="font-mono text-xs">video-build/record-tour.mjs</code>.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
