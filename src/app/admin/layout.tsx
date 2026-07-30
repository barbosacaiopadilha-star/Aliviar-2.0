import { redirect } from "next/navigation";

import { getAuthState } from "@/modules/auth/session";
import { AppShell } from "@/components/shell/app-shell";

function resolveAdminRole(roles: string[]): string {
  if (roles.includes("administrador")) return "administrador";
  if (roles.includes("concierge")) return "concierge";
  return "concierge";
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const state = await getAuthState();
  if (!state) redirect("/login");

  const isAdmin = state.roles.includes("administrador");
  const isConcierge = state.roles.includes("concierge");

  if (!isAdmin && !isConcierge) {
    redirect("/acesso-negado");
  }

  const shellRole = resolveAdminRole(state.roles);

  return (
    <AppShell
      role={shellRole}
      displayName={state.profile?.displayName ?? null}
      basePath="/admin"
    >
      {children}
    </AppShell>
  );
}
