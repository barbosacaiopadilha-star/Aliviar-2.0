import Link from "next/link";

import type { Metadata } from "next";

import { getAuthState } from "@/modules/auth/session";
import { getRoleHome } from "@/modules/auth/role-home";

export const metadata: Metadata = {
  title: "Acesso negado",
  robots: { index: false, follow: false },
};

/**
 * A porta errada — e a única superfície da casa que estava sem nenhum
 * cuidado (Auditoria §2: HTML cru, zero CSS).
 *
 * O que ela diz, e o que se recusa a dizer: que aquele cômodo não é dela,
 * sem acusar, sem expor papel, policy, rota protegida ou qualquer detalhe de
 * autorização — quem chega aqui por engano não precisa aprender a arquitetura
 * de acesso da Aliviar, e quem chega de propósito não recebe pista alguma.
 *
 * Server Component puro, sem estado e sem script: a porta precisa funcionar
 * mesmo quando nada mais funciona.
 */
export default async function AcessoNegadoPage() {
  const state = await getAuthState();
  const backHref = getRoleHome(state?.roles ?? []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-reading flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-brand-primary">Aliviar</p>

      <h1 className="mt-6 font-serif text-3xl font-normal leading-snug text-ink">
        Esta parte da casa não é sua.
      </h1>

      <p className="mt-5 max-w-prose leading-relaxed text-ink-muted">
        Não há nada errado com você nem com o seu acesso — este endereço pertence a outra área da
        Aliviar. A sua continua exatamente onde estava.
      </p>

      <p className="mt-8">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Voltar para a minha área
        </Link>
      </p>
    </main>
  );
}
