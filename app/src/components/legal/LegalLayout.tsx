import Link from "next/link";
import { ZentroLogo } from "@/components/landing/Logo";

/**
 * Marco común para las páginas legales (Términos, Privacidad, Seguridad).
 * Tipografía legible sin depender del plugin de typography.
 */
export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-slate-900" aria-label="Inicio de Zentro">
            <ZentroLogo />
          </Link>
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {updated}</p>
        {intro && <p className="mt-6 text-lg text-slate-600">{intro}</p>}
        <div className="mt-8 space-y-2">{children}</div>

        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          ¿Dudas sobre estas condiciones? Escríbenos a{" "}
          <a href="mailto:zeutro.notificaciones@gmail.com" className="font-medium text-slate-900 hover:underline">
            zeutro.notificaciones@gmail.com
          </a>
          .
        </div>
      </main>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-xl font-bold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 leading-relaxed text-slate-600">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-slate-600">{children}</ul>;
}
