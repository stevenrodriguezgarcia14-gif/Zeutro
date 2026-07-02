import Link from "next/link";

/**
 * Búsqueda por URL (?q=) sin JavaScript: un formulario GET que el servidor
 * filtra. Funciona con navegación normal, es enlazable y no pesa en el bundle.
 */
export function SearchBox({
  action,
  q,
  placeholder = "Buscar…",
}: {
  action: string;
  q?: string;
  placeholder?: string;
}) {
  return (
    <form action={action} method="get" className="flex items-center gap-2">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
      </div>
      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        Buscar
      </button>
      {q && (
        <Link href={action} className="text-sm text-slate-500 hover:underline">
          Limpiar
        </Link>
      )}
    </form>
  );
}
