import type { MetadataRoute } from "next";

/**
 * Web App Manifest: hace a Zentro instalable en el teléfono (pantalla de
 * inicio) sin pasar por tiendas de apps. Clave para el hábito diario del
 * emprendedor: un toque y está dentro, como cualquier app nativa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zentro — El centro de control de tu negocio",
    short_name: "Zentro",
    description:
      "Clientes, ventas, cobros y ganancias en un solo lugar. Zentro te dice qué hacer y qué cobrar.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#ffffff",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
