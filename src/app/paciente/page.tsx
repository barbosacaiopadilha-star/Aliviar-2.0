import { getAuthState } from "@/modules/auth/session";

export default async function PacienteDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Paciente";

  return (
    <div>
      <h1>Olá, {displayName}</h1>
      <p>Papel atual: paciente</p>
      <p>Ainda não há informações para exibir.</p>
    </div>
  );
}
