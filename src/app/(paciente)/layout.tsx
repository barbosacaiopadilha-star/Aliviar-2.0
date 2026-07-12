import { requireRole } from "@/modules/auth/guard";

export default async function PacienteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("paciente");

  return <>{children}</>;
}
