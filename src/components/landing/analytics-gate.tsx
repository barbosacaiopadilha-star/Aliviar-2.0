"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

/**
 * O analytics pertence à Fachada — nunca à casa.
 *
 * Este gate é o **irmão do `PublicHeaderGate` e do `PublicFooterGate`**, e
 * existe pela mesma razão que eles: a Recepção ("Sua História") compartilha a
 * moldura pública com a Landing, e herdava dela o que é de campanha.
 *
 * A diferença é que aqui a herança não era estética, era legal. Até esta
 * rodada o `<Analytics/>` vivia no layout raiz (`src/app/layout.tsx`), isto é,
 * em **todas** as rotas — `/paciente/*`, `/portal-curador/*`, `/admin/*` e o
 * wizard de `/sua-historia`. A URL visitada por quem já é paciente é indício
 * de condição de saúde, e ela saía sem consentimento nenhum.
 *
 * É a execução da **ADR-056** (D-10), item 2: *"o analytics deverá ser
 * removido das rotas autenticadas — permanecerá apenas na landing pública,
 * preservando a métrica de aquisição sem tocar dado de quem já é paciente."*
 * A decisão é de 2026-08-02 e a implementação estava endereçada ao Bloco H,
 * que não chegou a acontecer.
 *
 * **Por que lista de permissão, e não de exclusão.** O `PublicFooterGate`
 * pode se dar ao luxo de excluir `/sua-historia` por prefixo: se um dia ele
 * errar, aparece um rodapé onde não devia. Aqui o erro simétrico é rastrear
 * navegação clínica em silêncio — então a regra é invertida. Rota nova só é
 * medida se alguém a escrever aqui, de propósito. O padrão é não medir.
 */

/**
 * As rotas da Fachada: onde alguém decide se quer a Aliviar, antes de contar
 * qualquer coisa. Nenhuma delas revela condição de saúde pela URL.
 *
 * `/sua-historia` está fora de propósito, e é o ponto desta mudança.
 */
const ROTAS_MEDIDAS: readonly string[] = [
  "/", // a Landing
  "/solicitar-atendimento", // o pedido: é esta a métrica de aquisição
  "/privacidade",
  "/termos",
  "/consentimentos",
  "/legal",
];

export function rotaEhMedida(pathname: string): boolean {
  return ROTAS_MEDIDAS.some(
    (rota) => pathname === rota || (rota !== "/" && pathname.startsWith(`${rota}/`)),
  );
}

export function AnalyticsGate() {
  const pathname = usePathname();
  if (!rotaEhMedida(pathname)) return null;
  return <Analytics />;
}
