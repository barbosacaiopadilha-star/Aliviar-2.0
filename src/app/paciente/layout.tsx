import { requireRole } from "@/modules/auth/guard";
import { resolveAuthenticatedDisplayName, resolvePrimaryRoleLabel } from "@/modules/auth/display-identity";
import { PatientShell } from "@/components/paciente/patient-shell";
import { AuthenticatedUserMenu } from "@/components/auth/authenticated-user-menu";

export default async function PacienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await requireRole("paciente");

  return (
    <PatientShell
      userMenu={
        <AuthenticatedUserMenu
          displayName={resolveAuthenticatedDisplayName(auth)}
          roleLabel={resolvePrimaryRoleLabel(auth.roles)}
        />
      }
    >
      {children}
    </PatientShell>
  );
}
