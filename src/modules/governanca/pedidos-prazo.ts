/**
 * O PRAZO DE UM PEDIDO DE TITULAR — aritmética pura, testável sem banco.
 *
 * `data_subject_requests.prazo_em` é NULÁVEL de propósito: a migration que a
 * criou diz *"Prazo é decisão jurídica; a coluna existe para recebê-lo sem
 * refatorar"*, e a decisão nunca veio. A Política de Privacidade rascunhada
 * (`docs/privacidade/POLITICA_DE_PRIVACIDADE.md`, decisão 3) **propõe** 15
 * dias corridos para todos os direitos — o prazo que a LGPD fixa para
 * confirmação e acesso (art. 19, II).
 *
 * Este módulo não inventa lei. Ele faz duas coisas diferentes, e a tela mostra
 * qual das duas está em jogo:
 *
 *   · se `prazo_em` está preenchido, esse é O prazo — `fixado: true`;
 *   · se está nulo, devolve a REFERÊNCIA de 15 dias — `fixado: false` —, para
 *     que a operação tenha um relógio enquanto o jurídico não fixa o dele.
 *
 * Uma referência que a tela chama de referência é honesta. Um prazo inventado
 * e apresentado como prazo, não.
 */

/** A proposta da Política (decisão 3), ainda não confirmada pelo jurídico. */
export const PRAZO_PROPOSTO_EM_DIAS = 15;

const UM_DIA = 24 * 60 * 60 * 1000;

export type Prazo = {
  /** O instante-limite: o de `prazo_em`, ou a referência de 15 dias. */
  limite: Date;
  /** `true` só quando `prazo_em` veio do banco — nunca para a referência. */
  fixado: boolean;
  /** Dias corridos desde a abertura, arredondados para baixo. */
  diasDecorridos: number;
  /** Negativo quando já passou. */
  diasRestantes: number;
  vencido: boolean;
  /** Últimos 3 dias, ou já vencido: o que a tela destaca. */
  urgente: boolean;
};

export function prazoDoPedido(
  criadoEm: string,
  prazoEm: string | null,
  agora: Date = new Date(),
): Prazo {
  const abertura = new Date(criadoEm);
  const fixado = prazoEm != null;
  const limite = fixado ? new Date(prazoEm!) : new Date(abertura.getTime() + PRAZO_PROPOSTO_EM_DIAS * UM_DIA);

  const diasDecorridos = Math.floor((agora.getTime() - abertura.getTime()) / UM_DIA);
  // Ceil, não floor: faltando 0,2 dia ainda é "1 dia" para quem precisa agir
  // hoje. Arredondar para baixo diria "0 dias restantes" com o prazo aberto.
  const diasRestantes = Math.ceil((limite.getTime() - agora.getTime()) / UM_DIA);
  const vencido = agora.getTime() > limite.getTime();

  return {
    limite,
    fixado,
    diasDecorridos,
    diasRestantes,
    vencido,
    urgente: vencido || diasRestantes <= 3,
  };
}

/** Ordem de atendimento: o mais apertado primeiro, o mais antigo desempata. */
export function ordenarPorPressao<T extends { criadoEm: string; prazoEm: string | null }>(
  pedidos: readonly T[],
  agora: Date = new Date(),
): T[] {
  return [...pedidos].sort((a, b) => {
    const pa = prazoDoPedido(a.criadoEm, a.prazoEm, agora);
    const pb = prazoDoPedido(b.criadoEm, b.prazoEm, agora);
    if (pa.diasRestantes !== pb.diasRestantes) return pa.diasRestantes - pb.diasRestantes;
    return new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
  });
}
