import { updatePassword } from "@/app/auth/actions";

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
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800">
            Guardar contraseña
          </button>
        </form>
      </div>
    </main>
  );
}
