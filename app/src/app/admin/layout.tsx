import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Zentro</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">Administración</span>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">← Volver a la app</Link>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
