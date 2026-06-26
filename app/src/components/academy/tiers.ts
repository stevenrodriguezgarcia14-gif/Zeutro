// Módulo plano (sin "use client"): tipos y etiquetas de tier seguros de usar
// tanto en componentes de servidor como de cliente.
export type Tier = "bronce" | "plata" | "oro" | "platino";

const LABELS: Record<Tier, string> = {
  bronce: "Bronce",
  plata: "Plata",
  oro: "Oro",
  platino: "Platino",
};

export const TIER_LABEL = (t: Tier): string => LABELS[t];
