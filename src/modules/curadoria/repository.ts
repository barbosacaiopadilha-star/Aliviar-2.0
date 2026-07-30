import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CuratedSelection,
  DecisionOutcome,
  HistoricalCompatibilityBand,
  PatientDecision,
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

/**
 * M5 (ADR-042): a leitura de `priority_weights` saiu daqui.
 *
 * Ela existia para alimentar `runCompatibility` e a prontidão de validação —
 * ambos removidos nesta onda. Sem consumidor, uma leitura "histórica" seria só
 * uma porta aberta para o modelo aposentado voltar. A tabela e os dados
 * permanecem intactos no banco; o que deixou de existir é o caminho de código.
 */
async function hydrateProfile(supabase: SupabaseClient, row: ProfileRow): Promise<PriorityProfileDetail> {
  const [{ data: filterRows }, curatorName] = await Promise.all([
    supabase
      .from("priority_profile_filters")
      .select("id, priority_profile_id, nature, kind, value, note, created_at")
      .eq("priority_profile_id", row.id)
      .order("created_at", { ascending: true }),
    displayName(supabase, row.curator_id),
  ]);

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
    mandatoryFilters: filters.filter((filter) => filter.nature === "FILTRO_OBRIGATORIO"),
    preferences: filters.filter((filter) => filter.nature === "PREFERENCIA"),
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

// `saveWeight` e `removeWeight` foram removidas — ADR-042. `priority_weights`
// não recebe mais gravação por nenhuma via da aplicação. A leitura histórica
// permanece (listWeights / loadCuradoriaRecord) e os dados seguem intactos.

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
// A Rede operacional — a base já aprovada da Aliviar, nunca uma busca externa
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
 *
 * M5 (ADR-042): preservada. Não é peça do motor aposentado — é a política da
 * Rede, regra vigente do Método, certificada por
 * `politica-de-fontes.integration.test.ts`. Seu único chamador de produção era
 * `runCompatibility`; hoje ela existe como definição executável dessa política.
 * A Mesa monta a própria consulta de Rede e NÃO aplica a exclusão por
 * divergência crítica — lacuna herdada, registrada para decisão futura.
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

// ---------------------------------------------------------------------------
// Seleção — autoria humana obrigatória
// ---------------------------------------------------------------------------

// M2 (ADR-042): `band` saiu do contrato — a seleção nova grava apenas o que
// tem autoridade vigente. A coluna permanece no banco como histórico.
export type SelectionOptionInput = {
  professionalProfileId: string;
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
    // Leitura histórica: seleções antigas carregam a banda gravada à época;
    // seleções novas vêm sem ela — e ausência é ausência, nunca "MODERADA".
    // Este é o ÚNICO consumidor autorizado de `HistoricalCompatibilityBand`.
    band: (option.band as HistoricalCompatibilityBand | null) ?? null,
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
