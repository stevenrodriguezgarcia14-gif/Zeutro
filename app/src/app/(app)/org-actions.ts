"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setActiveOrg(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  const c = await cookies();
  c.set("zentro_active_org", id, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
