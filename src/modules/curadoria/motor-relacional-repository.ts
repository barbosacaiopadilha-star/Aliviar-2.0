/**
 * MOTOR RELACIONAL — a ponte com o banco (ADR-065).
 *
 * Espelho fino de `motor-compatibilidade-repository.ts`: carrega as duas
 * declarações (necessidades relacionais do Case em `case_needs`; condutas
 * vigentes do profissional na Base de Evidências) e entrega ao motor puro.
 * Nenhuma regra aqui; nenhuma escrita — o Motor não escreve (ADR-041,
 * herdado pela ADR-065).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadCurrentPracticeEvidence } from "./evidencias-pratica-repository";
import {
  crossRelational,
  isRelationalConceptCode,
  relationalSummary,
  relationalSummarySentence,
  type RelationalEvidence,
  type RelationalNeed,
  type RelationalReading,
  type RelationalSummary,
} from "./motor-relacional";
import { loadCaseNeeds } from "./protocolos-repository";

export type CaseRelationalReading = {
  professionalProfileId: string;
  readings: RelationalReading[];
  /** Conceitos relacionais sem resposta da pessoa — fora do cruzamento. */
  notAnsweredByPerson: string[];
  summary: RelationalSummary;
  summarySentence: string;
};

/**
 * Cruza o Case com N profissionais, preservando a ordem de entrada (quem
 * ordena a leitura é decisão fora do Motor — e hoje não há chave, Decisão B).
 */
export async function crossCaseRelationalForProfessionals(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileIds: readonly string[],
): Promise<{ byProfessional: CaseRelationalReading[]; relationalNeedsCount: number }> {
  const needsDoCase = await loadCaseNeeds(supabase, caseId);
  const needs: RelationalNeed[] = needsDoCase
    .filter((need) => isRelationalConceptCode(need.subcriterionCode))
    .map((need) => ({
      subcriterionCode: need.subcriterionCode,
      options: need.options,
      degree: need.degree,
      guidedText: need.guidedText,
    }));

  const evidencePorProfissional = await loadCurrentPracticeEvidence(supabase, professionalProfileIds);

  const byProfessional = professionalProfileIds.map((professionalProfileId) => {
    const evidenceByCode = new Map<string, RelationalEvidence>();
    for (const record of evidencePorProfissional.get(professionalProfileId) ?? []) {
      if (!isRelationalConceptCode(record.subcriterionCode)) continue;
      evidenceByCode.set(record.subcriterionCode, {
        subcriterionCode: record.subcriterionCode,
        options: record.options,
      });
    }

    const { readings, notAnsweredByPerson } = crossRelational(needs, evidenceByCode);
    const summary = relationalSummary(readings);
    return {
      professionalProfileId,
      readings,
      notAnsweredByPerson,
      summary,
      summarySentence: relationalSummarySentence(summary),
    };
  });

  return { byProfessional, relationalNeedsCount: needs.length };
}
