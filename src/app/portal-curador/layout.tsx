import type { Metadata } from "next";

import { requireAnyRole } from "@/modules/auth/guard";
import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";

export const metadata: Metadata = {
  title: { default: "Curadoria · COA", template: "%s · Curadoria · COA" },
  robots: { index: false, follow: false },
};

const NAV = [{ href: "/coa/curadoria", label: "Fila de Curadorias" }];

/**
 * O Administrador entra junto com o Curador — pelo mesmo motivo que já valeu
 * para `/atendimento` na certificação RC-1: guarda de navegação não pode ser
 * mais rígido que o domínio que ele apresenta. As ações de governança da Base
 * (verificar, resolver divergência, desatualizar, fechar solicitação) exigem
 * `administrador`, e a superfície delas vive aqui dentro. Com a porta fechada
 * a ele, nenhuma dessas ações tinha executor possível.
 *
 * Isto NÃO amplia o que cada um faz: as actions continuam checando o papel
 * uma a uma, e a RLS decide o que cada sessão enxerga. O que muda é só quem
 * consegue abrir a porta.
 */
export default async function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAnyRole(["curador_medico", "administrador"]);

  return (
    <PortalShellContainer
      homeHref="/coa/curadoria"
      subtitle="Curadoria · COA"
      nav={NAV}
      variant="curadoria"
    >
      {children}
    </PortalShellContainer>
  );
}
