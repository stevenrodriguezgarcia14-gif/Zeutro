import { RESOURCES } from "@/lib/marketing/plan";
import { loadMarketingState } from "@/lib/marketing/state";
import { Card, Check, ErrorNotice, MigrationNotice, SectionTitle } from "../parts";

export const dynamic = "force-dynamic";

export default async function RecursosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await loadMarketingState();
  const back = "/admin/marketing/recursos";

  const groups = [...new Set(RESOURCES.map((r) => r.group))];
  const total = RESOURCES.length;
  const done = RESOURCES.filter((r) => state.checks.has(`res:${r.id}`)).length;

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <SectionTitle sub={`Todo se prepara UNA vez y se recorta mil veces. Progreso: ${done}/${total} listos.`}>
        Biblioteca de recursos
      </SectionTitle>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-[#00C781] transition-all" style={{ width: `${Math.round((done / total) * 100)}%` }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g) => {
          const items = RESOURCES.filter((r) => r.group === g);
          const gDone = items.filter((r) => state.checks.has(`res:${r.id}`)).length;
          return (
            <Card key={g}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{g}</p>
                <span className={`text-xs ${gDone === items.length ? "text-[#2fe3a5]" : "text-slate-500"}`}>{gDone}/{items.length}</span>
              </div>
              <div className="mt-2 space-y-0.5">
                {items.map((r) => (
                  <Check
                    key={r.id}
                    k={`res:${r.id}`}
                    checked={state.checks.has(`res:${r.id}`)}
                    label={r.label}
                    detail={[r.detail, r.path ? `📁 ${r.path}` : ""].filter(Boolean).join(" · ")}
                    back={back}
                    disabled={state.unavailable}
                  />
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <p className="text-sm font-semibold text-white">📼 Cómo grabar las pantallas (recordatorio)</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
          <li>• Usa la grabadora del PROPIO teléfono (menú rápido → “Grabar pantalla”), no la cámara apuntando al monitor.</li>
          <li>• Sesión con el usuario canónico de prueba (ya tiene datos creíbles; no re-sembrar).</li>
          <li>• Dedo LENTO y deliberado: el espectador sigue tu dedo.</li>
          <li>• Para build in public (#7, #26) sí vale cámara al monitor con el código: lo “sucio” suma autenticidad.</li>
          <li>• Regeneración por Playwright: <code className="font-mono text-xs">video-build/record-tour.mjs</code> (ver README de Marketing-Assets-Zentro).</li>
        </ul>
      </Card>
    </div>
  );
}
