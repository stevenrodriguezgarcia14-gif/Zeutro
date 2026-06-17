"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CredentialReveal } from "@/components/academy/CredentialReveal";
import { markCelebrated } from "@/app/(app)/academy/actions";
import type { Tier } from "@/components/academy/Emblem";

/** Dispara la revelación cinemática UNA vez al obtener la credencial. */
export function CertObtainReveal(props: {
  show: boolean; token: string;
  title: string; holder: string; level: string; category: string;
  date?: string; serial?: string; tier: Tier; accent: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(props.show);
  if (!open) return null;
  return (
    <CredentialReveal
      title={props.title} holder={props.holder} level={props.level} category={props.category}
      date={props.date} serial={props.serial} tier={props.tier} accent={props.accent}
      onClose={() => {
        setOpen(false);
        startTransition(async () => { await markCelebrated([props.token]); router.refresh(); });
      }}
    />
  );
}
