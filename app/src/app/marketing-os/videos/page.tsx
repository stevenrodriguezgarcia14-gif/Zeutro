import { VIDEOS } from "@/lib/marketing/videos";
import { loadMarketingState, statusOf } from "@/lib/marketing/state";
import { MigrationNotice, PageHeader } from "../parts";
import { VideoExplorer } from "./explorer";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const state = await loadMarketingState();
  const rows = VIDEOS.map((v) => ({ v, status: statusOf(state, v.id) }));

  return (
    <div>
      <PageHeader
        title="Videos"
        sub="Los 60 del plan. Busca y filtra sin esperas; entra a cualquiera para ver su guion dirigido y marcar avances."
      />
      <MigrationNotice show={state.unavailable} />
      <VideoExplorer rows={rows} />
    </div>
  );
}
