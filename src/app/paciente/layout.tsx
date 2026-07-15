import { requireRole } from "@/modules/auth/guard";
import { PatientShell } from "@/components/paciente/patient-shell";

export default async function PacienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("paciente");

  return <PatientShell>{children}</PatientShell>;
}
