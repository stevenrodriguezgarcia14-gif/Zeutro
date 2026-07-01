"use client";

import { useEffect } from "react";

/** Pantalla de error global: mensaje claro en español y opción de reintentar. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-4xl">😕</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">Algo salió mal</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tus datos están a salvo. Fue un error momentáneo de la aplicación; intenta de nuevo.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-slate-400">Código de referencia: {error.digest}</p>
        )}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
