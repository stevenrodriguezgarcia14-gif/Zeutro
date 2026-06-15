import Link from "next/link";
import { register } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta en Zentro</h1>
        <p className="mt-1 text-sm text-slate-500">Empieza a ordenar tu negocio hoy.</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <form action={register} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Tu nombre</label>
            <input
              name="full_name"
              type="text"
              required
              placeholder="¿Cómo te llamas?"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Correo</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <PasswordInput name="password" minLength={8} showStrength />
            <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Repite la contraseña</label>
            <PasswordInput name="password2" minLength={8} />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-slate-900 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
