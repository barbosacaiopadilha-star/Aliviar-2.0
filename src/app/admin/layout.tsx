import { requireRole } from "@/modules/auth/guard";
import { AppShell } from "@/components/shell/app-shell";
import { getDefaultNavItems } from "@/components/shell/nav-items";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("administrador");

  return (
    <AppShell
      role="administrador"
      displayName={profile?.displayName ?? null}
      navItems={getDefaultNavItems("/admin")}
    >
      {children}
    </AppShell>
  );
}
