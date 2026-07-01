"use client";

import { useFormStatus } from "react-dom";

/**
 * Botón de envío con feedback inmediato: al enviar el formulario se
 * deshabilita y muestra un spinner + texto de progreso, para que el usuario
 * sepa que algo está pasando mientras el servidor responde.
 */
export function SubmitButton({
  children,
  pendingText = "Un momento…",
  className = "w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          {pendingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
