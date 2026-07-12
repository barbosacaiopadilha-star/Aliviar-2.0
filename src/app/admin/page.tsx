import { getAuthState } from "@/modules/auth/session";

import { DashboardPanel } from "@/components/shell/dashboard-panel";

export default async function AdminDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Administrador";

  return <DashboardPanel displayName={displayName} roleLabel="administrador" />;
}
