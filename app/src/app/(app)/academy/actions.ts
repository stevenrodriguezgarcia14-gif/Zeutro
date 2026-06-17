"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { CERTIFICATIONS, certRequirements, gradeScenario } from "@/lib/academia";

/** Califica un escenario en el SERVIDOR y registra el aprobado si es correcto. */
export async function submitScenario(id: string, optionIndex: number) {
  const grade = gradeScenario(id, optionIndex);
  if (!grade) return null;

  if (grade.correct) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("academy_progress")
        .upsert({ user_id: user.id, kind: "challenge", item_slug: id, status: "passed" }, { onConflict: "user_id,kind,item_slug" });
      revalidatePath("/academy");
      revalidatePath("/academy/perfil");
    }
  }
  return grade;
}

/** Marca logros/eventos como ya celebrados, para no repetir la animación. */
export async function markCelebrated(slugs: string[]): Promise<void> {
  if (!slugs || slugs.length === 0) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const rows = slugs.map((s) => ({ user_id: user.id, kind: "celebrated", item_slug: s, status: "seen" }));
  await supabase.from("academy_progress").upsert(rows, { onConflict: "user_id,kind,item_slug" });
}

/** Otorga una certificación SOLO si el usuario cumple los requisitos (verificado en servidor). */
export async function earnCertification(slug: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const cert = CERTIFICATIONS.find((c) => c.slug === slug);
  if (!cert) return;

  const org = await getCurrentOrg();
  const [{ data: progress }, act] = await Promise.all([
    supabase.from("academy_progress").select("kind, item_slug"),
    getActivation(org?.business_type),
  ]);
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const earnedCerts = new Set((progress ?? []).filter((p) => p.kind === "certification").map((p) => p.item_slug));

  const { eligible } = certRequirements(cert, passed, act.data, earnedCerts);
  if (!eligible) return; // no se regala

  await supabase
    .from("academy_progress")
    .upsert({ user_id: user.id, kind: "certification", item_slug: slug, status: "earned" }, { onConflict: "user_id,kind,item_slug" });
  revalidatePath(`/academy/certificacion/${slug}`);
  revalidatePath("/academy/perfil");
}
