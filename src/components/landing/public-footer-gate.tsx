"use client";

import { usePathname } from "next/navigation";

import { PublicFooter } from "@/components/landing/public-footer";

/**
 * O rodapé institucional pertence à Fachada — nunca à conversa.
 *
 * A Recepção ("Sua História") compartilha a moldura pública com a Landing, e
 * até esta rodada herdava também o rodapé de campanha: quem rolava além do
 * "Continuar" na pergunta sobre o próprio medo encontrava logotipo, navegação
 * e copyright. Sob uma decisão, o espaço fica vazio (Experience Book §13.5;
 * validação 2.4, mudança A) — a campanha não entra no quarto onde alguém se
 * abre.
 *
 * Um gate por rota é a menor mudança que resolve: nenhuma rota muda, o
 * layout continua único, e o rodapé permanece fora do <main> (semântica de
 * contentinfo preservada).
 */
export function PublicFooterGate() {
  const pathname = usePathname();
  if (pathname.startsWith("/sua-historia")) return null;
  return <PublicFooter />;
}
