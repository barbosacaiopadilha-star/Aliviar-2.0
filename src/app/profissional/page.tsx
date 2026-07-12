import { getAuthState } from "@/modules/auth/session";

import { DashboardPanel } from "@/components/shell/dashboard-panel";

export default async function ProfissionalDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Profissional";

  return <DashboardPanel displayName={displayName} roleLabel="profissional" />;
}
