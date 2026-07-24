import type { Metadata } from "next";

import { requireRole } from "@/modules/auth/guard";
import { PortalShellContainer } from "@/components/curadoria/portal-shell-container";

export const metadata: Metadata = {
  title: { default: "Curadoria · COA", template: "%s · Curadoria · COA" },
  robots: { index: false, follow: false },
};

const NAV = [{ href: "/coa/curadoria", label: "Fila de Curadorias" }];

export default async function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("curador_medico");

  return (
    <PortalShellContainer homeHref="/coa/curadoria" subtitle="Curadoria · COA" nav={NAV}>
      {children}
    </PortalShellContainer>
  );
}
