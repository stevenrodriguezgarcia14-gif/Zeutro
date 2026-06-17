"use client";

import { useEffect } from "react";
import { Confetti } from "@/components/Confetti";
import { markCelebrated } from "@/app/(app)/academy/actions";

/** Muestra confeti una sola vez y registra el token como celebrado. */
export function OnceConfetti({ token }: { token: string }) {
  useEffect(() => {
    markCelebrated([token]);
  }, [token]);
  return <Confetti />;
}
