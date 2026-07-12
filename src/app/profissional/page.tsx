import type { Metadata } from "next";

import { getAuthState } from "@/modules/auth/session";

import { DashboardPanel } from "@/components/shell/dashboard-panel";

// noindex: área autenticada — nunca deve ser indexada (ver também robots.ts).
export const metadata: Metadata = {
  title: "Profissional",
  robots: { index: false, follow: false },
};

export default async function ProfissionalDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Profissional";

  return <DashboardPanel displayName={displayName} roleLabel="profissional" />;
}
