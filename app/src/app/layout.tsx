import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://zentro-ten-phi.vercel.app",
  ),
  title: "Zentro — El centro de control de tu negocio",
  description:
    "Clientes, ventas, cobros, compras y ganancias en un solo lugar. Y cada día, Zentro te dice qué hacer y qué cobrar. El sistema operativo para emprendedores.",
  keywords: [
    "sistema para emprendedores",
    "CRM para pequeños negocios",
    "control de cobros",
    "finanzas para emprendedores",
    "gestión de negocio",
    "facturación y cobranza",
  ],
  applicationName: "Zentro",
  openGraph: {
    title: "Zentro — El centro de control de tu negocio",
    description:
      "Controla clientes, ventas, cobros, compras, proyectos y ganancias desde un solo lugar.",
    type: "website",
    siteName: "Zentro",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zentro — El centro de control de tu negocio",
    description:
      "Clientes, ventas, cobros y ganancias en un solo lugar. Zentro te dice qué hacer y qué cobrar.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
