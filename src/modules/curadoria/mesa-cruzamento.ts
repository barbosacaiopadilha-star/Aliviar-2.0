import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PATIENT_CRITERIA,
  TECHNICAL_CRITERIA,
  type Assessment,
  type CriterionEvaluation,
  type CruzamentoCriterion,
} from "./cruzamento";
import { listAreaDeclarations, type AreaDeclaration } from "./area-repository";
import { loadCasePriorityMap, listSubcriterionCatalog } from "./mapa-prioridades-repository";
import { loadProfessionalMap } from "./mapa-profissional-repository";
import {
  crossPriorityAndProfessional,
  type CompatibilityReading,
} from "./motor-compatibilidade";
import {
  loadCurrentPracticeEvidence,
  summarizePracticeEvidence,
  type PracticeEvidenceSummary,
} from "./evidencias-pratica-repository";
import { loadCaseNeeds, type CaseNeedRecord } from "./protocolos-repository";
import { isProfileAcknowledged } from "./reconhecimento-do-perfil";
import { listCriticalDivergenceBlocklist } from "./rede-policy";
import type { PriorityProfileStatus } from "./types";
import {
  buildComparison,
  classifyProfessional,
  headerCounts,
  nextStepSentence,
  type ComparisonColumn,
  type MandatoryFilterCheck,
  type ProfessionalEligibility,
} from "./mesa-cruzamento-view";

/**
 * MESA DO CRUZAMENTO — o lado do servidor.
 *
 * Carrega tudo o que a Mesa mostra e grava tudo o que o Curador declara. A
 * leitura de compatibilidade vem pronta do Motor (ADR-041) e a classificação
 * de elegibilidade mora na visão pura (`mesa-cruzamento-view.ts`); aqui é só
 * banco e montagem.
 *
 * O servidor é a autoridade sobre tudo o que a Mesa apresenta — nenhuma tela
 * recalcula regra de domínio.
 */

// ---------------------------------------------------------------------------
// Pesos
// ---------------------------------------------------------------------------

// `loadCruzamentoWeights` e `saveCruzamentoBlockWeights` foram removidas —
// ADR-042. A Mesa não lê nem escreve `cruzamento_weights`: a autoridade é o
// Mapa de Prioridades, cruzado com o Mapa do Profissional pelo Motor. A
// tabela e todo o histórico permanecem intactos; o que deixou de existir é o
// caminho de código, não o dado.

// ---------------------------------------------------------------------------
// Declarações de critério
// ---------------------------------------------------------------------------

export type CriterionDeclaration = {
  professionalProfileId: string;
  criterion: CruzamentoCriterion;
  assessment: Assessment;
  evidence: string;
};

export async function declareCriterion(
  supabase: SupabaseClient,
  caseId: string,
  declaration: CriterionDeclaration & { declaredBy: string },
): Promise<void> {
  const { error } = await supabase.from("criterion_declarations").upsert(
    {
      case_id: caseId,
      professional_profile_id: declaration.professionalProfileId,
      criterion: declaration.criterion,
      assessment: declaration.assessment,
      evidence: declaration.evidence,
      declared_by: declaration.declaredBy,
    },
    { onConflict: "case_id,professional_profile_id,criterion" },
  );

  if (error) throw new Error(error.message);
}

export async function loadCriterionDeclarations(
  supabase: SupabaseClient,
  caseId: string,
): Promise<(CriterionDeclaration & { declaredBy: string; declaredAt: string })[]> {
  const { data, error } = await supabase
    .from("criterion_declarations")
    .select("professional_profile_id, criterion, assessment, evidence, declared_by, declared_at")
    .eq("case_id", caseId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    professionalProfileId: row.professional_profile_id as string,
    criterion: row.criterion as CruzamentoCriterion,
    assessment: row.assessment as Assessment,
    evidence: row.evidence as string,
    declaredBy: row.declared_by as string,
    declaredAt: row.declared_at as string,
  }));
}

// ---------------------------------------------------------------------------
// A Mesa inteira
// ---------------------------------------------------------------------------

export type MesaProfessional = {
  professionalProfileId: string;
  displayName: string;
  cityUf: string | null;
  areaRawText: string | null;
  areaTags: string[];
  areaSource: string | null;
  areaVerificationStatus: string | null;
  areaVerifiedAt: string | null;
  eligibility: ProfessionalEligibility;
  declaration: AreaDeclaration | null;
};

