import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listAreaDeclarations } from "./area-repository";
import { applyAreaGate } from "./cruzamento";
import { loadCasePriorityMap } from "./mapa-prioridades-repository";
import { loadProfessionalMap } from "./mapa-profissional-repository";
import { crossCaseRelationalForProfessionals } from "./motor-relacional-repository";
import {
  FRASE_COMPOSICAO_RASCUNHO,
  generateReportDraft,
  GENERATOR_VERSION,
  type DraftInput,
  type OptionDraftInput,
  type ReportDraft,
} from "./relatorio-inteligente";
import { getSelection } from "./repository";
import { saveReport, type ReportOptionInput } from "./report-repository";

/**
 * RELATÓRIO ASSISTIDO — a ponte entre os contratos e o gerador puro.
 *
 * O gerador (relatorio-inteligente.ts) não conhece banco. Este módulo monta a
 * entrada tipada a partir do que já está registrado — seleção, declarações de
 * área, Mapa de Prioridades do Case, Mapa de cada Profissional, divergências —
 * e persiste o rascunho no Relatório existente, marcado como assistido.
 *
 * ADR-042: os pesos saíram. `loadCruzamentoWeights` não é mais chamado aqui,
 * e nenhum ponto entra no gerador.
 *
 * O que ele nunca faz: sobrescrever trabalho humano em silêncio. Regenerar
 * sobre um Relatório já revisado exige ação explícita; sobre um aprovado ou
 * emitido, não acontece de forma alguma.
 */

export type AssistedDraftResult = {
  reportId: string;
  draft: ReportDraft;
};

async function buildDraftInput(
  supabase: SupabaseClient,
  caseId: string,
  professionalProfileIds: string[],
): Promise<DraftInput> {
  const [areaDeclarations, priorityMap, professionalMaps, relacional] = await Promise.all([
    listAreaDeclarations(supabase, caseId),
    loadCasePriorityMap(supabase, caseId),
    Promise.all(professionalProfileIds.map((id) => loadProfessionalMap(supabase, id))),
    // ADR-065: a leitura relacional entra no rascunho pela mesma porta das
    // demais fontes — cruzada pelo motor, nunca recalculada aqui.
    crossCaseRelationalForProfessionals(supabase, caseId, professionalProfileIds),
  ]);

  const relacionalPorProfissional = new Map(
    relacional.byProfessional.map((leitura) => [leitura.professionalProfileId, leitura.readings]),
  );

  const mapaPorProfissional = new Map(
    professionalProfileIds.map((id, indice) => [id, professionalMaps[indice]!]),
  );

  const { data: filterRows } = await supabase
    .from("priority_profiles")
    .select("id, priority_profile_filters(kind, value, nature)")
    .eq("case_id", caseId)
    .maybeSingle();

  const areaRequirement =
    ((filterRows?.priority_profile_filters as { kind: string; value: string; nature: string }[] | undefined) ?? []).find(
      (row) => row.nature === "FILTRO_OBRIGATORIO" && row.kind === "AREA_DE_ATUACAO",
    )?.value ?? null;

  const { data: divergences } = await supabase
    .from("verification_divergences")
    .select("professional_profile_id")
    .in("professional_profile_id", professionalProfileIds)
    .eq("status", "aberta")
    .eq("severity", "critica");

  const divergencesByProfessional = new Map<string, number>();
  for (const row of divergences ?? []) {
    const id = row.professional_profile_id as string;
    divergencesByProfessional.set(id, (divergencesByProfessional.get(id) ?? 0) + 1);
  }

  const options: OptionDraftInput[] = professionalProfileIds.map((professionalProfileId) => {
    const area = areaDeclarations.find((d) => d.professionalProfileId === professionalProfileId) ?? null;

    // O gerador só trabalha sobre quem participa — a porta é a mesma da Mesa.
    const gate = area
      ? applyAreaGate({
          professionalProfileId,
          compatibility: area.compatibility,
          rationale: area.rationale,
          confirmedByCurator: area.confirmedByCurator,
        })
      : null;
    if (!gate?.participates) {
      throw new Error(
        "Há um profissional na seleção sem declaração de área que o permita participar. O rascunho não pode ser gerado.",
      );
    }

    // O Mapa do Profissional entra como está: subcritério ausente da lista
    // permanece ausente, e é o gerador que distingue "não investigado" de
    // "investigado e sem informação". Preencher aqui apagaria a diferença.
    const mapa = mapaPorProfissional.get(professionalProfileId);

    return {
      professionalProfileId,
      states: (mapa?.items ?? []).map((item) => ({
        subcriterionCode: item.subcriterionCode,
        status: item.status,
      })),
      areaDeclaration: area
        ? {
            compatibility: area.compatibility,
            rationale: area.rationale,
            declaredBy: area.declaredBy,
            declaredAt: area.declaredAt,
          }
        : null,
      openCriticalDivergences: divergencesByProfessional.get(professionalProfileId) ?? 0,
      relationalReadings: relacionalPorProfissional.get(professionalProfileId) ?? [],
    };
  });

  return {
    areaRequirement,
    priorities: priorityMap.items.map((item) => ({
      subcriterionCode: item.subcriterionCode,
      importance: item.importance,
    })),
    options,
  };
}

