// Skeleton instantáneo: cualquier click en la navegación responde en <100 ms
// con esta estructura mientras el servidor prepara la página real.
export default function LoadingOS() {
  return (
    <div aria-busy="true" aria-label="Cargando módulo" className="animate-pulse">
      <div className="h-8 w-44 rounded-xl bg-white/[0.06]" />
      <div className="mt-2 h-4 w-72 max-w-full rounded-lg bg-white/[0.04]" />
      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        <div className="h-44 rounded-2xl bg-white/[0.04] lg:col-span-2" />
        <div className="h-44 rounded-2xl bg-white/[0.04]" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-white/[0.03]" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  );
}
