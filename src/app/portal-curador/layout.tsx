import type { Metadata } from "next";

import { PortalShell } from "@/components/curadoria/portal-shell";
import { CURRENT_CURATOR } from "@/modules/curadoria/portal/mock-data";

export const metadata: Metadata = {
  title: { default: "Portal do Curador", template: "%s · Portal do Curador" },
  robots: { index: false, follow: false },
};

// MISSÃO 100 — Portal do Curador, sob o shell único da MISSÃO 206.
//
// Vive em rota própria (`/portal-curador`) enquanto usa dados mockados: o
// `/curador` atual exige autenticação real e leitura do banco, e a missão
// determina construir a experiência antes de integrar. Quando banco e
// autenticação entrarem, este Portal assume `/curador`.
//
// Sem AppShell administrativo por decisão de método: o Portal não é um painel
// de administração (Experience §3), e o AppShell atual carrega a gramática
// visual de área autenticada genérica.

const NAV = [{ href: "/portal-curador", label: "Minhas Curadorias" }];

export default function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell
      homeHref="/portal-curador"
      subtitle="Portal do Curador"
      nav={NAV}
      identity={CURRENT_CURATOR.displayName}
    >
      {children}
    </PortalShell>
  );
}
