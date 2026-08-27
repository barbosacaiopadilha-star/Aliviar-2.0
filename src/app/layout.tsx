import { Fraunces, Inter } from "next/font/google";

import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

import { SITE_URL } from "@/lib/site-url";

const SITE_NAME = "Aliviar Curadoria Médica";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: "Curadoria médica e de cuidado independente — conectando pessoas a profissionais de confiança, sem posição paga.",
  // O ícone era um placeholder: um quadrado verde-azulado com as letras
  // "AC" — a aba do navegador de todo visitante mostrava isso em vez da
  // marca (achado da varredura de 23/08). Agora é o símbolo da Aliviar
  // sobre o linho da casa, gerado do logotipo isolado.
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "Curadoria médica e de cuidado independente — conectando pessoas a profissionais de confiança, sem posição paga.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
