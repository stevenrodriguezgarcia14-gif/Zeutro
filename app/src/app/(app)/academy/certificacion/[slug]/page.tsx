import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { CERTIFICATIONS, certRequirements } from "@/lib/academia";
import { Confetti } from "@/components/Confetti";
import { Credential } from "@/components/academy/Credential";
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
  const serial = record ? String(record.id).replace(/-/g, "").slice(0, 10).toUpperCase() : undefined;
  const date = record ? new Date(record.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : undefined;
  const holder = org?.legal_name || org?.name || "Tu negocio";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/academy/perfil" className="text-sm text-slate-500 hover:text-slate-800">← Mi aprendizaje</Link>

      {earned && <Confetti />}

      <Credential
        title={cert.title} holder={holder} level={cert.level} category={cert.category}
        date={date} serial={serial} earned={earned} animate
      />

      {earned ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
          Felicidades. Dominas los fundamentos para que tu negocio gane de verdad — esta credencial lo respalda.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-slate-900">Requisitos</p>
            <p className="text-xs text-slate-500">Esta credencial no se regala: demuestra que sabes y que lo aplicas en tu negocio.</p>
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
              <button className="w-full rounded-xl py-3 font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ background: "linear-gradient(135deg,#b8860b,#e9c45a)" }}>
                Obtener mi credencial
              </button>
            </form>
          ) : (
            <Link href="/academy" className="block rounded-xl bg-slate-900 py-3 text-center font-medium text-white hover:bg-slate-800">
              Avanzar en la Academia
            </Link>
          )}
        </>
      )}
    </div>
  );
}
