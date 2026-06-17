import Link from "next/link";
import { login, resendConfirmation } from "@/app/auth/actions";
import { PasswordInput } from "@/components/PasswordInput";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string; resend?: string }>;
}) {
  const { error, info, resend } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Zentro</h1>
        <p className="mt-1 text-sm text-slate-500">
          El sistema operativo de tu negocio
        </p>

        {info && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{info}</p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        {resend && (
          <form action={resendConfirmation} className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <input type="hidden" name="email" value={resend} />
            <p className="text-slate-600">¿No te llegó el correo de confirmación?</p>
            <button className="mt-2 w-full rounded-lg border border-slate-300 bg-white py-2 font-medium text-slate-700 hover:bg-slate-100">
              Reenviar correo a {resend}
            </button>
          </form>
        )}

        <form action={login} className="mt-6 space-y-4">
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
            <PasswordInput name="password" minLength={8} />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-3 text-center text-sm">
          <Link href="/forgot-password" className="text-slate-500 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-slate-900 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}
