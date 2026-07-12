import { getAuthState } from "@/modules/auth/session";

export default async function ProfissionalDashboardPage() {
  const state = await getAuthState();
  const displayName = state?.profile?.displayName ?? "Profissional";

  return (
    <div>
      <h1>Olá, {displayName}</h1>
      <p>Papel atual: profissional</p>
      <p>Ainda não há informações para exibir.</p>
    </div>
  );
}
