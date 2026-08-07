import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  montarCadeiaDeProveniencia,
  type CadeiaDeProveniencia,
  type EvidenciaDaCadeia,
  type PropostaDaCadeia,
} from "./cadeia-de-proveniencia";
import { loadCasePriorityMap } from "./mapa-prioridades-repository";
import { loadProfessionalMap } from "./mapa-profissional-repository";
import { loadCaseNeeds } from "./protocolos-repository";

/**
 * A cadeia de proveniência, montada a partir das fontes reais.
 *
 * @metodo Arquitetura §11.4 — a árvore que precisa fechar ponta a ponta
 * @metodo CONTRATO_1_8_R1 §21 — este é o ÚNICO módulo autorizado a invocar a
 *         capability de proveniência, e só para reconstruir e auditar
 *
 * Este módulo NÃO decide nada: ele lê as fontes que existem — `case_needs`,
 * `case_priority_map`, `professional_subcriterion_map`, `practice_evidence` e
 * a proposta persistida — e entrega ao montador puro. Toda a semântica de "o
 * que falta e por quê" vive lá, num lugar só.
 *
 * **Leitura apenas.** Nenhuma escrita, nenhuma emissão, nenhuma seleção de
 * regra, nenhum cálculo do Motor, nenhuma ordenação. A exceção nominal da C-01
 * autoriza um VERBO — ler para reconstruir —, nunca um arquivo, e a guarda
 * C-01b audita isso a cada execução.
 */
export async function loadCadeiaDeProveniencia(
  supabase: SupabaseClient,
  params: { caseId: string; professionalProfileId: string; subcriterionCode: string },
): Promise<CadeiaDeProveniencia> {
  const [needs, mapaDoCase, mapaDoProfissional, proposta, evidencia] = await Promise.all([
    loadCaseNeeds(supabase, params.caseId),
    loadCasePriorityMap(supabase, params.caseId),
    loadProfessionalMap(supabase, params.professionalProfileId),
    carregarPropostaPersistida(supabase, params.caseId, params.subcriterionCode),
    carregarEvidenciaVinculada(supabase, params.professionalProfileId, params.subcriterionCode),
  ]);

  const declaracao = needs.find((need) => need.subcriterionCode === params.subcriterionCode) ?? null;
  const importancia =
    mapaDoCase.items.find((item) => item.subcriterionCode === params.subcriterionCode) ?? null;
  const estado =
    mapaDoProfissional.items.find((item) => item.subcriterionCode === params.subcriterionCode) ??
    null;

  return montarCadeiaDeProveniencia({
    subcriterionCode: params.subcriterionCode,
    // A identidade do alvo viaja na cadeia (A3): é contra ela que a coerência
    // confronta proposta e evidência "de outro lugar".
    alvo: {
      caseId: params.caseId,
      professionalProfileId: params.professionalProfileId,
    },
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
        ? {
            importance: importancia.importance,
            declaredBy: importancia.declaredBy ?? null,
            registradoEm: importancia.registradoEm ?? null,
          }
        : null,
      proposta,
    },
    profissional: {
      estado: estado
        ? {
            status: estado.status,
            declaredBy: estado.declaredBy ?? null,
            registradoEm: estado.registradoEm ?? null,
          }
        : null,
      evidencia,
    },
  });
}

/**
 * A proposta que derivou esta importância — se houve derivação.
 *
 * A leitura acontece pela CAPABILITY DE PROVENIÊNCIA
 * (`curadoria.ler_proposta_para_proveniencia`, CONTRATO_1_8_R1 §21): a tabela
 * persistida permanece inacessível a todo papel de aplicação, e a autoridade é
 * da função — `SECURITY DEFINER`, `STABLE`, projeção nominal de onze colunas.
 * Este módulo conhece a função, não a tabela.
 *
 * Busca por IDENTIDADE (`case_id` + `subcriterion_code`), nunca por semelhança.
 * `null` significa que não há proposta para este alvo: a importância foi
 * declarada à mão, e o montador marca o elo como `NAO_APLICAVEL` — não como
 * lacuna (§16). Mais de uma proposta para o alvo é invariante violado, e a
 * PRÓPRIA capability levanta `PROPOSTA_AMBIGUA` — nem ela nem este módulo
 * escolhem, porque escolher seria decidir.
 */
