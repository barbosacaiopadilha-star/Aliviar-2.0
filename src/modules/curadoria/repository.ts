import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { computeCompatibility, organizeForCurator, passesMandatoryFilters, type WeightInput } from "./method";
import type {
  CompatibilityAnalysis,
  CompatibilityBand,
  CriterionResult,
  CuratedSelection,
  DecisionOutcome,
  MandatoryFilterKind,
  PatientDecision,
  PriorityCriterion,
  PriorityFilter,
  PriorityProfileDetail,
  PriorityProfileStatus,
  ProviderSnapshot,
  SelectionOption,
} from "./types";

const PROFILE_COLUMNS =
  "id, case_id, curator_id, status, patient_history, validated_at, validation_note, created_at, updated_at";

type ProfileRow = {
  id: string;
  case_id: string;
  curator_id: string;
  status: PriorityProfileStatus;
  patient_history: string | null;
  validated_at: string | null;
  validation_note: string | null;
  created_at: string;
  updated_at: string;
};

async function displayName(supabase: SupabaseClient, profileId: string): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", profileId).maybeSingle();
  return (data?.display_name as string | null) ?? null;
}

// ---------------------------------------------------------------------------
// Perfil de Prioridades
// ---------------------------------------------------------------------------

export async function getActivePriorityProfile(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PriorityProfileDetail | null> {
  const { data, error } = await supabase
    .from("priority_profiles")
    .select(PROFILE_COLUMNS)
    .eq("case_id", caseId)
    .neq("status", "SUPERSEDED")
    .maybeSingle();

  if (error || !data) return null;

  return hydrateProfile(supabase, data as ProfileRow);
}

export async function getPriorityProfileById(
  supabase: SupabaseClient,
  priorityProfileId: string,
): Promise<PriorityProfileDetail | null> {
  const { data, error } = await supabase
    .from("priority_profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", priorityProfileId)
    .maybeSingle();

  if (error || !data) return null;

  return hydrateProfile(supabase, data as ProfileRow);
}

async function hydrateProfile(supabase: SupabaseClient, row: ProfileRow): Promise<PriorityProfileDetail> {
  const [{ data: weightRows }, { data: filterRows }, curatorName] = await Promise.all([
    supabase
      .from("priority_weights")
      .select("id, priority_profile_id, criterion, weight, target_value, evidence, created_at")
      .eq("priority_profile_id", row.id)
      .order("weight", { ascending: false }),
    supabase
      .from("priority_profile_filters")
      .select("id, priority_profile_id, nature, kind, value, note, created_at")
      .eq("priority_profile_id", row.id)
      .order("created_at", { ascending: true }),
    displayName(supabase, row.curator_id),
  ]);

  const weights = (weightRows ?? []).map((weight) => ({
    id: weight.id as string,
    priorityProfileId: weight.priority_profile_id as string,
    criterion: weight.criterion as PriorityCriterion,
    weight: weight.weight as number,
    targetValue: (weight.target_value as string | null) ?? null,
    evidence: weight.evidence as string,
    createdAt: weight.created_at as string,
  }));

  const filters: PriorityFilter[] = (filterRows ?? []).map((filter) => ({
    id: filter.id as string,
    priorityProfileId: filter.priority_profile_id as string,
    nature: filter.nature as PriorityFilter["nature"],
    kind: filter.kind as string,
    value: filter.value as string,
    note: (filter.note as string | null) ?? null,
    createdAt: filter.created_at as string,
  }));

  return {
    id: row.id,
    caseId: row.case_id,
    curatorId: row.curator_id,
    curatorName,
    status: row.status,
    patientHistory: row.patient_history,
    validatedAt: row.validated_at,
    validationNote: row.validation_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    weights,
    mandatoryFilters: filters.filter((filter) => filter.nature === "FILTRO_OBRIGATORIO"),
    preferences: filters.filter((filter) => filter.nature === "PREFERENCIA"),
    totalWeight: weights.reduce((sum, weight) => sum + weight.weight, 0),
  };
}

export async function createPriorityProfile(
  supabase: SupabaseClient,
  caseId: string,
  curatorId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("priority_profiles")
    .insert({ case_id: caseId, curator_id: curatorId })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Já existe uma Consulta Inicial em andamento para este caso.");
  }

  return data.id as string;
}

