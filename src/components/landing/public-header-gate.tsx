"use client";

import { usePathname } from "next/navigation";

import type { ReactNode } from "react";

/**
 * O topo institucional pertence à Fachada — nunca à conversa.
 *
 * Este gate é o **irmão do `PublicFooterGate`**, e existe pelo mesmo motivo
 * dele: "Sua História" compartilha a moldura pública com a Landing, e herdava
 * dela a campanha inteira. O rodapé já tinha sido resolvido; o topo não.
 *
 * A5 · o que a captura mostrou: desde a A2B, quando "Sua História" passou a
 * vestir o `PatientShell`, a página tinha **dois cabeçalhos empilhados** — o
 * público (logotipo + botão "Minha Jornada") sobre o privado (logotipo +
 * navegação da casa + menu da conta). Duas marcas Aliviar, uma sobre a outra,
 * na tela em que a pessoa vai contar o que está vivendo.
 *
 * Não é só ruído visual: são duas navegações concorrentes, e a de cima leva
 * para fora da conversa.
 *
 * Um gate por rota é a menor correção possível — nenhuma rota muda, o layout
 * continua único, e o `<main>` segue no mesmo lugar. A moldura de quem está
 * autenticada passa a ser uma só: a da casa.
 */
export function PublicHeaderGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/sua-historia")) return null;
  return <>{children}</>;
}
