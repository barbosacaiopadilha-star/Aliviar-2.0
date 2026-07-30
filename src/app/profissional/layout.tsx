import { requireRole } from "@/modules/auth/guard";
import { AppShell } from "@/components/shell/app-shell";

export default async function ProfissionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("profissional");

  return (
    <AppShell
      role="profissional"
      displayName={profile?.displayName ?? null}
      basePath="/profissional"
    >
      {children}
    </AppShell>
  );
}
