"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction, requireRoleForAction } from "@/modules/auth/guard";

import { validateSelection } from "./method";
import * as repository from "./repository";
import * as reportRepository from "./report-repository";
import {
  addMandatoryFilterInputSchema,
  addPreferenceInputSchema,
  computeCompatibilityInputSchema,
  deliverSelectionInputSchema,
  emitReportInputSchema,
  generateAssistedDraftInputSchema,
  registerAcolhimentoInputSchema,
  registerCasoInputSchema,
  registerDecisionInputSchema,
  registerDevolutivaInputSchema,
  registerHistoriaInputSchema,
  removeFilterInputSchema,
  saveReportInputSchema,
  saveSelectionInputSchema,
  startConsultationInputSchema,
} from "./schema";
import type { CuradoriaActionResult } from "./types";

const CURATOR_ROLES = ["administrador", "curador_medico"] as const;

async function requireCurator() {
  return requireAnyRoleForAction([...CURATOR_ROLES]);
}

function fail(error: unknown, fallback: string): CuradoriaActionResult {
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function revalidateCuradoria(caseId: string) {
  // As rotas reais do Portal do Curador são `/coa/curadoria/...`. Até aqui a
  // revalidação apontava só para `/curador/casos/...`, que é redirect legado —
  // ou seja, nenhuma tela do Curador era de fato revalidada depois de gravar.
  // As duas ficam: quem tem link antigo aberto também recarrega.
  revalidatePath(`/coa/curadoria/casos/${caseId}`, "layout");
  revalidatePath(`/coa/curadoria`);
  revalidatePath(`/curador/casos/${caseId}/curadoria`);
  revalidatePath(`/curador/casos/${caseId}`);
  revalidatePath("/paciente");
  revalidatePath("/paciente/curadoria");
}

// ---------------------------------------------------------------------------
// Consulta Inicial
// ---------------------------------------------------------------------------

export type StartConsultationResult =
  | { success: true; priorityProfileId: string }
  | { success: false; error: string };

export async function startConsultationAction(input: unknown): Promise<StartConsultationResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = startConsultationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    const priorityProfileId = await repository.createPriorityProfile(
      supabase,
      parsed.data.caseId,
      authState.user.id,
    );
    revalidateCuradoria(parsed.data.caseId);
    return { success: true, priorityProfileId };
  } catch (error) {
    return fail(error, "Não foi possível iniciar a Consulta Inicial.") as StartConsultationResult;
  }
}

// `savePatientHistoryAction` foi removida na missão Curadoria Executável: ela
// gravava a história em `priority_profiles.patient_history`, enquanto a fase
// História do COS lê a narrativa que `registerHistoriaAction` escreve. Eram
// dois lugares para a mesma história, e o Motor só olhava para um — quem
// usasse o outro veria a fase "em aberto" depois de ter escrito tudo.

// ---------------------------------------------------------------------------
// Filtros e preferências
// ---------------------------------------------------------------------------

export async function addMandatoryFilterAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = addMandatoryFilterInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    await repository.addFilter(
      supabase,
      parsed.data.priorityProfileId,
      "FILTRO_OBRIGATORIO",
      parsed.data.kind,
      parsed.data.value,
      parsed.data.note ?? null,
    );
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível adicionar o filtro.");
  }
}

export async function addPreferenceAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = addPreferenceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  try {
    // Preferência nunca elimina ninguém — é registrada em texto livre, como o
    // paciente a disse, e informa a conversa do Curador.
    await repository.addFilter(
      supabase,
      parsed.data.priorityProfileId,
      "PREFERENCIA",
      "LIVRE",
      parsed.data.value,
      parsed.data.note ?? null,
    );
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a preferência.");
  }
}

export async function removeFilterAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = removeFilterInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.removeFilter(supabase, parsed.data.filterId);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível remover o item.");
  }
}

// ---------------------------------------------------------------------------
// Pesos
// ---------------------------------------------------------------------------

