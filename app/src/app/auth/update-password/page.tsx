import { updatePassword } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">Escribe tu nueva contraseña.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <form action={updatePassword} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <PasswordInput name="password" minLength={12} showStrength />
            <p className="mt-1 text-xs text-slate-400">Mínimo 12 caracteres. Usa una frase fácil de recordar y difícil de adivinar.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Repite la contraseña</label>
            <PasswordInput name="password2" minLength={12} />
          </div>
          <SubmitButton pendingText="Guardando…">Guardar contraseña</SubmitButton>
        </form>
      </div>
    </main>
  );
}