export async function savePatientHistory(
  supabase: SupabaseClient,
  priorityProfileId: string,
  patientHistory: string,
): Promise<void> {
  const { error } = await supabase
    .from("priority_profiles")
    .update({ patient_history: patientHistory })
    .eq("id", priorityProfileId);

  if (error) throw new Error("Não foi possível salvar a história agora.");
}

export async function saveWeight(
  supabase: SupabaseClient,
  priorityProfileId: string,
  criterion: PriorityCriterion,
  weight: number,
  targetValue: string | null,
  evidence: string,
): Promise<void> {
  const { error } = await supabase.from("priority_weights").upsert(
    {
      priority_profile_id: priorityProfileId,
      criterion,
      weight,
      target_value: targetValue,
      evidence,
    },
    { onConflict: "priority_profile_id,criterion" },
  );

  if (error) throw new Error(error.message);
}

export async function removeWeight(
  supabase: SupabaseClient,
  priorityProfileId: string,
  criterion: PriorityCriterion,
): Promise<void> {
  const { error } = await supabase
    .from("priority_weights")
    .delete()
    .eq("priority_profile_id", priorityProfileId)
    .eq("criterion", criterion);

  if (error) throw new Error(error.message);
}

export async function addFilter(
  supabase: SupabaseClient,
  priorityProfileId: string,
  nature: PriorityFilter["nature"],
  kind: string,
  value: string,
  note: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("priority_profile_filters")
    .insert({ priority_profile_id: priorityProfileId, nature, kind, value, note });

  if (error) throw new Error(error.message);
}

export async function removeFilter(supabase: SupabaseClient, filterId: string): Promise<void> {
  const { error } = await supabase.from("priority_profile_filters").delete().eq("id", filterId);
  if (error) throw new Error(error.message);
}

