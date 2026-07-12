import { requireRole } from "@/modules/auth/guard";
import { AppShell } from "@/components/shell/app-shell";
import { getDefaultNavItems } from "@/components/shell/nav-items";

export default async function PacienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("paciente");

  return (
    <AppShell
      role="paciente"
      displayName={profile?.displayName ?? null}
      navItems={getDefaultNavItems("/paciente")}
    >
      {children}
    </AppShell>
  );
}
