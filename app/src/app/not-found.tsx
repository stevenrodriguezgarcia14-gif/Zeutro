import Link from "next/link";

/** 404 con marca: orienta al usuario en vez de dejarlo en una página en blanco. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Error 404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Esta página no existe</h1>
        <p className="mt-2 text-sm text-slate-600">
          Puede que el enlace haya cambiado o que lo que buscas se haya movido.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
