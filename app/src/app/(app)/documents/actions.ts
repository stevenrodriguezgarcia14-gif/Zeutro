"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";

/**
 * Guarda el archivo ya subido al bucket y, si viene de la ficha de un
 * cliente o de un trabajo, lo deja ligado a esa entidad.
 *
 * Las columnas `entity_type`/`entity_id` existen desde la migración 0014,
 * pero ninguna pantalla las llenaba: todo caía en una lista plana del
 * negocio. El Centro de Orientación ya le prometía al usuario que podía
 * asociar documentos a clientes y proyectos; ahora es cierto.
 */
export async function saveDocument(
  name: string,
  file_path: string,
  mime_type: string,
  size_bytes: number,
  entity_type?: string,
  entity_id?: string,
) {
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
    entity_type: entity_type ?? null,
    entity_id: entity_id ?? null,
    created_by: user?.id,
  });
  revalidatePath("/documents");
  if (entity_type === "project" && entity_id) revalidatePath(`/projects/${entity_id}`);
  if (entity_type === "customer" && entity_id) revalidatePath(`/customers/${entity_id}`);
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("doc_id") ?? "");
  const supabase = await createClient();
  // La ruta del archivo se deriva en el servidor desde la fila (respeta RLS),
  // nunca del cliente: así no se puede manipular para borrar otro objeto.
  const { data: doc } = await supabase.from("documents").select("file_path, entity_type, entity_id").eq("id", id).single();
  if (!doc) return;
  await supabase.storage.from("documents").remove([doc.file_path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/documents");
  if (doc.entity_type === "project" && doc.entity_id) revalidatePath(`/projects/${doc.entity_id}`);
  if (doc.entity_type === "customer" && doc.entity_id) revalidatePath(`/customers/${doc.entity_id}`);
  const redirectTo = String(formData.get("redirect_to") ?? "");
  if (redirectTo) redirect(redirectTo);
}
