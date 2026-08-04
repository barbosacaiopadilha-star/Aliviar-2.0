import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  montarCadeiaDeProveniencia,
  type CadeiaDeProveniencia,
} from "./cadeia-de-proveniencia";
import { loadCasePriorityMap } from "./mapa-prioridades-repository";
import { loadProfessionalMap } from "./mapa-profissional-repository";
import { loadCaseNeeds } from "./protocolos-repository";

/**
 * A cadeia de proveniência, montada a partir das fontes reais.
 *
 * @metodo Arquitetura §11.4 — a árvore que precisa fechar ponta a ponta
 *
 * Este módulo NÃO decide nada: ele lê as quatro fontes que já existem —
 * `case_needs`, `case_priority_map`, `practice_evidence` (via o Mapa) e
 * `professional_subcriterion_map` — e entrega ao montador puro. Toda a
 * semântica de "o que falta e por quê" vive lá, num lugar só.
 *
 * Leitura apenas. Nenhuma escrita, nenhuma proposta, nenhuma derivação.
 */
export async function loadCadeiaDeProveniencia(
  supabase: SupabaseClient,
  params: { caseId: string; professionalProfileId: string; subcriterionCode: string },
): Promise<CadeiaDeProveniencia> {
  const [needs, mapaDoCase, mapaDoProfissional] = await Promise.all([
    loadCaseNeeds(supabase, params.caseId),
    loadCasePriorityMap(supabase, params.caseId),
    loadProfessionalMap(supabase, params.professionalProfileId),
  ]);

  const declaracao = needs.find((need) => need.subcriterionCode === params.subcriterionCode) ?? null;
  const importancia =
    mapaDoCase.items.find((item) => item.subcriterionCode === params.subcriterionCode) ?? null;
  const estado =
    mapaDoProfissional.items.find((item) => item.subcriterionCode === params.subcriterionCode) ??
    null;

  return montarCadeiaDeProveniencia({
    subcriterionCode: params.subcriterionCode,
    pessoa: {
      declaracao: declaracao
        ? {
            degree: declaracao.degree,
            options: declaracao.options,
            declaredBy: declaracao.declaredBy,
            declaredAt: declaracao.declaredAt,
          }
        : null,
      importancia: importancia
        ? { importance: importancia.importance, declaredBy: importancia.declaredBy ?? null }
        : null,
    },
    profissional: {
      // A Base de Evidências não é lida por conceito neste pacote: o elo de
      // origem do lado do profissional entra quando o Mapa passar a apontar
      // para a evidência que o sustenta (Onda 2). Declarar `null` aqui é dizer
      // a verdade — a cadeia mostra a lacuna em vez de supor a origem.
      evidencia: null,
      estado: estado ? { status: estado.status, declaredBy: estado.declaredBy ?? null } : null,
    },
  });
}
