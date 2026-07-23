import Link from "next/link";

import type { Metadata } from "next";

import { CURRENT_CURATOR } from "@/modules/curadoria/portal/mock-data";

export const metadata: Metadata = {
  title: { default: "Portal do Curador", template: "%s · Portal do Curador" },
  robots: { index: false, follow: false },
};

// MISSÃO 100 — Portal do Curador, o ambiente onde acontece a Curadoria.
//
// Vive em rota própria (`/portal-curador`) enquanto usa dados mockados: o
// `/curador` atual exige autenticação real e leitura do banco, e a missão
// determina construir a experiência antes de integrar. Quando banco e
// autenticação entrarem, este Portal assume `/curador`.
//
// Sem AppShell administrativo por decisão de método: o Portal não é um painel
// de administração (Experience §3), e o AppShell atual carrega a gramática
// visual de área autenticada genérica.
export default function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <Link href="/portal-curador" className="group">
            <p className="font-serif text-lg leading-none text-brand-primary">Aliviar</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
              Portal do Curador
            </p>
          </Link>
          <p className="text-sm text-ink-muted">
            {CURRENT_CURATOR.displayName}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-content px-4 py-8 lg:px-8 lg:py-12">{children}</main>

      <footer className="mx-auto max-w-content px-4 pb-10 lg:px-8">
        <p className="border-t border-border pt-4 text-xs text-ink-muted">
          Ambiente de construção da experiência — dados de demonstração, sem integração com banco.
        </p>
      </footer>
    </div>
  );
}
