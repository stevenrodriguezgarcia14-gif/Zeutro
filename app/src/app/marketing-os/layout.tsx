import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav, Sidebar } from "./nav";

export const metadata: Metadata = { title: "Marketing OS · Zentro" };

// Shell del Marketing OS: espacio propio, fuera del panel admin, con la misma
// puerta (solo platform admin). Sidebar en escritorio, barra inferior en móvil.
export default async function MarketingOSLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/dashboard");

  return (
    <div className="mkos min-h-dvh bg-[#0a0d0c] text-zinc-200 antialiased">
      {/* Fondo con carácter: glow de marca, sutil, fijo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-[#00C781]/[0.07] blur-[120px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-violet-500/[0.05] blur-[110px]" />
      </div>
      <style>{`
        @keyframes mkos-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes mkos-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .mkos-enter { animation: mkos-in .3s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .mkos-enter { animation: none; }
        }
        .mkos ::selection { background: #00C78155; }
      `}</style>
      <Sidebar />
      <BottomNav />
      <main className="relative z-10 mx-auto min-h-dvh w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:pl-[17rem] lg:pr-8 lg:pb-10">
        <div className="mkos-enter">{children}</div>
      </main>
    </div>
  );
}
