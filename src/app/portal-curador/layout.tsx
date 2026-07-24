import type { Metadata } from "next";

import { PortalShell } from "@/components/curadoria/portal-shell";
import { CURRENT_CURATOR } from "@/modules/curadoria/portal/mock-data";

export const metadata: Metadata = {
  title: { default: "Curadoria · COA", template: "%s · Curadoria · COA" },
  robots: { index: false, follow: false },
};

// Centro de Operações Aliviar — Nível 2: Curadoria.
// Reutiliza toda a implementação COS/Mesa existente; a URL canônica é
// /coa/curadoria (rewrite interno para estas rotas).

const NAV = [{ href: "/coa/curadoria", label: "Fila de Curadorias" }];

export default function PortalCuradorLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <PortalShell
      homeHref="/coa/curadoria"
      subtitle="Curadoria · COA"
      nav={NAV}
      identity={CURRENT_CURATOR.displayName}
    >
      {children}
    </PortalShell>
  );
}
