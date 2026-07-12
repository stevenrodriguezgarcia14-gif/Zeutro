"use client";

import { useEffect } from "react";
import { trackPwaEvent } from "@/app/(app)/pwa-actions";

/**
 * Beacon invisible de métricas PWA: detecta si Zentro corre instalado
 * (display-mode standalone) y escucha el evento de instalación. No
 * renderiza nada y falla en silencio: medir nunca estorba.
 */
export function PwaBeacon() {
  useEffect(() => {
    try {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (standalone) void trackPwaEvent("pwa_standalone");
    } catch {
      // sin soporte de matchMedia: no se mide y ya
    }
    const onInstalled = () => void trackPwaEvent("pwa_installed");
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);
  return null;
}
