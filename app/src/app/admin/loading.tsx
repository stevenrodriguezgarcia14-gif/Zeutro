// Skeleton del panel admin: el click a /admin responde al instante aunque
// las métricas globales tarden (RPCs pesadas + cold start).
export default function LoadingAdmin() {
  return (
    <div aria-busy="true" aria-label="Cargando administración" className="animate-pulse">
      <div className="h-8 w-72 max-w-full rounded-xl bg-slate-800" />
      <div className="mt-2 h-4 w-96 max-w-full rounded-lg bg-slate-800/60" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded-2xl bg-slate-900" />
    </div>
  );
}
