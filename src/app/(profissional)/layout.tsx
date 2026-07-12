import { requireRole } from "@/modules/auth/guard";

export default async function ProfissionalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("profissional");

  return <>{children}</>;
}
