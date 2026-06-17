"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UnlockCelebration, type UnlockItem } from "@/components/academy/UnlockCelebration";
import { markCelebrated } from "@/app/(app)/academy/actions";

/** Recibe los logros recién desbloqueados (aún no celebrados) y los muestra una vez. */
export function AcademyNotifier({ unlocks }: { unlocks: UnlockItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items] = useState(unlocks);
  const [open, setOpen] = useState(unlocks.length > 0);

  // Precarga el chunk 3D en segundo plano para que la celebración no se congele.
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    const run = () => { void import("@/components/academy/Coin3DGL"); };
    const id = w.requestIdleCallback ? w.requestIdleCallback(run) : window.setTimeout(run, 1200);
    return () => { if (w.cancelIdleCallback) w.cancelIdleCallback(id); else clearTimeout(id); };
  }, []);

  if (!open || items.length === 0) return null;

  return (
    <UnlockCelebration
      items={items}
      onDone={() => {
        setOpen(false);
        startTransition(async () => {
          await markCelebrated(items.map((i) => i.slug));
          router.refresh();
        });
      }}
    />
  );
}