export type MesaCruzamentoView = {
  caseId: string;
  isCertification: boolean;
  areaRequirement: string | null;
  profileAcknowledged: boolean;
  /** A leitura do Motor por profissional — ADR-041. Nunca recalculada na tela. */
  compatibilidade: Record<string, CompatibilityReading>;
  /** Subcritérios do catálogo ativo que o Case ainda não classificou. */
  mapaPendentes: number;
  professionals: MesaProfessional[];
  counts: ReturnType<typeof headerCounts>;
  nextStep: string;
  comparison: ComparisonColumn[];
  /** Critérios ainda sem declaração, por profissional elegível. */
  awaitingDeclaration: Record<string, CruzamentoCriterion[]>;
  /**
   * Resumo da Base de Evidências de Prática por profissional da Rede —
   * contagens de estado (verificado, declarado, divergente, desatualizado,
   * revisão pendente), nunca juízo. É por aqui que o Curador enxerga o que
   * está vencido ou divergente antes de concluir qualquer coisa.
   */
  evidencias: Record<string, PracticeEvidenceSummary>;
  /**
   * As necessidades do Protocolo da Pessoa — POR CASE, com origem, leitura
   * proposta e reconhecimento. Não são o Mapa de Prioridades e não alimentam
   * o Motor: são o que a pessoa disse, na forma em que disse.
   */
  necessidades: CaseNeedRecord[];
};

const ALL_CRITERIA: readonly CruzamentoCriterion[] = [...TECHNICAL_CRITERIA, ...PATIENT_CRITERIA];

