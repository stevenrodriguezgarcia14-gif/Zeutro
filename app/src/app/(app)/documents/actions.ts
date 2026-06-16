"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

export async function saveDocument(name: string, file_path: string, mime_type: string, size_bytes: number) {
  const org = await getCurrentOrg();
  if (!org) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("documents").insert({
    organization_id: org.id,
    name,
    file_path,
    mime_type,
    size_bytes,
    created_by: user?.id,
  });
  revalidatePath("/documents");
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("doc_id") ?? "");
  const file_path = String(formData.get("file_path") ?? "");
  const supabase = await createClient();
  await supabase.storage.from("documents").remove([file_path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/documents");
}