/**
 * Gera e persiste o rascunho assistido para a seleção do Case.
 *
 * - Recusa seleção que não tenha exatamente três opções distintas.
 * - Recusa sobrescrever Relatório aprovado ou emitido, sempre.
 * - Recusa sobrescrever Relatório já revisado pelo Curador, salvo `force`
 *   explícito — regeneração nunca é silenciosa.
 */
export async function generateAndSaveAssistedDraft(
  supabase: SupabaseClient,
  input: { caseId: string; priorityProfileId: string; force?: boolean },
): Promise<AssistedDraftResult> {
  const selection = await getSelection(supabase, input.priorityProfileId);
  if (!selection) {
    throw new Error("Ainda não há seleção para este Case — o rascunho nasce dela.");
  }
  if (selection.options.length !== 3) {
    throw new Error("O rascunho só é gerado com exatamente três opções selecionadas.");
  }

  const { data: existing } = await supabase
    .from("curadoria_reports")
    .select("id, emitted_at, approved_at, reviewed_at")
    .eq("curated_selection_id", selection.id)
    .maybeSingle();

  if (existing?.emitted_at) {
    throw new Error("Este Relatório já foi emitido — documento congelado, nada mais é gerado sobre ele.");
  }
  if (existing?.approved_at) {
    throw new Error("Este Relatório já foi aprovado pelo Curador. Regenerar apagaria a autoria assumida.");
  }
  if (existing?.reviewed_at && !input.force) {
    throw new Error(
      "O Curador já editou este Relatório. Regenerar substituiria o texto dele — se for isso mesmo, a regeneração precisa ser explícita.",
    );
  }

  const draftInput = await buildDraftInput(
    supabase,
    input.caseId,
    selection.options.map((option) => option.professionalProfileId),
  );

  const draft = generateReportDraft(draftInput);

  // O rascunho vai para as mesmas tabelas do Relatório humano — um documento
  // só, nunca dois concorrentes. A ordem segue a da seleção.
  const optionInputs: ReportOptionInput[] = selection.options.map((selected) => {
    const generated = draft.options.find(
      (option) => option.professionalProfileId === selected.professionalProfileId,
    )!;
    return {
      professionalProfileId: selected.professionalProfileId,
      justification: generated.justificativa.text,
      relationToWeights: generated.relacaoPrioridades.text,
      relationalReading: generated.leituraRelacional.text,
      attentionPoints: generated.pontosDeAtencao.items.map((item) => item.text),
      favorablePoints: generated.pontosFavoraveis.map((item) => item.text),
      suggestedQuestions: generated.perguntasSugeridas.map((item) => item.text),
      curatorObservations: null,
    };
  });

  // B-2 (ADR-064): a composição do rascunho é texto de trabalho interno,
  // dirigido ao Curador. Escrita a partir da MESMA constante que a guarda de
  // emissão procura — a deriva entre gerador e guarda é impossível por
  // construção, e o documento definitivo nunca a carrega até a paciente.
  const reportId = await saveReport(
    supabase,
    input.caseId,
    selection.id,
    FRASE_COMPOSICAO_RASCUNHO,
    optionInputs,
  );

  const { error } = await supabase
    .from("curadoria_reports")
    .update({
      assisted_generated_at: new Date().toISOString(),
      generator_version: GENERATOR_VERSION,
      // Regenerar zera a revisão: o texto voltou a ser do sistema.
      reviewed_at: null,
      reviewed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) throw new Error(error.message);

  return { reportId, draft };
}


export type ReportLifecycle = {
  id: string;
  assistedGeneratedAt: string | null;
  generatorVersion: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  emittedAt: string | null;
  deliveredAt: string | null;
};

export async function getReportLifecycle(
  supabase: SupabaseClient,
  curatedSelectionId: string,
): Promise<ReportLifecycle | null> {
  const { data } = await supabase
    .from("curadoria_reports")
    .select("id, assisted_generated_at, generator_version, reviewed_at, approved_at, approved_by, emitted_at, delivered_at")
    .eq("curated_selection_id", curatedSelectionId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    assistedGeneratedAt: (data.assisted_generated_at as string | null) ?? null,
    generatorVersion: (data.generator_version as string | null) ?? null,
    reviewedAt: (data.reviewed_at as string | null) ?? null,
    approvedAt: (data.approved_at as string | null) ?? null,
    approvedBy: (data.approved_by as string | null) ?? null,
    emittedAt: (data.emitted_at as string | null) ?? null,
    deliveredAt: (data.delivered_at as string | null) ?? null,
  };
}
