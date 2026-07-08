import Link from "next/link";
import { FOUNDERS_TARGET, REF_LINK } from "@/lib/marketing/plan";
import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { Card, ErrorNotice, MigrationNotice, SectionTitle, StatusPill } from "../parts";

export const dynamic = "force-dynamic";

function fmt(n: number | undefined): string {
  if (n === undefined) return "—";
  return n.toLocaleString("es");
}

export default async function AnaliticaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const state = await loadMarketingState();

  const published = VIDEOS.filter((v) => statusOf(state, v.id) === "publicado");
  const withMetrics = VIDEOS.map((v) => ({ v, m: state.metrics.get(v.id) })).filter((x) => x.m);

  const sum = (f: (m: NonNullable<(typeof withMetrics)[number]["m"]>) => number | undefined) =>
    withMetrics.reduce((acc, { m }) => acc + (f(m!) ?? 0), 0);

  const totals = {
    views: sum((m) => m.views),
    comments: sum((m) => m.comments),
    shares: sum((m) => m.shares),
    saves: sum((m) => m.saves),
    clicks: sum((m) => m.clicks),
  };

  // Ranking por retención a 3 s (la métrica que decide el mix del domingo).
  const ranked = [...withMetrics]
    .filter((x) => x.m!.ret3s !== undefined || x.m!.views !== undefined)
    .sort((a, b) => (b.m!.ret3s ?? 0) - (a.m!.ret3s ?? 0) || (b.m!.views ?? 0) - (a.m!.views ?? 0));

  const funnel: { label: string; value: number | string; hint: string }[] = [
    { label: "Visualizaciones totales", value: fmt(totals.views), hint: "Suma de lo anotado por video" },
    { label: "Clics al link", value: fmt(totals.clicks), hint: "De las bios y los DMs" },
    { label: "Registros ?ref=fundadores", value: state.goal.registros, hint: "La métrica de verdad" },
    { label: "Usuarios Fundadores", value: `${state.goal.current} / ${FOUNDERS_TARGET}`, hint: "Onboarding 1-a-1 hecho" },
  ];

  return (
    <div>
      <MigrationNotice show={state.unavailable} />
      <ErrorNotice error={error} />

      <SectionTitle sub="Sin conexión automática a las redes (sus APIs exigen auditoría): anota los números 24-48 h después de publicar, desde la página de cada video. Views y likes = vanidad; retención 3 s y registros = verdad.">
        Analítica
      </SectionTitle>

      {/* Embudo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {funnel.map((f, i) => (
          <Card key={f.label} className={i === funnel.length - 1 ? "border-[#00C781]/50" : ""}>
            <p className="text-xs text-slate-500">{f.label}</p>
            <p className={`mt-1 text-2xl font-bold ${i >= 2 ? "text-[#2fe3a5]" : "text-white"}`}>{f.value}</p>
            <p className="mt-1 text-[11px] text-slate-600">{f.hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Comentarios", totals.comments],
            ["Compartidos", totals.shares],
            ["Guardados", totals.saves],
            ["Videos publicados", published.length],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} className="!p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-white">{fmt(value)}</p>
          </Card>
        ))}
      </div>

      {/* Ranking */}
      <SectionTitle sub="El domingo: el formato #1 se graba 2 veces la próxima semana; el último se elimina sin piedad. No opiniones: datos.">
        Ranking por retención a 3 s
      </SectionTitle>
      {ranked.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">
            Aún no hay métricas anotadas. Después de publicar tu primer video, entra a su página en la{" "}
            <Link href="/admin/marketing/biblioteca" className="text-[#2fe3a5] underline">Biblioteca</Link> y guarda sus números —
            este ranking se arma solo.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-400">
              <tr className="border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800">
              {ranked.map(({ v, m }, i) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/marketing/biblioteca/${v.id}`} className="font-medium text-white hover:text-[#2fe3a5]">
                      {i === 0 && "🏆 "}#{v.id} {v.title}
                    </Link>
                    {m!.notes && <p className="text-xs text-slate-500">{m!.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[#2fe3a5]">{m!.ret3s !== undefined ? `${m!.ret3s}%` : "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{m!.completion !== undefined ? `${m!.completion}%` : "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(m!.views)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(m!.comments)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(m!.saves)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(m!.clicks)}</td>
                  <td className="px-4 py-3"><StatusPill status={statusOf(state, v.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Card className="mt-6">
        <p className="text-sm font-semibold text-white">Metas por fase (auditoría de la estrategia)</p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300">
          <li>• <b>Fase 1 (6-19 jul):</b> 15 registros con <code className="font-mono text-xs">{REF_LINK.split("/register")[0]}/register?ref=fundadores</code> · identificar los 2 ganchos con mejor retención.</li>
          <li>• <b>Fase 2 (20 jul-9 ago):</b> 1 video &gt;10k views · +30 seguidores/semana · cupos llenos → lista de espera.</li>
          <li>• <b>Fase 3 (10-31 ago):</b> lista de espera &gt;30 · 2 testimonios en video de fundadores reales.</li>
        </ul>
      </Card>
    </div>
  );
}
