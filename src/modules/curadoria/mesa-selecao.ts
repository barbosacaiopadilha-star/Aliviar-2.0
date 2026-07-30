/**
 * SELEÇÃO PELOS ELEGÍVEIS DA MESA — M1 do plano de remediação (executa a ADR-042).
 *
 * @metodo ADR-035 — a seleção é exclusivamente do Curador
 * @metodo ADR-041 — a leitura de compatibilidade vem do Motor; nenhum score
 * @metodo Ontologia §3.13 — ordem de apresentação, jamais colocação
 *
 * A tela da escolha deixa de nascer do pipeline legado (`runCompatibility` →
 * `compatibility_analyses`) e passa a nascer da mesma fonte das etapas de
 * leitura: os elegíveis classificados pela Mesa, com a leitura do Motor por
 * subcritério. Uma fonte só — quem aparece para ser selecionado é exatamente
 * quem a etapa de Avaliação declarou elegível.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import type { CompatibilityBand } from "./types";
import type { ComparisonColumn, ProfessionalEligibility } from "./mesa-cruzamento-view";

export type SelecaoCandidato = {
  professionalProfileId: string;
  nome: string;
  /** Contagens por estado — nunca um total que pudesse ser lido como nota. */
  resumo: string;
  celulas: ComparisonColumn["cells"];
};

export type SelecaoExcluido = {
  professionalProfileId: string;
  nome: string;
  /** O motivo é o filtro aplicado (ou a pendência) — nunca uma nota. */
  motivo: string;
};

/**
 * Os candidatos à seleção são as colunas da comparação — os elegíveis, com a
 * leitura do Motor. A ordem de saída é a ordem de entrada: ordenar aqui, por
 * qualquer chave de resultado, seria produzir colocação.
 */
export function candidatosDaSelecao(
  comparison: readonly ComparisonColumn[],
  nomeDe: (professionalProfileId: string) => string,
): SelecaoCandidato[] {
  return comparison.map((coluna) => ({
    professionalProfileId: coluna.professionalProfileId,
    nome: nomeDe(coluna.professionalProfileId),
    resumo: coluna.resumo,
    celulas: coluna.cells,
  }));
}

/**
 * Quem não está na seleção, e por quê — com o motivo da própria classificação
 * da Mesa (área e filtros), em vez da lista do motor antigo, que ignorava a
 * declaração de área.
 */
export function foraDaSelecao(
  professionals: readonly {
    professionalProfileId: string;
    displayName: string;
    eligibility: ProfessionalEligibility;
  }[],
): SelecaoExcluido[] {
  return professionals
    .filter((profissional) => profissional.eligibility.state !== "ELEGIVEL")
    .map((profissional) => ({
      professionalProfileId: profissional.professionalProfileId,
      nome: profissional.displayName,
      motivo: profissional.eligibility.reason,
    }));
}

/**
 * COMPATIBILIDADE COM O CONTRATO LEGADO — pendência declarada da M2.
 *
 * `saveSelectionAction` ainda exige `band` por opção (schema intocado nesta
 * onda). O valor deixa de nascer de um cálculo: Cases que já tinham análise
 * legada preservam a banda gravada antes; Cases novos recebem o mesmo
 * `"MODERADA"` que sempre foi o fallback. A remoção do campo é a M2.
 */
export function bandaDeCompatibilidade(
  professionalProfileId: string,
  legadas: Readonly<Record<string, CompatibilityBand>>,
): CompatibilityBand {
  return legadas[professionalProfileId] ?? "MODERADA";
}
