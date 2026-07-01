/**
 * Skeleton instantáneo para todas las páginas de la app.
 * Se muestra dentro del AppShell mientras el servidor prepara los datos,
 * para que cada navegación dé feedback inmediato en vez de "congelarse".
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando…" className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="mt-2 h-4 w-72 rounded bg-slate-100" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-32 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}
