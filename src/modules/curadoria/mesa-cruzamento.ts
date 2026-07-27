import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PATIENT_CRITERIA,
  TECHNICAL_CRITERIA,
  type Assessment,
  type CriterionEvaluation,
  type CriterionWeight,
  type CruzamentoCriterion,
} from "./cruzamento";
import { listAreaDeclarations, type AreaDeclaration } from "./area-repository";
import {
  budgetOf,
  buildComparison,
  classifyProfessional,
  headerCounts,
  nextStepSentence,
  type BudgetView,
  type ComparisonColumn,
  type MandatoryFilterCheck,
  type ProfessionalEligibility,
} from "./mesa-cruzamento-view";

/**
 * MESA DO CRUZAMENTO — o lado do servidor.
 *
 * Carrega tudo o que a Mesa mostra e grava tudo o que o Curador declara. O
 * cálculo em si mora no domínio (`cruzamento.ts`, intocado) e na visão pura
 * (`mesa-cruzamento-view.ts`); aqui é só banco e montagem.
 *
 * O cliente pré-visualiza o saldo de pontos localmente, mas o que vale é o
 * que passa por aqui — o servidor continua sendo a autoridade.
 */

// ---------------------------------------------------------------------------
// Pesos
// ---------------------------------------------------------------------------

export async function loadCruzamentoWeights(
  supabase: SupabaseClient,
  caseId: string,
): Promise<Partial<Record<CruzamentoCriterion, number>>> {
  const { data, error } = await supabase
    .from("cruzamento_weights")
    .select("criterion, weight")
    .eq("case_id", caseId);

  if (error) throw new Error(error.message);

  return Object.fromEntries(
    (data ?? []).map((row) => [row.criterion as CruzamentoCriterion, row.weight as number]),
  );
}

/**
 * Grava um bloco inteiro de uma vez. O saldo é conferido aqui — um bloco que
 * não fecha em 50 não é persistido pela metade.
 */
export async function saveCruzamentoBlockWeights(
  supabase: SupabaseClient,
  caseId: string,
  block: "TECNICO" | "PRIORIDADES",
  weights: Partial<Record<CruzamentoCriterion, number>>,
  updatedBy: string,
): Promise<void> {
  const criteria = block === "TECNICO" ? TECHNICAL_CRITERIA : PATIENT_CRITERIA;

  // Critério do bloco errado é recusado antes do banco.
  for (const criterion of Object.keys(weights) as CruzamentoCriterion[]) {
    if (!(criteria as readonly string[]).includes(criterion)) {
      throw new Error(`O critério ${criterion} não pertence a este bloco.`);
    }
  }

  const budget = budgetOf(weights, block);
  if (!budget.complete) {
    throw new Error(budget.sentence);
  }

  const { error } = await supabase.from("cruzamento_weights").upsert(
    criteria.map((criterion) => ({
      case_id: caseId,
      criterion,
      weight: weights[criterion] ?? 0,
      updated_by: updatedBy,
    })),
    { onConflict: "case_id,criterion" },
  );

  if (error) throw new Error(error.message);
}

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
): Promise<CriterionDeclaration[]> {
  const { data, error } = await supabase
    .from("criterion_declarations")
    .select("professional_profile_id, criterion, assessment, evidence")
    .eq("case_id", caseId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    professionalProfileId: row.professional_profile_id as string,
    criterion: row.criterion as CruzamentoCriterion,
    assessment: row.assessment as Assessment,
    evidence: row.evidence as string,
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
  profileValidated: boolean;
  weights: Partial<Record<CruzamentoCriterion, number>>;
  budgets: { technical: BudgetView; patient: BudgetView };
  professionals: MesaProfessional[];
  counts: ReturnType<typeof headerCounts>;
  nextStep: string;
  comparison: ComparisonColumn[];
  /** Critérios ainda sem declaração, por profissional elegível. */
  awaitingDeclaration: Record<string, CruzamentoCriterion[]>;
};

const ALL_CRITERIA: readonly CruzamentoCriterion[] = [...TECHNICAL_CRITERIA, ...PATIENT_CRITERIA];

export async function loadMesaCruzamento(
  supabase: SupabaseClient,
  caseId: string,
  selectedCount: number,
): Promise<MesaCruzamentoView> {
  const [{ data: caso }, areaDeclarations, weights, criterionDeclarations] = await Promise.all([
    supabase.from("cases").select("is_certification").eq("id", caseId).single(),
    listAreaDeclarations(supabase, caseId),
    loadCruzamentoWeights(supabase, caseId),
    loadCriterionDeclarations(supabase, caseId),
  ]);

  const isCertification = Boolean(caso?.is_certification);

  // O Perfil validado e os filtros do Case.
  const { data: profile } = await supabase
    .from("priority_profiles")
    .select("id, status")
    .eq("case_id", caseId)
    .maybeSingle();

  const profileValidated = profile?.status === "VALIDATED";

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
  const { data: providerRows } = await supabase
    .from("professional_profiles")
    .select("id, display_name")
    .eq("status", "ativo")
    .eq("is_demo", false)
    .eq("is_test_fixture", isCertification)
    .eq("publication_status", "publicado");

  const providerIds = (providerRows ?? []).map((row) => row.id as string);

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

  const professionals: MesaProfessional[] = (providerRows ?? []).map((row) => {
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

  const budgets = {
    technical: budgetOf(weights, "TECNICO"),
    patient: budgetOf(weights, "PRIORIDADES"),
  };
  const budgetsComplete = budgets.technical.complete && budgets.patient.complete;

  const counts = headerCounts(professionals.map((p) => p.eligibility), selectedCount);

  // A comparação só existe com orçamento fechado e elegíveis declarados.
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

  const weightList: CriterionWeight[] = ALL_CRITERIA.map((criterion) => ({
    criterion,
    weight: weights[criterion] ?? 0,
  }));

  const comparison =
    budgetsComplete && eligibleIds.length > 0
      ? buildComparison(eligibleIds, weightList, evaluationsByProfessional)
      : [];

  return {
    caseId,
    isCertification,
    areaRequirement,
    profileValidated,
    weights,
    budgets,
    professionals,
    counts,
    nextStep: nextStepSentence(counts, budgetsComplete, profileValidated),
    comparison,
    awaitingDeclaration,
  };
}
