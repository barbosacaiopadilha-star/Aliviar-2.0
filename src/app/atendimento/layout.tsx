import type { Metadata } from "next";

import { requireAnyRole } from "@/modules/auth/guard";

import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";

export const metadata: Metadata = {
  title: { default: "Atendimento", template: "%s · Atendimento" },
  robots: { index: false, follow: false },
};

/**
 * Superfície do Atendente — Nível 1.
 *
 * @metodo Correção de Domínio §2 — o Atendente recebe o contato, qualifica, abre o Case e encaminha
 *
 * Até aqui o Atendente existia como papel no banco e não tinha por onde
 * trabalhar: quem chegava com esse papel caía na Landing pública, como se não
 * tivesse conta. Esta é a menor superfície que torna o Nível 1 real.
 *
 * O guarda é de navegação, não de segurança. A fronteira de dado continua
 * sendo a RLS — `can_access_crm_contact` e as funções de operação decidem o
 * que este usuário pode ver e fazer, mesmo que alguém chegue aqui por outro
 * caminho.
 */
export default async function AtendimentoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Administrador entra como supervisor (acesso global, §1 da Correção do
  // Administrador) — mas o ator padrão do fluxo continua sendo o Atendente.
  await requireAnyRole(["atendente", "administrador"]);

  return (
    <PortalShellContainer
      homeHref="/atendimento"
      subtitle="Atendimento"
      nav={[{ href: "/atendimento", label: "Meus leads" }]}
    >
      {children}
    </PortalShellContainer>
  );
}
