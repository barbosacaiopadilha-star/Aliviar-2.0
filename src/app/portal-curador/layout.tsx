import type { Metadata } from "next";

import { requireRole } from "@/modules/auth/guard";

import { PortalShell } from "@/components/curadoria/portal-shell";

export const metadata: Metadata = {
  title: { default: "Portal do Curador", template: "%s · Portal do Curador" },
  robots: { index: false, follow: false },
};

// MISSÃO 100 — Portal do Curador, sob o shell único da MISSÃO 206.
//
// Consolidação estrutural 2026-07-24: a última dependência de mock saiu — a
// identidade no cabeçalho agora é de quem está logado, não de uma persona.
// O guarda aqui também fecha um vão real: as páginas do Portal exigiam papel
// individualmente, mas o layout (que mostra nome e navegação) renderizava
// para qualquer sessão.
//
// Sem AppShell administrativo por decisão de método: o Portal não é um painel
// de administração (Experience §3), e o AppShell atual carrega a gramática
// visual de área autenticada genérica.

const NAV = [{ href: "/portal-curador", label: "Minhas Curadorias" }];

export default async function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await requireRole("curador_medico");

  return (
    <PortalShell
      homeHref="/portal-curador"
      subtitle="Portal do Curador"
      nav={NAV}
      identity={state.profile?.displayName ?? null}
    >
      {children}
    </PortalShell>
  );
}
