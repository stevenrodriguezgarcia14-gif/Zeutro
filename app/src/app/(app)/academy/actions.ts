"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { getActivation } from "@/lib/activation";
import { CERTIFICATIONS, certRequirements } from "@/lib/academia";

async function record(kind: string, slug: string, status: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("academy_progress")
    .upsert({ user_id: user.id, kind, item_slug: slug, status }, { onConflict: "user_id,kind,item_slug" });
  revalidatePath("/academy");
}

/** Marca un desafío de escenario como aprobado. */
export async function passChallenge(slug: string): Promise<void> {
  await record("challenge", slug, "passed");
}

/** Marca una guía como leída. */
export async function markGuideRead(slug: string): Promise<void> {
  await record("guide", slug, "done");
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
  const read = new Set((progress ?? []).filter((p) => p.kind === "guide").map((p) => p.item_slug));
  const passed = new Set((progress ?? []).filter((p) => p.kind === "challenge").map((p) => p.item_slug));
  const earnedCerts = new Set((progress ?? []).filter((p) => p.kind === "certification").map((p) => p.item_slug));

  const { eligible } = certRequirements(cert, read, passed, act.data, earnedCerts);
  if (!eligible) return; // no se regala

  await supabase
    .from("academy_progress")
    .upsert({ user_id: user.id, kind: "certification", item_slug: slug, status: "earned" }, { onConflict: "user_id,kind,item_slug" });
  revalidatePath(`/academy/certificacion/${slug}`);
  revalidatePath("/academy/perfil");
}
