"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { saveProductImage } from "@/app/(app)/products/[id]/actions";

export function ProductImageUploader({ productId, currentUrl }: { productId: string; currentUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 3 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${productId}/img-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      await saveProductImage(productId, data.publicUrl);
      setUrl(data.publicUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {url ? (
          <Image src={url} alt="Producto" width={96} height={96} className="h-full w-full object-cover" unoptimized />
        ) : (
          <span className="text-xs text-slate-400">Sin foto</span>
        )}
      </div>
      <div>
        <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {busy ? "Subiendo…" : "Subir foto"}
          <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={busy} />
        </label>
        <p className="mt-1 text-xs text-slate-400">PNG o JPG, máx. 3 MB.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
