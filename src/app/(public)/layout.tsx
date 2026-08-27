import "@/app/landing-editorial.css";

import { AnalyticsGate } from "@/components/landing/analytics-gate";
import { PublicFooterGate } from "@/components/landing/public-footer-gate";
import { PublicHeaderContainer } from "@/components/landing/public-header-container";
import { PublicHeaderGate } from "@/components/landing/public-header-gate";

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

      {/* A5 · o topo da Fachada não entra na conversa. Em `/sua-historia` a
          paciente já veste a moldura da casa (`PatientShell`, A2B), e os dois
          cabeçalhos vinham empilhados. Mesmo gate do rodapé, logo abaixo. */}
      <PublicHeaderGate>
        <PublicHeaderContainer />
      </PublicHeaderGate>

      <main id="conteudo-principal" className="flex-1">
        {children}
      </main>

      <PublicFooterGate />

      {/* ADR-056 (D-10) item 2 · o analytics saiu do layout raiz e passa a
          viver aqui, sob lista de permissão. Ver `analytics-gate.tsx`. */}
      <AnalyticsGate />
    </div>
  );
}