// A validação do paciente é o que faz o Perfil existir de fato. A soma de 100
// pontos é reforçada pelo banco (enforce_priority_profile_validation) — aqui
// só propagamos a mensagem.
export async function validatePriorityProfile(
  supabase: SupabaseClient,
  priorityProfileId: string,
  validationNote: string,
): Promise<void> {
  const { error } = await supabase
    .from("priority_profiles")
    .update({ status: "VALIDATED", validated_at: new Date().toISOString(), validation_note: validationNote })
    .eq("id", priorityProfileId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Comparar — a base já aprovada da Aliviar, nunca uma busca externa
// ---------------------------------------------------------------------------

/**
 * A Rede operacional — quem o Curador pode comparar num Case real.
 *
 * Quatro exclusões, e todas são o mesmo princípio: o Curador não deve gastar
 * julgamento sobre alguém que não poderia escolher.
 *
 * - inativo — saiu da Rede;
 * - demonstração — nunca existiu;
 * - não publicado — o cadastro ainda está em construção ou verificação;
 * - divergência crítica em aberto — duas fontes discordam sobre um dado que
 *   importa, e enquanto ninguém resolver não há o que oferecer. O perfil pode
 *   ter sido publicado antes de a divergência aparecer; some daqui na hora,
 *   sem esperar decisão de despublicar.
 *
 * E um emparelhamento: Case real vê só profissional real; Case de certificação
 * vê só fixture. Nas duas direções, porque a regra num sentido só deixaria
 * aberta exatamente a porta perigosa — um perfil sintético num Case real.
 */
export async function listApprovedProviders(
  supabase: SupabaseClient,
  options?: { certification?: boolean },
): Promise<ProviderSnapshot[]> {
  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      "id, display_name, status, experience_level, intake_approach, offers_continuous_care, availability_window, crm_uf",
    )
    .eq("status", "ativo")
    .eq("is_demo", false)
    .eq("is_test_fixture", options?.certification === true)
    .eq("publication_status", "publicado");

  if (error) throw new Error("Não foi possível carregar os profissionais da Rede.");

  const { data: divergentes } = await supabase
    .from("verification_divergences")
    .select("professional_profile_id")
    .eq("status", "aberta")
    .eq("severity", "critica");

  const bloqueados = new Set((divergentes ?? []).map((row) => row.professional_profile_id as string));
  const rows = (data ?? []).filter((row) => !bloqueados.has(row.id as string));
  const ids = rows.map((row) => row.id as string);

  const { data: areas } = await supabase
    .from("professional_competency_areas")
    .select("professional_profile_id, domain")
    .in("professional_profile_id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const domainsByProvider = new Map<string, ProviderSnapshot["competencyDomains"]>();
  for (const area of areas ?? []) {
    const key = area.professional_profile_id as string;
    const list = domainsByProvider.get(key) ?? [];
    const domain = area.domain as ProviderSnapshot["competencyDomains"][number];
    if (!list.includes(domain)) list.push(domain);
    domainsByProvider.set(key, list);
  }

  return rows.map((row) => ({
    professionalProfileId: row.id as string,
    displayName: row.display_name as string,
    status: row.status as string,
    experienceLevel: (row.experience_level as ProviderSnapshot["experienceLevel"]) ?? null,
    intakeApproach: (row.intake_approach as ProviderSnapshot["intakeApproach"]) ?? null,
    offersContinuousCare: (row.offers_continuous_care as boolean | null) ?? null,
    availabilityWindow: (row.availability_window as ProviderSnapshot["availabilityWindow"]) ?? null,
    crmUf: (row.crm_uf as string | null) ?? null,
    competencyDomains: domainsByProvider.get(row.id as string) ?? [],
  }));
}

export type ExcludedProvider = { professionalProfileId: string; displayName: string; failures: string[] };

export type CompatibilityRun = {
  analyses: CompatibilityAnalysis[];
  excluded: ExcludedProvider[];
};

// Aplica o Perfil validado a toda a base aprovada, persiste as análises e
// devolve tudo organizado para leitura do Curador. Nunca corta em três.
export async function runCompatibility(
  supabase: SupabaseClient,
  priorityProfileId: string,
): Promise<CompatibilityRun> {
  const profile = await getPriorityProfileById(supabase, priorityProfileId);
  if (!profile) throw new Error("Perfil de Prioridades não encontrado.");
  if (profile.status !== "VALIDATED") {
    throw new Error("A comparação só acontece depois que o paciente valida o Perfil de Prioridades.");
  }

  // O Case decide qual Rede é a dele. Nada aqui escolhe: o emparelhamento é
  // lido do próprio Case.
  const { data: caso } = await supabase
    .from("cases")
    .select("is_certification")
    .eq("id", profile.caseId)
    .maybeSingle();

  const providers = await listApprovedProviders(supabase, {
    certification: caso?.is_certification === true,
  });

  const mandatory = profile.mandatoryFilters.map((filter) => ({
    kind: filter.kind as MandatoryFilterKind,
    value: filter.value,
  }));

  const weights: WeightInput[] = profile.weights.map((weight) => ({
    criterion: weight.criterion,
    weight: weight.weight,
    targetValue: weight.targetValue,
    evidence: weight.evidence,
  }));

  const excluded: ExcludedProvider[] = [];
  const eligible: { provider: ProviderSnapshot; result: ReturnType<typeof computeCompatibility> }[] = [];

  for (const provider of providers) {
    const outcome = passesMandatoryFilters(provider, mandatory);
    if (!outcome.passes) {
      excluded.push({
        professionalProfileId: provider.professionalProfileId,
        displayName: provider.displayName,
        failures: outcome.failures,
      });
      continue;
    }
    eligible.push({ provider, result: computeCompatibility(weights, provider) });
  }

  // Recalcular substitui a análise anterior — o Perfil é imutável depois de
  // validado, então a análise sempre reflete o mesmo Perfil.
  await supabase.from("compatibility_analyses").delete().eq("priority_profile_id", priorityProfileId);

  const analyses: CompatibilityAnalysis[] = [];

  for (const { provider, result } of eligible) {
    const { data, error } = await supabase
      .from("compatibility_analyses")
      .insert({
        case_id: profile.caseId,
        priority_profile_id: priorityProfileId,
        professional_profile_id: provider.professionalProfileId,
        internal_score: result.internalScore,
        band: result.band,
        criteria_without_data: result.criteriaWithoutData,
      })
      .select("id, computed_at")
      .single();

    if (error || !data) throw new Error("Não foi possível registrar a análise de compatibilidade.");

    const analysisId = data.id as string;

    await supabase.from("compatibility_criterion_results").insert(
      result.criteria.map((entry) => ({
        compatibility_analysis_id: analysisId,
        criterion: entry.criterion,
        weight: entry.weight,
        alignment: entry.alignment,
        contribution: entry.contribution,
        explanation: entry.explanation,
      })),
    );

    analyses.push({
      id: analysisId,
      caseId: profile.caseId,
      priorityProfileId,
      professionalProfileId: provider.professionalProfileId,
      professionalName: provider.displayName,
      internalScore: result.internalScore,
      band: result.band,
      criteriaWithoutData: result.criteriaWithoutData,
      criteria: result.criteria,
      computedAt: data.computed_at as string,
    });
  }

  return { analyses: organizeForCurator(analyses), excluded };
}

export async function listCompatibilityAnalyses(
  supabase: SupabaseClient,
  priorityProfileId: string,
): Promise<CompatibilityAnalysis[]> {
  const { data, error } = await supabase
    .from("compatibility_analyses")
    .select(
      "id, case_id, priority_profile_id, professional_profile_id, internal_score, band, criteria_without_data, computed_at",
    )
    .eq("priority_profile_id", priorityProfileId);

  if (error || !data || data.length === 0) return [];

  const analysisIds = data.map((row) => row.id as string);
  const providerIds = data.map((row) => row.professional_profile_id as string);

  const [{ data: criteriaRows }, { data: providerRows }] = await Promise.all([
    supabase
      .from("compatibility_criterion_results")
      .select("compatibility_analysis_id, criterion, weight, alignment, contribution, explanation")
      .in("compatibility_analysis_id", analysisIds),
    supabase.from("professional_profiles").select("id, display_name").in("id", providerIds),
  ]);

  const namesById = new Map((providerRows ?? []).map((row) => [row.id as string, row.display_name as string]));
  const criteriaByAnalysis = new Map<string, CriterionResult[]>();

  for (const row of criteriaRows ?? []) {
    const key = row.compatibility_analysis_id as string;
    const list = criteriaByAnalysis.get(key) ?? [];
    list.push({
      criterion: row.criterion as PriorityCriterion,
      weight: row.weight as number,
      alignment: (row.alignment as number | null) ?? null,
      contribution: Number(row.contribution),
      explanation: row.explanation as string,
    });
    criteriaByAnalysis.set(key, list);
  }

  const analyses: CompatibilityAnalysis[] = data.map((row) => ({
    id: row.id as string,
    caseId: row.case_id as string,
    priorityProfileId: row.priority_profile_id as string,
    professionalProfileId: row.professional_profile_id as string,
    professionalName: namesById.get(row.professional_profile_id as string) ?? "Sem nome",
    internalScore: Number(row.internal_score),
    band: row.band as CompatibilityBand,
    criteriaWithoutData: row.criteria_without_data as number,
    criteria: (criteriaByAnalysis.get(row.id as string) ?? []).sort((a, b) => b.weight - a.weight),
    computedAt: row.computed_at as string,
  }));

  return organizeForCurator(analyses);
}

// ---------------------------------------------------------------------------
// Seleção — autoria humana obrigatória
// ---------------------------------------------------------------------------

export type SelectionOptionInput = {
  professionalProfileId: string;
  band: CompatibilityBand;
  rationale: string;
  tradeOff?: string;
};

/**
 * Um gatilho no banco já recusa perfil de demonstração em
 * `curated_selection_options`. Aqui a recusa vira frase antes de a escrita
 * começar — o Curador precisa saber qual foi o problema, não receber um erro
 * de constraint no meio de uma seleção pela metade.
 */
async function rejectDemoProviders(supabase: SupabaseClient, providerIds: string[]): Promise<void> {
  if (providerIds.length === 0) return;

  const { data } = await supabase
    .from("professional_profiles")
    .select("display_name")
    .in("id", providerIds)
    .eq("is_demo", true);

  if ((data ?? []).length > 0) {
    const nomes = (data ?? []).map((row) => row.display_name as string).join(", ");
    throw new Error(
      `Perfil de demonstração não pode ser oferecido a um paciente: ${nomes}. Estes perfis existem para exercitar o fluxo.`,
    );
  }
}

export async function saveSelection(
  supabase: SupabaseClient,
  caseId: string,
  priorityProfileId: string,
  selectedBy: string,
  compositionRationale: string,
  options: SelectionOptionInput[],
): Promise<string> {
  await rejectDemoProviders(supabase, options.map((option) => option.professionalProfileId));

  const { data: existing } = await supabase
    .from("curated_selections")
    .select("id, status")
    .eq("priority_profile_id", priorityProfileId)
    .maybeSingle();

  if (existing?.status === "DELIVERED") {
    throw new Error("Esta Curadoria já foi entregue ao paciente e não pode mais ser alterada.");
  }

  let selectionId = existing?.id as string | undefined;

  if (selectionId) {
    const { error } = await supabase
      .from("curated_selections")
      .update({ composition_rationale: compositionRationale, selected_by: selectedBy })
      .eq("id", selectionId);
    if (error) throw new Error(error.message);

    await supabase.from("curated_selection_options").delete().eq("curated_selection_id", selectionId);
  } else {
    const { data, error } = await supabase
      .from("curated_selections")
      .insert({
        case_id: caseId,
        priority_profile_id: priorityProfileId,
        selected_by: selectedBy,
        composition_rationale: compositionRationale,
      })
      .select("id")
      .single();

    if (error || !data) throw new Error("Não foi possível salvar a seleção agora.");
    selectionId = data.id as string;
  }

  const { error: optionsError } = await supabase.from("curated_selection_options").insert(
    options.map((option, index) => ({
      curated_selection_id: selectionId,
      professional_profile_id: option.professionalProfileId,
      position: index + 1,
      band: option.band,
      rationale: option.rationale,
      trade_off: option.tradeOff ?? null,
    })),
  );

  if (optionsError) throw new Error(optionsError.message);

  return selectionId;
}

export async function deliverSelection(supabase: SupabaseClient, curatedSelectionId: string): Promise<void> {
  const { error } = await supabase
    .from("curated_selections")
    .update({ status: "DELIVERED", delivered_at: new Date().toISOString() })
    .eq("id", curatedSelectionId);

  if (error) throw new Error(error.message);
}

export async function getSelection(
  supabase: SupabaseClient,
  priorityProfileId: string,
): Promise<CuratedSelection | null> {
  const { data, error } = await supabase
    .from("curated_selections")
    .select(
      "id, case_id, priority_profile_id, selected_by, composition_rationale, status, delivered_at, created_at",
    )
    .eq("priority_profile_id", priorityProfileId)
    .maybeSingle();

  if (error || !data) return null;

  return hydrateSelection(supabase, data);
}

export async function getDeliveredSelectionForCase(
  supabase: SupabaseClient,
  caseId: string,
): Promise<CuratedSelection | null> {
  const { data, error } = await supabase
    .from("curated_selections")
    .select(
      "id, case_id, priority_profile_id, selected_by, composition_rationale, status, delivered_at, created_at",
    )
    .eq("case_id", caseId)
    .eq("status", "DELIVERED")
    .maybeSingle();

  if (error || !data) return null;

  return hydrateSelection(supabase, data);
}

type SelectionRow = {
  id: string;
  case_id: string;
  priority_profile_id: string;
  selected_by: string;
  composition_rationale: string;
  status: CuratedSelection["status"];
  delivered_at: string | null;
  created_at: string;
};

async function hydrateSelection(supabase: SupabaseClient, row: unknown): Promise<CuratedSelection> {
  const selection = row as SelectionRow;

  const { data: optionRows } = await supabase
    .from("curated_selection_options")
    .select("id, curated_selection_id, professional_profile_id, position, band, rationale, trade_off")
    .eq("curated_selection_id", selection.id)
    .order("position", { ascending: true });

  const providerIds = (optionRows ?? []).map((option) => option.professional_profile_id as string);

  const { data: providerRows } = await supabase
    .from("professional_profiles")
    .select("id, display_name")
    .in("id", providerIds.length > 0 ? providerIds : ["00000000-0000-0000-0000-000000000000"]);

  const namesById = new Map((providerRows ?? []).map((provider) => [provider.id as string, provider.display_name as string]));

  const options: SelectionOption[] = (optionRows ?? []).map((option) => ({
    id: option.id as string,
    curatedSelectionId: option.curated_selection_id as string,
    professionalProfileId: option.professional_profile_id as string,
    professionalName: namesById.get(option.professional_profile_id as string) ?? "Sem nome",
    position: option.position as number,
    band: option.band as CompatibilityBand,
    rationale: option.rationale as string,
    tradeOff: (option.trade_off as string | null) ?? null,
  }));

  return {
    id: selection.id,
    caseId: selection.case_id,
    priorityProfileId: selection.priority_profile_id,
    selectedBy: selection.selected_by,
    selectedByName: await displayName(supabase, selection.selected_by),
    compositionRationale: selection.composition_rationale,
    status: selection.status,
    deliveredAt: selection.delivered_at,
    createdAt: selection.created_at,
    options,
  };
}

// ---------------------------------------------------------------------------
// Decisão do paciente
// ---------------------------------------------------------------------------

export async function registerPatientDecision(
  supabase: SupabaseClient,
  caseId: string,
  curatedSelectionId: string,
  outcome: DecisionOutcome,
  chosenOptionId: string | null,
  note: string | null,
): Promise<void> {
  const { error } = await supabase.from("patient_curadoria_decisions").insert({
    case_id: caseId,
    curated_selection_id: curatedSelectionId,
    outcome,
    chosen_option_id: chosenOptionId,
    note,
  });

  if (error) {
    if (error.code === "23505") {
      const existing = await getPatientDecision(supabase, curatedSelectionId);
      if (existing) return;
    }
    throw new Error("Não foi possível registrar sua decisão agora.");
  }
}

export async function getPatientDecision(
  supabase: SupabaseClient,
  curatedSelectionId: string,
): Promise<PatientDecision | null> {
  const { data, error } = await supabase
    .from("patient_curadoria_decisions")
    .select("id, case_id, curated_selection_id, chosen_option_id, outcome, note, decided_at")
    .eq("curated_selection_id", curatedSelectionId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    caseId: data.case_id as string,
    curatedSelectionId: data.curated_selection_id as string,
    chosenOptionId: (data.chosen_option_id as string | null) ?? null,
    outcome: data.outcome as DecisionOutcome,
    note: (data.note as string | null) ?? null,
    decidedAt: data.decided_at as string,
  };
}

// O paciente lê o próprio Perfil validado — incluindo os pesos, que são a
// importância que ele mesmo atribuiu. A RLS já garante o recorte.
export async function getValidatedProfileForPatient(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PriorityProfileDetail | null> {
  const { data, error } = await supabase
    .from("priority_profiles")
    .select(PROFILE_COLUMNS)
    .eq("case_id", caseId)
    .eq("status", "VALIDATED")
    .maybeSingle();

  if (error || !data) return null;

  return hydrateProfile(supabase, data as ProfileRow);
}
