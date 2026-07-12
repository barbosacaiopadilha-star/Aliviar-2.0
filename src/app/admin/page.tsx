import { getAuthState } from "@/modules/auth/session";

export default async function AdminDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Administrador";

  return (
    <div>
      <h1>Olá, {displayName}</h1>
      <p>Papel atual: administrador</p>
      <p>Ainda não há informações para exibir.</p>
    </div>
  );
}
