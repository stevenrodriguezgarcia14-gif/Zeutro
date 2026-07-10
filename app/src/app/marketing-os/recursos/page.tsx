import Link from "next/link";
import { RESOURCES } from "@/lib/marketing/plan";
import { MEDIA, MEDIA_ROOT, captureBatches } from "@/lib/marketing/media";
import type { MediaAsset } from "@/lib/marketing/types";
import { loadMarketingState } from "@/lib/marketing/state";
import { CheckItem } from "../client";
import { IconAlert, IconCamera, IconClock, IconFilm, IconImage, IconTag } from "../icons";
import { Card, MigrationNotice, PageHeader, SectionTitle } from "../parts";

export const dynamic = "force-dynamic";

const KIND_ICON = { clip: IconFilm, video: IconFilm, grafico: IconImage, logo: IconTag, qr: IconTag, fisico: IconCamera } as const;

const STATUS_CHIP: Record<MediaAsset["status"], string> = {
  listo: "bg-[#00C781]/12 text-[#3ee6a8] ring-[#00C781]/25",
  pendiente: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  archivado: "bg-white/[0.05] text-zinc-500 ring-white/[0.08]",
};

function AssetCard({ asset }: { asset: MediaAsset }) {
  const Icon = KIND_ICON[asset.kind];
  const fullPath = `${MEDIA_ROOT}/${asset.path === "." ? "" : asset.path + "/"}${asset.file ?? ""}`;
  return (
    <div className={`flex flex-col rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.07] ${asset.status === "archivado" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
          {asset.name}
        </p>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${STATUS_CHIP[asset.status]}`}>
          {asset.status}
        </span>
      </div>
      <p className="mt-1.5 select-all break-all font-mono text-[10px] text-zinc-500">📁 {fullPath}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {asset.durationSec && (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-zinc-400 ring-1 ring-white/[0.06]">
            <IconClock className="h-3 w-3" /> {asset.durationSec} s
          </span>
        )}
        {asset.resolution && <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-zinc-400 ring-1 ring-white/[0.06]">{asset.resolution}</span>}
        {asset.orientation && <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-zinc-400 ring-1 ring-white/[0.06]">{asset.orientation}</span>}
        {asset.tags.slice(0, 3).map((t) => <span key={t} className="rounded-md px-1.5 py-0.5 text-zinc-600 ring-1 ring-white/[0.05]">#{t}</span>)}
      </div>
      {asset.notes && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{asset.notes}</p>}
      {asset.usedIn.length > 0 && (
        <div className="mt-2.5 border-t border-white/[0.05] pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">Se usa en</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {asset.usedIn.map((u, i) =>
              u.videoId === 0 ? (
                <span key={i} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-400 ring-1 ring-white/[0.06]">todos los videos</span>
              ) : (
                <Link key={i} href={`/marketing-os/videos/${u.videoId}`} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-zinc-300 ring-1 ring-white/[0.06] transition hover:text-[#3ee6a8] hover:ring-[#00C781]/30" title={`${u.cue} — ${u.purpose}`}>
                  video #{u.videoId}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function BibliotecaPage() {
  const state = await loadMarketingState();
  const listos = MEDIA.filter((a) => a.status === "listo");
  const pendientes = MEDIA.filter((a) => a.status === "pendiente");
  const batches = captureBatches();
  const categories = [...new Set(MEDIA.filter((a) => a.status !== "pendiente").map((a) => a.category))];
  const equipo = [...new Set(RESOURCES.map((r) => r.group))];

  return (
    <div>
      <PageHeader
        title="Biblioteca Multimedia"
        sub={`${listos.length} recursos listos · ${pendientes.length} pendientes. Los archivos viven en OneDrive y ya están LOCALES en tu PC (Documentos/OneDrive → sistema para emprendedores → ${MEDIA_ROOT}) — en CapCut Desktop: Multimedia → Importar → esa carpeta. Los clips se generan solos y llegan en 1080×1920, listos para arrastrar.`}
      />
      <MigrationNotice show={state.unavailable} />

      {/* Plan de captura por lotes (lo único que falta) */}
      <SectionTitle sub="Todo lo demás ya existe. Agrupado para aprovechar cada contexto: una sesión = varios recursos. Marca cada uno al guardarlo en su carpeta.">
        Lo único pendiente · plan de captura por lotes
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...batches.entries()].map(([batch, assets]) => {
          const total = assets.reduce((a, x) => a + (x.capture?.estMin ?? 0), 0);
          return (
            <Card key={batch}>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-white">{batch}</p>
                <span className="text-[11px] text-zinc-500">≈{total} min en total</span>
              </div>
              <div className="mt-3 space-y-3">
                {assets.map((a) => (
                  <div key={a.id} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CheckItem
                          k={`res:${a.id}`}
                          initial={state.checks.has(`res:${a.id}`)}
                          label={a.name}
                          disabled={state.unavailable}
                        />
                      </div>
                      <span className={`mt-1 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] ring-1 ${a.capture?.priority === "alta" ? "bg-rose-500/10 text-rose-300 ring-rose-500/25" : "bg-white/[0.05] text-zinc-500 ring-white/[0.08]"}`}>
                        {a.capture?.priority} · {a.capture?.estMin} min
                      </span>
                    </div>
                    <p className="mt-1 pl-9 text-xs leading-relaxed text-zinc-500">{a.capture?.how}</p>
                    {a.usedIn.length > 0 && (
                      <p className="mt-1.5 pl-9 text-[11px] text-zinc-600">
                        Para: {a.usedIn.map((u) => (u.videoId === 0 ? "todos" : `#${u.videoId}`)).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Galería por categoría */}
      {categories.map((cat) => {
        const items = MEDIA.filter((a) => a.category === cat && a.status !== "pendiente");
        return (
          <div key={cat}>
            <SectionTitle>{cat} · {items.filter((i) => i.status === "listo").length} listos</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((a) => <AssetCard key={a.id} asset={a} />)}
            </div>
          </div>
        );
      })}

      {/* Equipo y audio */}
      <SectionTitle sub="Lo físico y las búsquedas de audio en CapCut (biblioteca gratuita).">Equipo y audio</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {equipo.map((g) => (
          <Card key={g}>
            <p className="font-display text-sm font-bold text-white">{g}</p>
            <div className="mt-2 space-y-0.5">
              {RESOURCES.filter((r) => r.group === g).map((r) => (
                <CheckItem
                  key={r.id}
                  k={`res:${r.id}`}
                  initial={state.checks.has(`res:${r.id}`)}
                  label={r.label}
                  detail={r.detail}
                  disabled={state.unavailable}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-white">
          <IconAlert className="h-4 w-4 text-zinc-500" /> Cómo se regeneran los clips de app
        </p>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Los clips de pantalla NO se graban a mano: <code className="font-mono text-zinc-400">video-build/capture-library.mjs</code> graba
          la app real en 9:16 (usuario de prueba con datos) y <code className="font-mono text-zinc-400">prepare-library.mjs</code> los deja en
          MP4 1080×1920 listos para CapCut, con miniatura en <code className="font-mono text-zinc-400">Biblioteca/miniaturas/</code>. Cuando la
          app cambie de diseño, pide en el chat: <i className="text-zinc-400">“regenera los clips de la Biblioteca”</i>.
        </p>
      </Card>
    </div>
  );
}
