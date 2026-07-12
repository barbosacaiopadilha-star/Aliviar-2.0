import { requireRole } from "@/modules/auth/guard";
import { AppShell } from "@/components/shell/app-shell";
import { getDefaultNavItems } from "@/components/shell/nav-items";

// Segmento real (ADR-009), não route group — o papel "Curador Médico" é
// distinto de "Administrador" mesmo quando a mesma pessoa acumula os dois
// (papéis cumulativos, ADR-006/docs/PRODUCT_ARCHITECTURE.md §17).
export default async function CuradorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await requireRole("curador_medico");

  return (
    <AppShell
      role="curador_medico"
      displayName={profile?.displayName ?? null}
      navItems={getDefaultNavItems("curador_medico", "/curador")}
    >
      {children}
    </AppShell>
  );
}
