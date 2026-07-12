import { requireRole } from "@/modules/auth/guard";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("administrador");

  return <>{children}</>;
}
