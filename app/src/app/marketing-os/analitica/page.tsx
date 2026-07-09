import Link from "next/link";
import { FOUNDERS_TARGET } from "@/lib/marketing/plan";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { Card, EmptyState, MigrationNotice, PageHeader, SectionTitle, StatusChip } from "../parts";

export const dynamic = "force-dynamic";

function fmt(n: number | undefined): string {
  return n === undefined ? "—" : n.toLocaleString("es");
}

export default async function AnaliticaPage() {
  const state = await loadMarketingState();
  const published = VIDEOS.filter((v) => statusOf(state, v.id) === "publicado");
  const withMetrics = VIDEOS.map((v) => ({ v, m: state.metrics.get(v.id) })).filter((x) => x.m);

  const sum = (f: (m: NonNullable<(typeof withMetrics)[number]["m"]>) => number | undefined) =>
    withMetrics.reduce((acc, { m }) => acc + (f(m!) ?? 0), 0);

  const totals = { views: sum((m) => m.views), comments: sum((m) => m.comments), shares: sum((m) => m.shares), saves: sum((m) => m.saves), clicks: sum((m) => m.clicks) };

  const ranked = [...withMetrics]
    .filter((x) => x.m!.ret3s !== undefined || x.m!.views !== undefined)
    .sort((a, b) => (b.m!.ret3s ?? 0) - (a.m!.ret3s ?? 0) || (b.m!.views ?? 0) - (a.m!.views ?? 0));

  const funnel = [
    { label: "Visualizaciones", value: fmt(totals.views), hint: "Suma de lo anotado" },
    { label: "Clics al link", value: fmt(totals.clicks), hint: "Bios y DMs" },
    { label: "Registros ?ref", value: state.goal.registros, hint: "La métrica de verdad", green: true },
    { label: "Fundadores", value: `${state.goal.current} / ${FOUNDERS_TARGET}`, hint: "Onboarding 1-a-1 hecho", green: true },
  ];

  return (
    <div>
      <PageHeader
        title="Analítica"
        sub="Los números se anotan en la página de cada video, 24-48 h después de publicar. Views y likes = vanidad; retención 3 s y registros = verdad."
      />
      <MigrationNotice show={state.unavailable} />

      {/* Embudo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {funnel.map((f) => (
          <Card key={f.label} className={f.green ? "ring-[#00C781]/30" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{f.label}</p>
            <p className={`mt-1.5 font-display text-3xl font-bold tabular-nums tracking-tight ${f.green ? "text-[#3ee6a8]" : "text-white"}`}>{f.value}</p>
            <p className="mt-1 text-[11px] text-zinc-600">{f.hint}</p>
          </Card>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["Comentarios", totals.comments], ["Compartidos", totals.shares], ["Guardados", totals.saves], ["Publicados", published.length]] as const).map(([label, value]) => (
          <Card key={label} className="!p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
            <p className="mt-1 font-display text-xl font-bold tabular-nums text-white">{fmt(value)}</p>
          </Card>
        ))}
      </div>

      {/* Ranking */}
      <SectionTitle sub="El domingo: el formato #1 se graba 2 veces la próxima semana; el último se elimina sin piedad. No opiniones: datos.">
        Ranking por retención a 3 s
      </SectionTitle>
      {ranked.length === 0 ? (
        <EmptyState
          title="Aún no hay métricas anotadas"
          hint="Publica tu primer video, espera 24-48 h y guarda sus números desde su página — este ranking se arma solo."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
          <table className="w-full bg-white/[0.02] text-sm">
            <thead className="text-left text-zinc-500">
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Video</th>
                <th className="px-4 py-3 text-right font-medium">Ret. 3 s</th>
                <th className="px-4 py-3 text-right font-medium">Completan</th>
                <th className="px-4 py-3 text-right font-medium">Views</th>
                <th className="px-4 py-3 text-right font-medium">Coment.</th>
                <th className="px-4 py-3 text-right font-medium">Guardados</th>
                <th className="px-4 py-3 text-right font-medium">Clics</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {ranked.map(({ v, m }, i) => (
                <tr key={v.id} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <Link href={`/marketing-os/videos/${v.id}`} className="font-medium text-white hover:text-[#3ee6a8]">
                      {i === 0 && <span className="mr-1 text-[#3ee6a8]">①</span>}#{v.id} {v.title}
                    </Link>
                    {m!.notes && <p className="mt-0.5 text-xs text-zinc-500">{m!.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-display font-bold tabular-nums text-[#3ee6a8]">{m!.ret3s !== undefined ? `${m!.ret3s}%` : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{m!.completion !== undefined ? `${m!.completion}%` : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(m!.views)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(m!.comments)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(m!.saves)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-300">{fmt(m!.clicks)}</td>
                  <td className="px-4 py-3"><StatusChip status={statusOf(state, v.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="mt-6">
        <p className="font-display text-sm font-bold text-white">Metas por fase</p>
        <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-zinc-300">
          <li>· <b>Fase 1 (6-19 jul):</b> 15 registros con <code className="font-mono text-xs">?ref=fundadores</code> · identificar los 2 ganchos con mejor retención.</li>
          <li>· <b>Fase 2 (20 jul-9 ago):</b> 1 video &gt;10k views · +30 seguidores/semana · cupos llenos → lista de espera.</li>
          <li>· <b>Fase 3 (10-31 ago):</b> lista de espera &gt;30 · 2 testimonios en video de fundadores reales.</li>
        </ul>
      </Card>
    </div>
  );
}
