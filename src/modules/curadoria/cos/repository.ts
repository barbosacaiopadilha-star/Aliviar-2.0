import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  AnaliseRecord,
  CuradoriaRecord,
  ExclusaoRecord,
  FiltroRecord,
  OpcaoRelatorio,
  PesoRecord,
} from "./types";
import type { CompatibilityBand, PriorityCriterion } from "../types";

/**
 * Leitura da Memória da Curadoria a partir do banco (MISSÃO 209, Fase 3).
 *
 * Monta o mesmo `CuradoriaRecord` que os mocks produziam, agora a partir das
 * 13 tabelas reais. O Motor de Condução, a Jornada e a Mesa continuam
 * funcionando sem saber de onde o registro veio — é por isso que valeu manter
 * a Memória como um tipo único desde a MISSÃO 101.
 *
 * Sempre pelo cliente autenticado: a RLS é quem decide o que cada papel
 * enxerga. Nunca a service role — ela ignoraria exatamente as regras que o
 * Método precisa que sejam invioláveis.
 *
 * Ausência é ausência: uma fase sem linha no banco vira o estado vazio do
 * `CuradoriaRecord`, nunca um valor presumido (Invariante 33).
 */

type CaseRow = {
  id: string;
  patient_profile_id: string;
  assigned_curator_id: string | null;
  created_at: string;
};

