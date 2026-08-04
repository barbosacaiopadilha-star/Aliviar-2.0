import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { CuradoriaRecord, FiltroRecord, OpcaoRelatorio } from "./types";
import type { MandatoryFilterKind } from "../types";
import { MANDATORY_FILTER_LABELS } from "../types";
import { loadMesaCruzamento } from "../mesa-cruzamento";

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
  /** M-003 §2.4: a história do Case é esta, e não "qualquer história enviada". */
  source_story_id: string | null;
};

/**
 * M-003 §2.4 — os dois fatos de MATERIAL do Acolhimento.
 *
 * Não é rastreio de leitura (M-001 §0, proibição X2): nada aqui observa o
 * Curador. São fatos sobre o material do paciente — existe história entregue?
 * existe documento vinculado a ela? — e ambos já existiam no banco.
 */
async function materialDoAcolhimento(
  supabase: SupabaseClient,
  sourceStoryId: string | null,
): Promise<{ hasSubmittedStory: boolean; hasLinkedDocument: boolean }> {
  if (!sourceStoryId) return { hasSubmittedStory: false, hasLinkedDocument: false };

  const [{ data: story }, { data: attachments }] = await Promise.all([
    // Só `enviada` conta: rascunho ainda não foi entregue pela paciente (X7).
    supabase.from("patient_stories").select("status").eq("id", sourceStoryId).maybeSingle(),
    // O vínculo é o critério de pertencimento ao Case; órfão não conta (X6).
    supabase
      .from("patient_story_attachments")
      .select("document_id")
      .eq("story_id", sourceStoryId)
      .limit(1),
  ]);

  return {
    hasSubmittedStory: (story?.status as string | undefined) === "enviada",
    hasLinkedDocument: (attachments ?? []).length > 0,
  };
}

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
    .select("id, patient_profile_id, assigned_curator_id, created_at, source_story_id")
    .eq("id", caseId)
    .maybeSingle();

  if (!caseRow) return null;
  const kase = caseRow as CaseRow;

  const [
    { data: consultation },
    { data: clinical },
    { data: profile },
    names,
    material,
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
    materialDoAcolhimento(supabase, kase.source_story_id),
  ]);

  const patientName = names.get(kase.patient_profile_id) ?? "Paciente";
  const curatorName = kase.assigned_curator_id
    ? (names.get(kase.assigned_curator_id) ?? "Curador")
    : "Curador";

  const profileId = (profile?.id as string | undefined) ?? null;

  // M3 (ADR-042): a Memória deixa de carregar `priority_weights`,
  // `compatibility_analyses` e `compatibility_criterion_results`. O que a
  // condução precisa saber da Curadoria Técnica vem das fontes vigentes —
  // a mesma leitura que a Mesa monta (elegibilidade + Motor).
  const [filterRows, selectionRow] = profileId
    ? await Promise.all([
        supabase.from("priority_profile_filters").select("*").eq("priority_profile_id", profileId),
        supabase
          .from("curated_selections")
          .select("*")
          .eq("priority_profile_id", profileId)
          .maybeSingle(),
      ])
    : [{ data: [] }, { data: null }];

  const selectionId = (selectionRow.data?.id as string | undefined) ?? null;

  const [optionRows, reportRow] = await Promise.all([
    selectionId
      ? supabase
          .from("curated_selection_options")
          .select("*")
          .eq("curated_selection_id", selectionId)
          .order("position")
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

  const selectedIds = (optionRows.data ?? []).map((row) => row.professional_profile_id as string);

  // A MESMA leitura que a Mesa monta: elegibilidade (área + filtros) e a
  // leitura do Motor por elegível. Uma fonte só — os números do COS nunca
  // divergem do cabeçalho da Mesa por contarem universos diferentes.
  const view = await loadMesaCruzamento(supabase, caseId, selectedIds.length);

  // ADR-042 — a completude do Mapa é o gate das fases PRIORIDADES e VALIDACAO.
  // Já vem calculada pela mesma leitura; nenhuma segunda definição de "completo".
  const mapaPendentes = view.mapaPendentes;

  const nomePorId = new Map(
    view.professionals.map((profissional) => [
      profissional.professionalProfileId,
      profissional.displayName,
    ]),
  );

  // Nome canônico para quem está na seleção ou no Relatório mas já não está
  // na Rede deste Case (histórico legítimo) — sempre `professional_profiles`.
  const idsForaDaRede = [
    ...new Set(
      [
        ...selectedIds,
        ...(reportOptionRows.data ?? []).map((row) => row.professional_profile_id as string),
      ].filter((id) => !nomePorId.has(id)),
    ),
  ];

  if (idsForaDaRede.length > 0) {
    const { data: profissionaisRows } = await supabase
      .from("professional_profiles")
      .select("id, display_name")
      .in("id", idsForaDaRede);
    for (const row of profissionaisRows ?? []) {
      nomePorId.set(row.id as string, row.display_name as string);
    }
  }

  const leituras = view.comparison.map((coluna) => ({
    professionalId: coluna.professionalProfileId,
    professionalName: nomePorId.get(coluna.professionalProfileId) ?? "Profissional",
    totalSubcriteria: coluna.summary.totalSubcriteria,
    highCompatibility: coluna.summary.highCompatibility,
    mediumCompatibility: coluna.summary.mediumCompatibility,
    informationGaps: coluna.summary.informationGaps,
    notRelevant: coluna.summary.notRelevant,
    gapsWithoutAnyRecord: coluna.summary.gapsWithoutAnyRecord,
    notDeclaredByCase: coluna.summary.notDeclaredByCase,
  }));

  const foraDaSelecao = view.professionals
    .filter((profissional) => profissional.eligibility.state !== "ELEGIVEL")
    .map((profissional) => ({
      professionalId: profissional.professionalProfileId,
      professionalName: profissional.displayName,
      motivo: profissional.eligibility.reason,
    }));

  const filtros: FiltroRecord[] = (filterRows.data ?? [])
    .filter((row) => row.nature === "FILTRO_OBRIGATORIO")
    .map((row) => ({
      id: row.id as string,
      kind: row.kind as string,
      // O rótulo é humano, nunca o enum. Achado do teste em produção: a tela
      // exibia "CUIDADO_CONTINUO" — sigla interna em tela é proibida
      // (Guided Experience §5). O `kind` cru fica no campo `kind`, para
      // auditoria; a tela lê `label`.
      label:
        MANDATORY_FILTER_LABELS[row.kind as MandatoryFilterKind] ?? (row.kind as string),
      value: row.value as string,
      reason: (row.note as string | null) ?? "",
    }));

  const preferencias = (filterRows.data ?? [])
    .filter((row) => row.nature === "PREFERENCIA")
    .map((row) => ({ id: row.id as string, value: row.value as string }));

  const observations = preferencias.map((entry) => entry.value);

  const reportOptions: OpcaoRelatorio[] = (reportOptionRows.data ?? []).map((row) => ({
    professionalId: row.professional_profile_id as string,
    position: row.position as number,
    justification: row.justification as string,
    relationToWeights: row.relation_to_weights as string,
    relationalReading: (row.relational_reading as string | null) ?? null,
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
      hasSubmittedStory: material.hasSubmittedStory,
      hasLinkedDocument: material.hasLinkedDocument,
      // M-003 §9.1 — única leitura dos campos legados em regra de negócio.
      // Sem ela, todo Case conduzido no regime anterior regrediria de fase.
      preparedBefore:
        Boolean(consultation?.context_reviewed) && Boolean(consultation?.documents_reviewed),
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
      mapaPendentes,
      observations,
      preferencias,
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
      elegibilidade: {
        found: view.counts.found,
        awaitingArea: view.counts.awaiting,
        eligible: view.counts.eligible,
        eliminated: view.counts.eliminated,
        pendingInfo: view.counts.pending,
      },
      leituras,
      foraDaSelecao,
      professionalNames: Object.fromEntries(nomePorId),
      selectedProfessionalIds: selectedIds,
      // O id da seleção é o que a entrega precisa endereçar.
      curatedSelectionId: selectionId,
      selectedBy: selectionRow.data ? curatorName : null,
      selectedAt: (selectionRow.data?.created_at as string | null) ?? null,
    },

    relatorio: {
      options: reportOptions,
      compositionRationale: (reportRow.data?.composition_rationale as string | null) ?? null,
      emittedAt: (reportRow.data?.emitted_at as string | null) ?? null,
      deliveredAt: (reportRow.data?.delivered_at as string | null) ?? null,
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

/**
 * Teto defensivo do Painel.
 *
 * `loadCuradoriaRecord` faz ~14 consultas por Caso — o custo de montar a
 * Memória inteira. Carregar N Casos custa 14N, um N+1 clássico: com 100
 * pacientes seriam 1.400 consultas por abertura do Painel.
 *
 * O teto não resolve o N+1; impede que ele degrade a experiência antes de a
 * correção certa existir (um carregador em lote, que agruparia as mesmas
 * consultas com `.in()` e custaria ~14 no total). Enquanto o volume real for
 * de dezenas, este limite nunca é atingido — e quando for, a lista é truncada
 * em vez de a página travar.
 */
export const PAINEL_MAX_CASOS = 60;

/**
 * Casos visíveis para quem está chamando.
 *
 * `ownedBy` existe porque "visível" deixou de ser sinônimo de "meu". Quando a
 * RLS passou a mostrar ao Curador os Cases sem dono — para ele poder assumi-los
 * — esta função, que sempre confiou na RLS como recorte, começou a devolver
 * também o que não é dele. Consequência observada em produção: um Case
 * disponível aparecia em "Suas Curadorias" E na fila de disponíveis ao mesmo
 * tempo, e assumir não mudava nada visível, porque ele já estava na lista.
 *
 * A lição: ao ampliar uma policy, todo código que usava a RLS como filtro
 * implícito muda de significado em silêncio. Quem quer "os meus" precisa dizer.
 */
export async function listCaseIds(
  supabase: SupabaseClient,
  ownedBy?: string,
): Promise<string[]> {
  let query = supabase.from("cases").select("id");

  if (ownedBy) {
    query = query.or(`responsible_id.eq.${ownedBy},assigned_curator_id.eq.${ownedBy}`);
  }

  const { data } = await query.order("updated_at", { ascending: false }).limit(PAINEL_MAX_CASOS);

  return (data ?? []).map((row) => row.id as string);
}

export type AvailableCase = {
  caseId: string;
  patientName: string;
  openedAt: string;
  /** Há quantos dias este Case espera alguém. */
  waitingDays: number;
};

/**
 * Curadorias que não são de ninguém.
 *
 * @metodo Fundamentos §5 — nenhum paciente espera sem que alguém saiba
 * @metodo UX_PRINCIPLES P6 — a fila ordena pelo que falta fazer, nunca por produtividade
 *
 * Por que existe: um Case sem curador atribuído era invisível para todos os
 * curadores — a RLS só mostrava o que já era seu. O trabalho ficava parado sem
 * dono e sem ninguém para descobrir que estava parado.
 *
 * A ordem é por tempo de espera: quem espera há mais tempo aparece primeiro.
 * Não é métrica de produtividade — é a pessoa que está há mais tempo sem
 * resposta.
 */
export async function listAvailableCases(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<AvailableCase[]> {
  const { data } = await supabase
    .from("cases")
    .select("id, created_at, patient_profile_id")
    .is("assigned_curator_id", null)
    .is("responsible_id", null)
    .order("created_at", { ascending: true })
    .limit(PAINEL_MAX_CASOS);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const names = await displayNames(
    supabase,
    rows.map((row) => row.patient_profile_id as string),
  );

  return rows.map((row) => {
    const openedAt = row.created_at as string;
    const dias = Math.floor((now.getTime() - new Date(openedAt).getTime()) / 86_400_000);
    return {
      caseId: row.id as string,
      // Sem o nome, a fila obrigaria o Curador a abrir cada caso para saber de
      // quem é. A RLS agora permite ao Curador ler o nome — e só o nome.
      patientName: names.get(row.patient_profile_id as string) ?? "Paciente",
      openedAt,
      waitingDays: Math.max(0, dias),
    };
  });
}
