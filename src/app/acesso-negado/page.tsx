import Link from "next/link";

import type { Metadata } from "next";

import { getAuthState } from "@/modules/auth/session";
import { getRoleHome } from "@/modules/auth/role-home";

export const metadata: Metadata = {
  title: "Acesso negado",
  robots: { index: false, follow: false },
};

export default async function AcessoNegadoPage() {
  const state = await getAuthState();
  const backHref = getRoleHome(state?.roles ?? []);

  return (
    <div>
      <h1>Esta área não está disponível para você</h1>
      <p>
        Com o seu perfil atual, você não tem acesso a esta parte da plataforma.
        Tudo bem — sua área continua logo abaixo.
      </p>
      <p>
        <Link href={backHref}>Voltar para a minha área</Link>
      </p>
    </div>
  );
}
