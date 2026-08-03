import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadCasePriorityMap } from "@/modules/curadoria/mapa-prioridades-repository";
import {
  isRelationalConceptCode,
  relationalPersonOptionLabel,
  RELATIONAL_CONCEPTS,
} from "@/modules/curadoria/motor-relacional";
import { NEED_DEGREE_LABELS } from "@/modules/curadoria/protocolos";
import { loadCaseNeeds } from "@/modules/curadoria/protocolos-repository";
import { isProfileAcknowledged } from "@/modules/curadoria/reconhecimento-do-perfil";
import type { PriorityProfileStatus } from "@/modules/curadoria/types";

import { buildPerfilView, type PerfilView } from "./experiencia";

/**
 * O Perfil da pessoa, vindo do Mapa de Prioridades — ADR-042.
 *
 * Antes vinha de `cruzamento_weights`, o orçamento de 100 pontos. Aquele
 * modelo deixou de ser autoridade: o Mapa é a representação oficial das
 * prioridades do Case, e é dele que sai o que ela lê.
 *
 * Sem adaptador e sem derivar pontos: se o Mapa está vazio, o cartão diz que
 * o Perfil ainda está sendo construído — que é a verdade.
 */
export async function loadPatientPerfil(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PerfilView> {
  const [mapa, { data: profile }] = await Promise.all([
    loadCasePriorityMap(supabase, caseId),
    supabase.from("priority_profiles").select("status").eq("case_id", caseId).maybeSingle(),
  ]);

  // A validação do Perfil PELA PESSOA continua (ADR-042): ela nunca foi etapa
  // do modelo antigo — é o consentimento dela. A Curadoria só abre depois que
  // ela reconhece o Perfil como seu.
  return buildPerfilView(mapa.items, isProfileAcknowledged(profile?.status as PriorityProfileStatus));
}

/** Um item do bloco "Como você quer ser cuidada" — as palavras dela, com o grau dela. */
export type ComoQuerSerCuidadaItem = {
  code: string;
  conceptName: string;
  degreeLabel: string;
  /** Rótulos das escolhas fechadas (vazio quando a resposta é texto — P14). */
  escolhas: string[];
  /** O texto guiado dela, na íntegra (só P14). */
  texto: string | null;
};

/**
 * O bloco relacional do Perfil — ADR-065 (documento normativo, Parte 12).
 *
 * Lê as respostas DELA em case_needs (policy case_needs_select_patient) para
 * os conceitos do eixo relacional, na ordem do Catálogo. Nada é inferido:
 * conceito sem resposta simplesmente não aparece — o gate do reconhecimento
 * é quem cobra a completude, não este cartão.
 */
export async function loadComoQuerSerCuidada(
  supabase: SupabaseClient,
  caseId: string,
): Promise<ComoQuerSerCuidadaItem[]> {
  const needs = await loadCaseNeeds(supabase, caseId);
  const porCodigo = new Map(
    needs.filter((need) => isRelationalConceptCode(need.subcriterionCode)).map((need) => [
      need.subcriterionCode,
      need,
    ]),
  );

  const itens: ComoQuerSerCuidadaItem[] = [];
  for (const concept of RELATIONAL_CONCEPTS) {
    const need = porCodigo.get(concept.code);
    if (!need) continue;
    itens.push({
      code: concept.code,
      conceptName: concept.name,
      degreeLabel: NEED_DEGREE_LABELS[need.degree],
      escolhas: need.options.map((value) => relationalPersonOptionLabel(concept.code, value)),
      texto: need.guidedText,
    });
  }
  return itens;
}
