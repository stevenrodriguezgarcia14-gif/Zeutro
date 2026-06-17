import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { CERTIFICATIONS, certRequirements } from "@/lib/academia";
import { Confetti } from "@/components/Confetti";
import { earnCertification } from "../../actions";

export default async function CertificationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cert = CERTIFICATIONS.find((c) => c.slug === slug);
  if (!cert) notFound();

  const org = await getCurrentOrg();
  const supabase = await createClient();
  const [{ data: progress }, { data: record }, act] = await Promise.all([
    supabase.from("academy_progress").select("kind, item_slug"),
    supabase.from("academy_progress").select("id, created_at").eq("kind", "certification").eq("item_slug", slug).maybeSingle(),
    getActivation(org?.business_type),
  ]);
  const read = new Set((progress ?? []).filter((p) => p.kind === "guide").map((p) => p.item_slug));
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const { reqs, eligible } = certRequirements(cert, read, passed, act.data);

  const earned = !!record;
  const serial = record ? String(record.id).replace(/-/g, "").slice(0, 10).toUpperCase() : "";
  const date = record ? new Date(record.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "";
  const holder = org?.legal_name || org?.name || "Tu negocio";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/academy/perfil" className="text-sm text-slate-500 hover:text-slate-800">← Mi aprendizaje</Link>

      {earned ? (
        <>
          <Confetti />
          {/* Diploma */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50 p-8 text-center shadow-lg">
            <div className="absolute inset-3 rounded-2xl border border-amber-200" aria-hidden />
            <div className="relative">
              <p className="text-3xl">🎓</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Certificación Zentro Academy</p>
              <h1 className="mt-3 text-2xl font-bold text-slate-900">{cert.title}</h1>
              <p className="mt-4 text-sm text-slate-500">Otorgada a</p>
              <p className="text-lg font-semibold text-slate-900">{holder}</p>
              <p className="mx-auto mt-4 max-w-md text-sm text-slate-600">{cert.desc}</p>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
                <span>Fecha: <b className="text-slate-700">{date}</b></span>
                <span>Folio: <b className="font-mono text-slate-700">{serial}</b></span>
              </div>
              <p className="mt-4 text-xs italic text-slate-400">Zentro Academy · Sistema operativo para emprendedores</p>
            </div>
          </div>
          <p className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
            🎉 ¡Felicidades! Dominas los fundamentos para que tu negocio gane de verdad.
          </p>
        </>
      ) : (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-3xl opacity-40">🎓</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{cert.title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{cert.desc}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Requisitos</p>
            <p className="text-xs text-slate-500">Esta certificación no se regala: hay que demostrar que sabes y que lo aplicas.</p>
            <ul className="mt-3 space-y-2">
              {reqs.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${r.met ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{r.met ? "✓" : ""}</span>
                  <span className={r.met ? "text-slate-500 line-through" : "text-slate-700"}>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {eligible ? (
            <form action={earnCertification.bind(null, slug)}>
              <button className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600">
                🎓 Obtener mi certificación
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-600">
                Completa los requisitos para desbloquear tu certificación. Avanza en la Academia.
              </p>
              <Link href="/academy" className="block rounded-xl bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-800">
                Ir a la Academia
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
