"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UnlockCelebration, type UnlockItem } from "@/components/academy/UnlockCelebration";
import { markCelebrated } from "@/app/(app)/academy/actions";

/** Recibe los logros recién desbloqueados (aún no celebrados) y los muestra una vez. */
export function AcademyNotifier({ unlocks }: { unlocks: UnlockItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items] = useState(unlocks);
  const [open, setOpen] = useState(unlocks.length > 0);
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
