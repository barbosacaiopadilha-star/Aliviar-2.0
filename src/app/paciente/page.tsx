import { getAuthState } from "@/modules/auth/session";

import { DashboardPanel } from "@/components/shell/dashboard-panel";

export default async function PacienteDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Paciente";

  return <DashboardPanel displayName={displayName} roleLabel="paciente" />;
}
