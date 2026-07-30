import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAnyRole } from "@/modules/auth/guard";
import { canAccessCrm } from "@/modules/crm/permissions";

export const metadata: Metadata = {
  title: "CRM Aliviar",
  robots: { index: false, follow: false },
};

export default async function CrmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const state = await requireAnyRole(["administrador", "concierge"]);
  if (!canAccessCrm(state.roles)) redirect("/acesso-negado");
  return <div className="space-y-6">{children}</div>;
}