// A ESCRITA DE PESOS SAIU DAQUI — ADR-042.
//
// `saveAllWeightsAction` e `removeWeightAction` gravavam a distribuição de
// 100 pontos em `priority_weights`. Nenhuma fase do COS, nenhuma etapa da
// Mesa, nenhum ato da paciente e nenhum painel dela dependem mais delas: o
// Mapa de Prioridades é a autoridade.
//
// Foram removidas em vez de desativadas. A tabela e todo o histórico
// permanecem intactos — o que deixou de existir é a porta de entrada, não o
// que já foi escrito. Nenhuma sincronização com o Mapa foi criada: converter
// pontos em níveis seria inventar declarações que a pessoa nunca fez.

// O RECONHECIMENTO DO PERFIL SAIU DAQUI — ADR-042.
//
// `validateProfileAction` exigia `requireCurator()` e os 100 pontos de
// `priority_weights` somando exatamente 100: o ato que o Método define como
// sendo DELA só podia ser executado por outra pessoa, e sob uma condição que
// nunca foi dela. Foi removida, não desativada — action sem chamador é
// capacidade morta, e o repositório tem um teste que cobra isso.
//
// A via vigente é `reconhecerPerfilAction` (src/modules/paciente), executada
// por ela, condicionada só à completude do Mapa de Prioridades. Nenhum dado
// histórico foi tocado.

// ---------------------------------------------------------------------------
// Comparar
// ---------------------------------------------------------------------------

export async function computeCompatibilityAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = computeCompatibilityInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.runCompatibility(supabase, parsed.data.priorityProfileId);
    const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
    if (profile) revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível calcular a compatibilidade.");
  }
}

// ---------------------------------------------------------------------------
// Seleção e entrega — autoria sempre humana
// ---------------------------------------------------------------------------

export async function saveSelectionAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveSelectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const check = validateSelection(parsed.data.options.map((option) => option.professionalProfileId));
  if (!check.valid) return { success: false, error: check.error ?? "Seleção inválida." };

  const supabase = await createServerSupabaseClient();

  const profile = await repository.getPriorityProfileById(supabase, parsed.data.priorityProfileId);
  if (!profile) return { success: false, error: "Perfil de Prioridades não encontrado." };

  try {
    await repository.saveSelection(
      supabase,
      profile.caseId,
      parsed.data.priorityProfileId,
      authState.user.id,
      parsed.data.compositionRationale,
      parsed.data.options,
    );
    revalidateCuradoria(profile.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar a seleção.");
  }
}

export async function deliverSelectionAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = deliverSelectionInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  try {
    await repository.deliverSelection(supabase, parsed.data.curatedSelectionId);

    // Entregar a seleção sem entregar o documento deixaria o paciente com
    // acesso a três nomes e a nenhuma explicação — as policies do Relatório
    // liberam a leitura dele justamente por `delivered_at`.
    const report = await reportRepository.getReportBySelection(
      supabase,
      parsed.data.curatedSelectionId,
    );
    if (report) {
      await reportRepository.markReportDelivered(supabase, report.id);
    }

    revalidatePath("/paciente");
    revalidatePath("/paciente/curadoria");
    revalidatePath("/curador/casos");
    revalidatePath("/coa/curadoria", "layout");
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível entregar a Curadoria.");
  }
}

// ---------------------------------------------------------------------------
// Decisão — só o paciente
// ---------------------------------------------------------------------------

export async function registerDecisionAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerDecisionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();

  const { data: selection } = await supabase
    .from("curated_selections")
    .select("id, case_id, status")
    .eq("id", parsed.data.curatedSelectionId)
    .maybeSingle();

  if (!selection || selection.status !== "DELIVERED") {
    return { success: false, error: "Esta Curadoria ainda não foi apresentada." };
  }

  try {
    await repository.registerPatientDecision(
      supabase,
      selection.case_id as string,
      parsed.data.curatedSelectionId,
      parsed.data.outcome,
      parsed.data.chosenOptionId ?? null,
      parsed.data.note ?? null,
    );
    revalidatePath("/paciente");
    revalidatePath("/paciente/curadoria");
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar sua decisão.");
  }
}