async function displayNames(
  supabase: SupabaseClient,
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  return new Map((data ?? []).map((row) => [row.id as string, (row.display_name as string) ?? "Sem nome"]));
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

/**
 * Monta a Memória completa de um Caso. Devolve `null` quando o Caso não
 * existe ou quando a RLS não concede acesso — as duas situações são
 * indistinguíveis de fora, e é assim que deve ser.
 */
export async function loadCuradoriaRecord(
  supabase: SupabaseClient,
  caseId: string,
): Promise<CuradoriaRecord | null> {
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id, patient_profile_id, assigned_curator_id, created_at")
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) return null;
  const kase = caseRow as CaseRow;

  const [
    { data: consultation },
    { data: clinical },
    { data: profile },
    names,
  ] = await Promise.all([
    supabase.from("consultation_records").select("*").eq("case_id", caseId).maybeSingle(),
    supabase.from("case_clinical_context").select("*").eq("case_id", caseId).maybeSingle(),
    supabase
      .from("priority_profiles")
      .select("*")
      .eq("case_id", caseId)
      .neq("status", "SUPERSEDED")
      .maybeSingle(),
    displayNames(supabase, [kase.patient_profile_id, kase.assigned_curator_id]),
  ]);

  const patientName = names.get(kase.patient_profile_id) ?? "Paciente";
  const curatorName = kase.assigned_curator_id
    ? (names.get(kase.assigned_curator_id) ?? "Curador")
    : "Curador";

  const profileId = (profile?.id as string | undefined) ?? null;

  // Só busca o que depende do Perfil quando ele existe — evita quatro
  // consultas inúteis num Caso que ainda não chegou lá.
  const [weightRows, filterRows, selectionRow, analysisRows] = profileId
    ? await Promise.all([
        supabase.from("priority_weights").select("*").eq("priority_profile_id", profileId),
        supabase.from("priority_profile_filters").select("*").eq("priority_profile_id", profileId),
        supabase
          .from("curated_selections")
          .select("*")
          .eq("priority_profile_id", profileId)
          .maybeSingle(),
        supabase.from("compatibility_analyses").select("*").eq("priority_profile_id", profileId),
      ])
    : [{ data: [] }, { data: [] }, { data: null }, { data: [] }];

  const selectionId = (selectionRow.data?.id as string | undefined) ?? null;

  const [optionRows, criterionRows, reportRow] = await Promise.all([
    selectionId
      ? supabase
          .from("curated_selection_options")
          .select("*")
          .eq("curated_selection_id", selectionId)
          .order("position")
      : Promise.resolve({ data: [] }),
    (analysisRows.data ?? []).length > 0
      ? supabase
          .from("compatibility_criterion_results")
          .select("*")
          .in(
            "compatibility_analysis_id",
            (analysisRows.data ?? []).map((row) => row.id as string),
          )
      : Promise.resolve({ data: [] }),
    selectionId
      ? supabase.from("curadoria_reports").select("*").eq("curated_selection_id", selectionId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const reportId = (reportRow.data?.id as string | undefined) ?? null;

  const [reportOptionRows, devolutivaRow, decisionRow] = await Promise.all([
    reportId
      ? supabase.from("curadoria_report_options").select("*").eq("report_id", reportId).order("position")
      : Promise.resolve({ data: [] }),
    reportId
      ? supabase.from("devolutiva_records").select("*").eq("report_id", reportId).maybeSingle()
      : Promise.resolve({ data: null }),
    selectionId
      ? supabase
          .from("patient_curadoria_decisions")
          .select("*")
          .eq("curated_selection_id", selectionId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Nomes dos profissionais analisados/selecionados.
  const professionalIds = [
    ...(analysisRows.data ?? []).map((row) => row.professional_profile_id as string),
    ...(optionRows.data ?? []).map((row) => row.professional_profile_id as string),
  ];
  const uniqueProfessionalIds = [...new Set(professionalIds)];

  const { data: professionalRows } = uniqueProfessionalIds.length
    ? await supabase
        .from("professional_profiles")
        .select("id, display_name")
        .in("id", uniqueProfessionalIds)
    : { data: [] };

  const professionalNames = new Map(
    (professionalRows ?? []).map((row) => [row.id as string, row.display_name as string]),
  );

  const criteriaByAnalysis = new Map<string, AnaliseRecord["criteria"]>();
  for (const row of criterionRows.data ?? []) {
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

  const analyses: AnaliseRecord[] = (analysisRows.data ?? []).map((row) => {
    const criteria = (criteriaByAnalysis.get(row.id as string) ?? []).sort((a, b) => b.weight - a.weight);
    return {
      professionalId: row.professional_profile_id as string,
      professionalName: professionalNames.get(row.professional_profile_id as string) ?? "Profissional",
      internalScore: Number(row.internal_score),
      band: row.band as CompatibilityBand,
      // Cobertura é a soma dos pesos que puderam ser avaliados — derivada dos
      // critérios, nunca de `criteria_without_data`, que conta dimensões e não
      // pontos. É a medida honesta de confiança na análise (Engine §4.2).
      coveredWeight: criteria.reduce(
        (sum, entry) => (entry.alignment === null ? sum : sum + entry.weight),
        0,
      ),
      criteria,
      curatorNote: null,
    };
  });

  const weights: PesoRecord[] = (weightRows.data ?? []).map((row) => ({
    criterion: row.criterion as PriorityCriterion,
    weight: row.weight as number,
    targetValue: (row.target_value as string | null) ?? null,
    evidence: row.evidence as string,
    registeredAt: row.created_at as string,
  }));

  const filtros: FiltroRecord[] = (filterRows.data ?? [])
    .filter((row) => row.nature === "FILTRO_OBRIGATORIO")
    .map((row) => ({
      id: row.id as string,
      kind: row.kind as string,
      label: row.kind as string,
      value: row.value as string,
      reason: (row.note as string | null) ?? "",
    }));

  const observations = (filterRows.data ?? [])
    .filter((row) => row.nature === "PREFERENCIA")
    .map((row) => row.value as string);

  const reportOptions: OpcaoRelatorio[] = (reportOptionRows.data ?? []).map((row) => ({
    professionalId: row.professional_profile_id as string,
    position: row.position as number,
    justification: row.justification as string,
    relationToWeights: row.relation_to_weights as string,
    favorablePoints: (row.favorable_points as string[]) ?? [],
    attentionPoints: (row.attention_points as string[]) ?? [],
    suggestedQuestions: (row.suggested_questions as string[]) ?? [],
    curatorObservations: (row.curator_observations as string | null) ?? null,
  }));

  return {
    caseId: kase.id,
    patientName,
    patientFirstName: firstName(patientName),
    curatorName,
    openedAt: kase.created_at,
    promisedReturn: null,

    acolhimento: {
      contextReviewed: Boolean(consultation?.context_reviewed),
      documentsReviewed: Boolean(consultation?.documents_reviewed),
      meetingScheduledAt: (consultation?.meeting_scheduled_at as string | null) ?? null,
      knownFacts: (consultation?.known_facts as string[]) ?? [],
      openPendencies: (consultation?.open_pendencies as string[]) ?? [],
    },

    historia: {
      narrative: (consultation?.narrative as string | null) ?? null,
      motivation: (consultation?.motivation as string | null) ?? null,
      understandingConfirmedAt: (consultation?.understanding_confirmed_at as string | null) ?? null,
      registeredAt: (consultation?.registered_at as string | null) ?? null,
    },

    caso: {
      diagnosis: (clinical?.diagnosis as string | null) ?? null,
      hypothesis: (clinical?.hypothesis as string | null) ?? null,
      exams: (clinical?.exams as string[]) ?? [],
      treatments: (clinical?.treatments as string[]) ?? [],
      clinicalContext: (clinical?.clinical_context as string | null) ?? null,
      limitations: (clinical?.limitations as string[]) ?? [],
    },

    filtros,

    prioridades: {
      weights,
      observations,
      history: [],
    },

    priorityProfileId: profileId,

    validacao: profile?.validated_at
      ? {
          validatedAt: profile.validated_at as string,
          validationNote: (profile.validation_note as string | null) ?? "",
          correctionsMade: [],
        }
      : null,

    curadoriaTecnica: {
      computedAt: analyses.length > 0 ? ((analysisRows.data ?? [])[0]?.computed_at as string) : null,
      analyses,
      // Exclusões não são persistidas hoje — o Motor as recalcula ao comparar.
      // Ausência aqui é ausência, nunca uma lista fabricada.
      excluded: [] as ExclusaoRecord[],
      selectedProfessionalIds: (optionRows.data ?? []).map((row) => row.professional_profile_id as string),
      selectedBy: selectionRow.data ? curatorName : null,
      selectedAt: (selectionRow.data?.created_at as string | null) ?? null,
    },

    relatorio: {
      options: reportOptions,
      compositionRationale: (reportRow.data?.composition_rationale as string | null) ?? null,
      emittedAt: (reportRow.data?.emitted_at as string | null) ?? null,
    },

    devolutiva: {
      presentedAt: (devolutivaRow.data?.presented_at as string | null) ?? null,
      patientQuestions: (devolutivaRow.data?.patient_questions as string[]) ?? [],
      observations: (devolutivaRow.data?.observations as string[]) ?? [],
      decision: decisionRow.data
        ? {
            outcome: decisionRow.data.outcome as "CHOSEN" | "NONE_OF_THEM",
            chosenProfessionalId: (decisionRow.data.chosen_option_id as string | null) ?? null,
            justification: (decisionRow.data.note as string | null) ?? null,
            decidedAt: decisionRow.data.decided_at as string,
          }
        : null,
      nextSteps: (devolutivaRow.data?.next_steps as string[]) ?? [],
    },
  };
}

/** Casos visíveis para quem está chamando. A RLS já faz o recorte por papel. */
export async function listCaseIds(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("cases")
    .select("id")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => row.id as string);
}