async function carregarPropostaPersistida(
  supabase: SupabaseClient,
  caseId: string,
  subcriterionCode: string,
): Promise<PropostaDaCadeia | null> {
  const { data, error } = await supabase.rpc("ler_proposta_para_proveniencia", {
    p_case_id: caseId,
    p_subcriterion_code: subcriterionCode,
  });

  if (error) throw new Error(`Cadeia de proveniência (proposta): ${error.message}`);

  const linhas = (data ?? []) as Record<string, unknown>[];
  if (linhas.length === 0) return null;

  const linha = linhas[0]!;
  return {
    propostaId: linha.id as string,
    ruleId: linha.rule_id as string,
    ruleVersion: linha.rule_version as number,
    caseId: linha.case_id as string,
    subcriterionCode: linha.subcriterion_code as string,
    suggestedValue: linha.suggested_value as string,
    originRecord: (linha.origin_record as string | null) ?? null,
    originVersion: (linha.origin_version as string | null) ?? null,
    originAuthor: (linha.origin_author as string | null) ?? null,
    emittedAt: (linha.emitted_at as string | null) ?? null,
  };
}

/**
 * A evidência que sustentava o estado — pelo VÍNCULO, e só por ele.
 *
 * `professional_subcriterion_map.evidence_id` aponta para uma linha exata de
 * `practice_evidence`, que por sua vez identifica uma tripla
 * (profissional, conceito, versão). Resolver o ponteiro é resolver a versão.
 *
 * **Nada aqui procura a evidência "mais recente".** Não há `max(version)`, não
 * há ordenação por data, não há "primeira linha compatível". Sem vínculo, o
 * retorno é `null` e o elo nasce `AUSENTE` — que é a verdade sobre o registro,
 * e não um buraco a ser tapado por suposição (§6, §11).
 */
async function carregarEvidenciaVinculada(
  supabase: SupabaseClient,
  professionalProfileId: string,
  subcriterionCode: string,
): Promise<EvidenciaDaCadeia | null> {
  // O Mapa identifica conceito por `subcriterion_id`; a evidência, por `code`.
  // A tradução acontece aqui, uma vez, do mesmo jeito que a constraint trigger
  // da migration a faz do lado do banco.
  const { data: conceito, error: erroConceito } = await supabase
    .from("method_subcriteria")
    .select("id")
    .eq("code", subcriterionCode)
    .maybeSingle();

  if (erroConceito) throw new Error(`Cadeia de proveniência (conceito): ${erroConceito.message}`);
  if (!conceito) return null;

  const { data: vinculo, error: erroVinculo } = await supabase
    .from("professional_subcriterion_map")
    .select("evidence_id")
    .eq("professional_profile_id", professionalProfileId)
    .eq("subcriterion_id", conceito.id as string)
    .maybeSingle();

  if (erroVinculo) throw new Error(`Cadeia de proveniência (vínculo): ${erroVinculo.message}`);

  const evidenceId = (vinculo?.evidence_id as string | null) ?? null;
  if (!evidenceId) return null; // legado ou fluxo que ainda não informa a base

  const { data: linha, error: erroEvidencia } = await supabase
    .from("practice_evidence")
    .select(
      "id, professional_profile_id, subcriterion_code, version, source, source_tier, collected_by, collected_at, verified_by, verified_at, verification_source",
    )
    .eq("id", evidenceId)
    .maybeSingle();

  if (erroEvidencia) throw new Error(`Cadeia de proveniência (evidência): ${erroEvidencia.message}`);
  if (!linha) return null;

  return {
    evidenceId: linha.id as string,
    professionalProfileId: linha.professional_profile_id as string,
    subcriterionCode: linha.subcriterion_code as string,
    version: linha.version as number,
    source: linha.source as string,
    sourceTier: linha.source_tier as string,
    collectedBy: (linha.collected_by as string | null) ?? null,
    collectedAt: (linha.collected_at as string | null) ?? null,
    verifiedBy: (linha.verified_by as string | null) ?? null,
    verifiedAt: (linha.verified_at as string | null) ?? null,
    verificationSource: (linha.verification_source as string | null) ?? null,
  };
}
