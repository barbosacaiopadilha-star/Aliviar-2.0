import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getAuthState } from "@/modules/auth/session";
import { canAccessCoaLevel } from "@/modules/coa/permissions";

export default async function CoaConciergeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const state = await getAuthState();
  if (!state) redirect("/login?next=/coa/concierge");

  const allowed =
    canAccessCoaLevel(state.roles, "CONCIERGE") || state.roles.includes("administrador");
  if (!allowed) redirect("/acesso-negado");

  const shellRole = state.roles.includes("administrador") ? "administrador" : "concierge";

  return (
    <AppShell
      role={shellRole}
      displayName={state.profile?.displayName ?? null}
      basePath="/coa/concierge"
      systemLabel="COA · Concierge"
    >
      {children}
    </AppShell>
  );
}