export async function loadMesaCruzamento(
  supabase: SupabaseClient,
  caseId: string,
  selectedCount: number,
): Promise<MesaCruzamentoView> {
  const [{ data: caso }, areaDeclarations, priorityMap, criterionDeclarations] = await Promise.all([
    supabase.from("cases").select("is_certification").eq("id", caseId).single(),
    listAreaDeclarations(supabase, caseId),
    loadCasePriorityMap(supabase, caseId),
    loadCriterionDeclarations(supabase, caseId),
  ]);

  const isCertification = Boolean(caso?.is_certification);

  // O Perfil validado e os filtros do Case.
  const { data: profile } = await supabase
    .from("priority_profiles")
    .select("id, status")
    .eq("case_id", caseId)
    .maybeSingle();

  // ADR-042: reconhecimento da paciente, não validação de critérios.
  const profileAcknowledged = isProfileAcknowledged(profile?.status as PriorityProfileStatus);

  const { data: filterRows } = profile
    ? await supabase
        .from("priority_profile_filters")
        .select("kind, value")
        .eq("priority_profile_id", profile.id)
        .eq("nature", "FILTRO_OBRIGATORIO")
    : { data: [] };

  const areaRequirement =
    (filterRows ?? []).find((row) => row.kind === "AREA_DE_ATUACAO")?.value ?? null;
  const requiredUf = (filterRows ?? []).find((row) => row.kind === "UF")?.value ?? null;
  const requiresContinuous = (filterRows ?? []).some(
    (row) => row.kind === "CUIDADO_CONTINUO" && row.value === "true",
  );

  // A Rede que este Case enxerga — o emparelhamento decide qual.
  //
  // NC-22: a exclusão por divergência crítica em aberto acontece AQUI, na
  // construção da Rede, e não depois. É o menor ponto que alinha os três
  // consumidores de uma vez — a Mesa, a seleção dos três caminhos e o COS
  // leem esta mesma lista. Um profissional cujas fontes discordam não chega
  // a ser classificado: não há o que declarar sobre quem a Rede não oferece.
  const [{ data: providerRows }, bloqueados] = await Promise.all([
    supabase
      .from("professional_profiles")
      .select("id, display_name")
      .eq("status", "ativo")
      .eq("is_demo", false)
      .eq("is_test_fixture", isCertification)
      .eq("publication_status", "publicado"),
    listCriticalDivergenceBlocklist(supabase),
  ]);

  const providers = (providerRows ?? []).filter((row) => !bloqueados.has(row.id as string));
  const providerIds = providers.map((row) => row.id as string);

  const [{ data: areas }, { data: careModels }] = await Promise.all([
    supabase
      .from("professional_practice_areas")
      .select("professional_profile_id, raw_text, tags, source, verification_status, verified_at")
      .in("professional_profile_id", providerIds.length > 0 ? providerIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("professional_care_model")
      .select("professional_profile_id, states, cities, offers_continuous_care")
      .in("professional_profile_id", providerIds.length > 0 ? providerIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const areaByProvider = new Map((areas ?? []).map((row) => [row.professional_profile_id as string, row]));
  const careByProvider = new Map((careModels ?? []).map((row) => [row.professional_profile_id as string, row]));
  const declarationByProvider = new Map(areaDeclarations.map((d) => [d.professionalProfileId, d]));

  const professionals: MesaProfessional[] = providers.map((row) => {
    const id = row.id as string;
    const area = areaByProvider.get(id);
    const care = careByProvider.get(id);

    const filters: MandatoryFilterCheck[] = [];
    if (requiredUf) {
      const states = (care?.states as string[] | undefined) ?? [];
      filters.push({
        label: `Atendimento em ${requiredUf}`,
        requirement: requiredUf,
        professionalValue: states.length > 0 ? states.join(", ") : "informação não localizada",
        passes: !care || states.length === 0 ? null : states.includes(requiredUf),
      });
    }
    if (requiresContinuous) {
      const offers = care?.offers_continuous_care as boolean | null | undefined;
      filters.push({
        label: "Cuidado contínuo",
        requirement: "obrigatório",
        professionalValue:
          offers === true ? "oferece" : offers === false ? "não oferece" : "informação não localizada",
        passes: offers === null || offers === undefined ? null : offers,
      });
    }

    const declaration = declarationByProvider.get(id) ?? null;

    return {
      professionalProfileId: id,
      displayName: row.display_name as string,
      cityUf: care
        ? [((care.cities as string[]) ?? [])[0], ((care.states as string[]) ?? [])[0]].filter(Boolean).join("/") || null
        : null,
      areaRawText: (area?.raw_text as string | undefined) ?? null,
      areaTags: (area?.tags as string[] | undefined) ?? [],
      areaSource: (area?.source as string | undefined) ?? null,
      areaVerificationStatus: (area?.verification_status as string | undefined) ?? null,
      areaVerifiedAt: (area?.verified_at as string | undefined) ?? null,
      eligibility: classifyProfessional(
        id,
        declaration
          ? {
              compatibility: declaration.compatibility,
              confirmedByCurator: declaration.confirmedByCurator,
              rationale: declaration.rationale,
            }
          : null,
        filters,
      ),
      declaration,
    };
  });

  const mapaCompleto = priorityMap.completion.status === "COMPLETE";

  const counts = headerCounts(professionals.map((p) => p.eligibility), selectedCount);

  // A comparação só existe com o Mapa completo e elegíveis declarados.
  const eligibleIds = professionals
    .filter((p) => p.eligibility.state === "ELEGIVEL")
    .map((p) => p.professionalProfileId);

  const evaluationsByProfessional = new Map<string, CriterionEvaluation[]>();
  const awaitingDeclaration: Record<string, CruzamentoCriterion[]> = {};

  for (const id of eligibleIds) {
    const declared = criterionDeclarations.filter((d) => d.professionalProfileId === id);
    const declaredBy = new Map(declared.map((d) => [d.criterion, d]));

    awaitingDeclaration[id] = ALL_CRITERIA.filter((criterion) => !declaredBy.has(criterion));

    evaluationsByProfessional.set(
      id,
      declared.map((d) => ({ criterion: d.criterion, assessment: d.assessment, evidence: d.evidence })),
    );
  }

  // O cruzamento vem do Motor, um por profissional elegível. A Mesa não
  // reproduz a matriz: se reproduzisse, existiriam duas verdades sobre o
  // mesmo par (Case, profissional).
  const catalogo = await listSubcriterionCatalog(supabase, { includeInactive: false });
  const activeSubcriterionCodes = catalogo.map((entry) => entry.code);
  const casePriorities = priorityMap.items.map((item) => ({
    subcriterionCode: item.subcriterionCode,
    importance: item.importance,
  }));

  const readings = new Map<string, CompatibilityReading>();
  for (const id of eligibleIds) {
    const mapa = await loadProfessionalMap(supabase, id);
    readings.set(
      id,
      crossPriorityAndProfessional({
        casePriorities,
        professionalStates: mapa.items.map((item) => ({
          subcriterionCode: item.subcriterionCode,
          status: item.status,
        })),
        activeSubcriterionCodes,
      }),
    );
  }

  const comparison = eligibleIds.length > 0 ? buildComparison(eligibleIds, readings, catalogo) : [];

  // A Base de Evidências acompanha a Rede inteira — não só os elegíveis:
  // evidência vencida ou divergente interessa ao Curador antes mesmo da
  // declaração de área. Resumo por contagem; conclusão nenhuma.
  const [evidencePorProfissional, necessidades] = await Promise.all([
    loadCurrentPracticeEvidence(
      supabase,
      professionals.map((p) => p.professionalProfileId),
    ),
    loadCaseNeeds(supabase, caseId),
  ]);
  const agora = new Date().toISOString();
  const evidencias = Object.fromEntries(
    professionals.map((p) => [
      p.professionalProfileId,
      summarizePracticeEvidence(evidencePorProfissional.get(p.professionalProfileId) ?? [], agora),
    ]),
  );

  return {
    caseId,
    isCertification,
    areaRequirement,
    profileAcknowledged,
    compatibilidade: Object.fromEntries(readings),
    mapaPendentes: priorityMap.completion.pending,
    professionals,
    counts,
    nextStep: nextStepSentence(counts, mapaCompleto, profileAcknowledged),
    comparison,
    awaitingDeclaration,
    evidencias,
    necessidades,
  };
}