// ---------------------------------------------------------------------------
// Fase 1 — Acolhimento (correção reportada pelo Fundador em 2026-07-24: a
// tela explicava a fase mas não oferecia como RESOLVER os itens em aberto).
// ---------------------------------------------------------------------------

export async function registerAcolhimentoAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerAcolhimentoInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { caseId, contextReviewed, documentsReviewed } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // Upsert por case_id: a Consulta Inicial é uma por Caso. Registrar a
  // revisão NÃO desmarca o que já foi revisado antes — o Acolhimento é
  // acumulativo, nunca regressivo (o paciente nunca recomeça do zero).
  const { data: existing, error: readError } = await supabase
    .from("consultation_records")
    .select("id, context_reviewed, documents_reviewed")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) return { success: false, error: "Não foi possível ler o Acolhimento." };

  const next = {
    context_reviewed: Boolean(existing?.context_reviewed) || contextReviewed,
    documents_reviewed: Boolean(existing?.documents_reviewed) || documentsReviewed,
  };

  const { error } = existing
    ? await supabase.from("consultation_records").update(next).eq("id", existing.id)
    : await supabase
        .from("consultation_records")
        .insert({ case_id: caseId, curator_id: authState.user.id, ...next });

  if (error) return { success: false, error: "Não foi possível registrar o Acolhimento." };

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/acolhimento`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Fases 2 e 3 — História e Caso (ONE ALIVIAR, Problema 1: nenhuma fase
// termina sem CTA; toda declaração é ato do Curador).
// ---------------------------------------------------------------------------

export async function registerHistoriaAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerHistoriaInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { caseId, narrative, confirmUnderstanding } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: readError } = await supabase
    .from("consultation_records")
    .select("id, narrative, understanding_confirmed_at")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) return { success: false, error: "Não foi possível ler a História." };
  if (!existing) {
    // A História pressupõe o Acolhimento — que cria o registro da Consulta.
    return { success: false, error: "Conclua o Acolhimento antes de registrar a História." };
  }

  const patch: Record<string, unknown> = {};
  if (narrative?.trim()) patch.narrative = narrative.trim();
  // Confirmação é acumulativa: uma vez reconhecida, nunca regride (P5).
  if (confirmUnderstanding && !existing.understanding_confirmed_at) {
    patch.understanding_confirmed_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return { success: true };

  const { error } = await supabase.from("consultation_records").update(patch).eq("id", existing.id);
  if (error) return { success: false, error: "Não foi possível registrar a História." };

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/historia`);
  return { success: true };
}

