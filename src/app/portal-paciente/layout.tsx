import type { Metadata } from "next";

import { requireRole } from "@/modules/auth/guard";

import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";

export const metadata: Metadata = {
  title: { default: "Minha Jornada", template: "%s · Aliviar" },
  robots: { index: false, follow: false },
};

// MISSÃO 205 — JORNADA DO PACIENTE, sob o shell único da MISSÃO 206.
//
// Vive em rota própria (`/portal-paciente`) enquanto usa dados de
// demonstração — o `/paciente` atual exige autenticação real e lê o banco.
// Quando a integração acontecer, esta Jornada assume `/paciente`.
//
// A navegação é a própria jornada, não um menu de funcionalidades: os rótulos
// são o que o paciente vive ("Minha Jornada", "Minhas prioridades"), nunca o
// nome interno da entidade (Experience §7 — a voz do Portal).

const NAV = [
  { href: "/portal-paciente", label: "Minha Jornada" },
  { href: "/portal-paciente/prioridades", label: "Minhas prioridades" },
  { href: "/portal-paciente/como-funciona", label: "Como está sendo feita" },
];

// BUG CRÍTICO corrigido (2026-07-24): esta é a home do papel `paciente`, e o
// layout renderizava sem identidade e SEM SAÍDA — quem entrava não tinha como
// encerrar a sessão. O container resolve a sessão real e monta o mesmo menu
// de usuário de toda a plataforma (nome, papel, alterar senha, Sair).
export default async function PortalPacienteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole("paciente");

  return (
    <PortalShellContainer
      homeHref="/portal-paciente"
      subtitle="Curadoria Médica"
      nav={NAV}
      variant="patient"
    >
      {children}
    </PortalShellContainer>
  );
}
