import { Fraunces, Inter } from "next/font/google";

import type { Metadata } from "next";
import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

import { SITE_URL } from "@/lib/site-url";
import { DESCRICAO_PADRAO, OG_IMAGE, SITE_NAME } from "@/lib/metadata-publica";

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
  description: DESCRICAO_PADRAO,
  // NÃO declare `alternates.canonical` aqui. O metadata do layout é herdado
  // por toda página que não o sobrescreve — um canônico "/" na raiz diria ao
  // buscador que /o-que-e e /solicitar-atendimento são cópias da home, e o
  // efeito de um canônico errado é justamente tirar a página do índice. Cada
  // página indexável declara o seu, ao lado do próprio título.

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
    description: DESCRICAO_PADRAO,
    // Sem `url` pela mesma razão do canônico: seria herdado por todas.
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRICAO_PADRAO,
    images: [OG_IMAGE.url],
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