export async function registerCasoAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerCasoInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const { caseId, clinicalContext } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: readError } = await supabase
    .from("case_clinical_context")
    .select("id")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) return { success: false, error: "Não foi possível ler o Caso." };

  const { error } = existing
    ? await supabase.from("case_clinical_context").update({ clinical_context: clinicalContext }).eq("id", existing.id)
    : await supabase.from("case_clinical_context").insert({ case_id: caseId, clinical_context: clinicalContext });

  if (error) return { success: false, error: "Não foi possível registrar o contexto clínico." };

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/caso`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Fase 8 — Relatório
//
// A seleção (curated_selections) e o Relatório (curadoria_reports) são
// artefatos distintos da Ontologia: a seleção é a escolha; o Relatório é o
// documento que o paciente relê sozinho. `saveSelectionAction` continua
// cuidando da primeira — nada foi duplicado aqui.
// ---------------------------------------------------------------------------

type SelectionLookup =
  | { ok: true; selection: NonNullable<Awaited<ReturnType<typeof repository.getSelection>>> }
  | { ok: false; error: string };

async function selectionForProfile(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  priorityProfileId: string,
): Promise<SelectionLookup> {
  const selection = await repository.getSelection(supabase, priorityProfileId);
  if (!selection) {
    return {
      ok: false,
      error:
        "A Curadoria Técnica ainda não foi encerrada — o Relatório nasce das três opções selecionadas.",
    };
  }
  return { ok: true, selection };
}

export async function saveReportAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = saveReportInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();
  const found = await selectionForProfile(supabase, parsed.data.priorityProfileId);
  if (!found.ok) return { success: false, error: found.error };

  try {
    const reportId = await reportRepository.saveReport(
      supabase,
      found.selection.caseId,
      found.selection.id,
      parsed.data.compositionRationale,
      parsed.data.options.map((option) => ({
        professionalProfileId: option.professionalProfileId,
        justification: option.justification,
        relationToWeights: option.relationToWeights,
        attentionPoints: option.attentionPoints,
        favorablePoints: option.favorablePoints,
        suggestedQuestions: option.suggestedQuestions,
        curatorObservations: option.curatorObservations ?? null,
      })),
    );
    // Salvar é revisar — o texto passa a carregar mão humana. Não é aprovar.
    const authState = await requireCurator();
    await reportRepository.markReportReviewed(supabase, reportId, authState.user.id);
    revalidateCuradoria(found.selection.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível salvar o Relatório.");
  }
}

/**
 * Emitir é o Curador dizer "está pronto". Entregar é o paciente receber —
 * são atos separados porque entre eles existe uma conversa a combinar.
 *
 * Emitir pela interface é também o ato explícito em que o Curador assume a
 * autoria da versão final: a aprovação é registrada com o nome dele antes da
 * emissão, e o banco recusa qualquer emissão sem ela. Um rascunho assistido
 * jamais chega aqui sem passar por essa assinatura.
 */
export async function emitReportAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = emitReportInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const found = await selectionForProfile(supabase, parsed.data.priorityProfileId);
  if (!found.ok) return { success: false, error: found.error };

  const report = await reportRepository.getReportBySelection(supabase, found.selection.id);
  if (!report) {
    return { success: false, error: "Escreva o Relatório antes de emiti-lo." };
  }

  try {
    await reportRepository.approveReport(supabase, report.id, authState.user.id);
    await reportRepository.emitReport(supabase, report.id);
    revalidateCuradoria(found.selection.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível emitir o Relatório.");
  }
}

/**
 * Gera o rascunho assistido do Relatório a partir do que já foi declarado e
 * verificado. Determinístico, sem IA: cada frase é rastreável a uma
 * declaração registrada. Nunca sobrescreve trabalho humano em silêncio —
 * regenerar sobre texto editado exige `force` explícito, e sobre aprovado ou
 * emitido não acontece de forma alguma.
 */
export async function generateAssistedDraftAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = generateAssistedDraftInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  const found = await selectionForProfile(supabase, parsed.data.priorityProfileId);
  if (!found.ok) return { success: false, error: found.error };

  try {
    const { generateAndSaveAssistedDraft } = await import("./relatorio-assistido");
    await generateAndSaveAssistedDraft(supabase, {
      caseId: found.selection.caseId,
      priorityProfileId: parsed.data.priorityProfileId,
      force: parsed.data.force ?? false,
    });
    revalidateCuradoria(found.selection.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível gerar o rascunho assistido.");
  }
}

// ---------------------------------------------------------------------------
// Fase 9 — Devolutiva: o registro do encontro
// ---------------------------------------------------------------------------

export async function registerDevolutivaAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registerDevolutivaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createServerSupabaseClient();
  const found = await selectionForProfile(supabase, parsed.data.priorityProfileId);
  if (!found.ok) return { success: false, error: found.error };

  const report = await reportRepository.getReportBySelection(supabase, found.selection.id);
  if (!report?.deliveredAt) {
    return {
      success: false,
      error: "Entregue a Curadoria antes de registrar o encontro em que ela foi apresentada.",
    };
  }

  try {
    await reportRepository.registerDevolutiva(supabase, {
      caseId: found.selection.caseId,
      reportId: report.id,
      presentedBy: authState.user.id,
      patientQuestions: parsed.data.patientQuestions,
      observations: parsed.data.observations,
      nextSteps: parsed.data.nextSteps,
    });
    revalidateCuradoria(found.selection.caseId);
    return { success: true };
  } catch (error) {
    return fail(error, "Não foi possível registrar a apresentação.");
  }
}
