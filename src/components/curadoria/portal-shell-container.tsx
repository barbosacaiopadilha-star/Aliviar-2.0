/**
 * Container server-side do Portal — resolve sessão autenticada.
 *
 * @metodo Fundamentos §13 — identidade do operador humano é sempre verificável
 * @metodo Experience §3 — o Curador vê quem ele é, não um mock
 *
 * Por que existe: separar resolução de sessão (server) da interação (client),
 * garantindo que o cabeçalho mostre o usuário real autenticado.
 */

import { PortalShell } from "@/components/curadoria/portal-shell";
import { PortalUserMenu } from "@/components/curadoria/portal-user-menu";
import { getAuthState } from "@/modules/auth/session";
import {
  resolveAuthenticatedDisplayName,
  resolvePrimaryRoleLabel,
} from "@/modules/auth/display-identity";

import type { PortalNavItem } from "./portal-shell";

type PortalShellContainerProps = {
  homeHref: string;
  subtitle: string;
  nav?: PortalNavItem[];
  children: React.ReactNode;
};

export async function PortalShellContainer({
  homeHref,
  subtitle,
  nav,
  children,
}: PortalShellContainerProps) {
  const auth = await getAuthState();

  const userMenu = auth ? (
    <PortalUserMenu
      displayName={resolveAuthenticatedDisplayName(auth)}
      roleLabel={resolvePrimaryRoleLabel(auth.roles)}
    />
  ) : null;

  return (
    <PortalShell homeHref={homeHref} subtitle={subtitle} nav={nav} userMenu={userMenu}>
      {children}
    </PortalShell>
  );
}
