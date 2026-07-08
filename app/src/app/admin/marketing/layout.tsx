import type { Metadata } from "next";
import { MarketingNav } from "./ui";

export const metadata: Metadata = { title: "Marketing OS · Zentro" };

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Marketing OS <span className="text-[#00C781]">·</span> Usuarios Fundadores
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Tu centro de operación diario. Los documentos de <code className="font-mono">Marketing-Assets-Zentro/</code> quedan solo como respaldo.
          </p>
        </div>
      </div>
      <div className="sticky top-0 z-10 -mx-6 mt-4 border-b border-slate-800 bg-slate-950/95 px-6 py-2 backdrop-blur">
        <MarketingNav />
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}
