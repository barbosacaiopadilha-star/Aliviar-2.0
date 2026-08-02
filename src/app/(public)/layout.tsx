import "@/app/landing-editorial.css";

import { PublicFooterGate } from "@/components/landing/public-footer-gate";
import { PublicHeaderContainer } from "@/components/landing/public-header-container";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="landing-editorial flex min-h-screen flex-col">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      <PublicHeaderContainer />

      <main id="conteudo-principal" className="flex-1">
        {children}
      </main>

      <PublicFooterGate />
    </div>
  );
}
