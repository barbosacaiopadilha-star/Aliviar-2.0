import Link from "next/link";

import { getAuthState } from "@/modules/auth/session";

const ROLE_HOME: Record<string, string> = {
  administrador: "/admin",
  profissional: "/profissional",
  paciente: "/paciente",
};

export default async function AcessoNegadoPage() {
  const state = await getAuthState();
  const ownRole = state?.roles.find((role) => role in ROLE_HOME);
  const backHref = ownRole ? ROLE_HOME[ownRole] : "/";

  return (
    <div>
      <h1>Acesso negado</h1>
      <p>Você não tem acesso a esta área com o seu perfil atual.</p>
      <p>
        <Link href={backHref}>Voltar para a minha área</Link>
      </p>
    </div>
  );
}
