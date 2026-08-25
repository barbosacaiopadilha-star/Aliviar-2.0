"use server";

import { revalidatePath } from "next/cache";

import { ErroDaAplicacao, erroDeBanco, falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction, requireRoleForAction } from "@/modules/auth/guard";

import { veredictoDaEmissaoDoCase } from "./emissao-exige-juizo-repository";
import { validateSelection } from "./method";
import * as repository from "./repository";
import * as reportRepository from "./report-repository";
import {
  addMandatoryFilterInputSchema,
  addPreferenceInputSchema,
  deliverSelectionInputSchema,
  emitReportInputSchema,
  generateAssistedDraftInputSchema,
  registerAcolhimentoInputSchema,
  registrarPrimeiroEncontroInputSchema,
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

/**
 * Erros de domínio que o BANCO da Curadoria escreve em português para serem
 * lidos: violação de constraint das guardas (23514) e RAISE EXCEPTION das
 * RPCs/triggers (P0001). Só esses atravessam como estão — erro técnico vira
 * frase digna, e o detalhe fica no log.
 */
const DOMAIN_SQLSTATES = new Set(["23514", "P0001"]);

/**
 * Bloco D: TODA saída de erro registra a causa completa (`registrarErro`,
 * via `falhaParaUsuario`) e devolve frase digna + referência ERR- — quem
 * reporta a referência aponta a linha exata do log. A mensagem exibida:
 *  - erro de domínio do banco (23514/P0001, em PT) — exibida como está;
 *  - ErroDaAplicacao — a frase digna que o repositório já escreveu;
 *  - Error simples — a mensagem de domínio escrita à mão nos repositórios;
 *  - qualquer outra coisa — o fallback da ação.
 */
function fail(escopo: string, error: unknown, fallback: string): CuradoriaActionResult {
  let mensagem = fallback;
  if (error instanceof ErroDaAplicacao) {
    const causa = error.cause as { code?: unknown; message?: unknown } | null | undefined;
    mensagem =
      causa && typeof causa.message === "string" && DOMAIN_SQLSTATES.has(String(causa.code))
        ? causa.message
        : error.message;
  } else if (error instanceof Error) {
    mensagem = error.message;
  }
  return { success: false, error: falhaParaUsuario(escopo, error, { mensagem }) };
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
    return fail("curadoria.startConsultation", error, "Não foi possível iniciar a Consulta Inicial.") as StartConsultationResult;
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
    return fail("curadoria.addMandatoryFilter", error, "Não foi possível adicionar o filtro.");
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
    return fail("curadoria.addPreference", error, "Não foi possível registrar a preferência.");
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
    return fail("curadoria.removeFilter", error, "Não foi possível remover o item.");
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

// A ACTION DE COMPARAR SAIU DAQUI — M5 (ADR-042).
//
// `computeCompatibilityAction` disparava `runCompatibility`: lia
// `priority_weights`, calculava score e banda e gravava `compatibility_analyses`.
// A M1 desligou seu único ponto de entrada (a etapa CAMINHOS passou a consumir
// o Motor) e aqui a action e o executor saem do código. Os dados que eles
// produziram continuam no banco, legíveis.

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
    return fail("curadoria.saveSelection", error, "Não foi possível salvar a seleção.");
  }
}

/**
 * Entrega a Curadoria — adaptador fino da RPC transacional
 * `curadoria.deliver_curadoria` (ADR-048/Bloco B).
 *
 * A sequência antiga (deliverSelection + getReportBySelection +
 * markReportDelivered) podia parar no meio: seleção entregue, Relatório não —
 * a paciente com três nomes e nenhuma explicação; e um erro real na leitura
 * do Relatório era engolido como sucesso. Agora o banco executa seleção,
 * Relatório, case_event e auditoria num único ato: ou tudo, ou nada — e o
 * erro de domínio chega inteiro ao Curador. Revalidação SÓ após sucesso real.
 */
export async function deliverSelectionAction(input: unknown): Promise<CuradoriaActionResult> {
  try {
    await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = deliverSelectionInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("deliver_curadoria", {
    _curated_selection_id: parsed.data.curatedSelectionId,
  });

  // Bloco D: registra a causa completa e devolve referência. A mensagem de
  // domínio da RPC (P0001/23514, em PT) continua chegando inteira ao Curador
  // — `fail` a deixa passar; erro técnico vira a frase digna.
  if (error) {
    return fail(
      "curadoria.deliverSelection",
      erroDeBanco("Não foi possível entregar a Curadoria.", error, {
        curatedSelectionId: parsed.data.curatedSelectionId,
      }),
      "Não foi possível entregar a Curadoria.",
    );
  }

  revalidatePath("/paciente");
  revalidatePath("/paciente/curadoria");
  revalidatePath("/curador/casos");
  revalidatePath("/coa/curadoria", "layout");
  return { success: true };
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
    return fail("curadoria.registerDecision", error, "Não foi possível registrar sua decisão.");
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
  if (!parsed.success) {
    // A recusa de payload vazio (M-003 D-4, DT-06) precisa chegar ao Curador
    // com a própria frase — "Dados inválidos" esconderia o motivo.
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { caseId, knownFacts, openPendencies } = parsed.data;
  const supabase = await createServerSupabaseClient();

  // A Consulta Inicial é uma por Caso (índice único). A linha existe para
  // guardar conteúdo — nunca para destravar fase (M-003 D-1).
  const { data: existing, error: readError } = await supabase
    .from("consultation_records")
    .select("id")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) {
    return fail(
      "curadoria.registerAcolhimento.leitura",
      erroDeBanco("Não foi possível ler o Acolhimento.", readError, { caseId }),
      "Não foi possível ler o Acolhimento.",
    );
  }

  // M-003 D-5: as listas são SUBSTITUÍDAS, não acumuladas — acumular tornaria
  // a correção impossível sem um caminho de remoção, que este pacote não
  // constrói. Com a recusa de vazio (D-4), substituir nunca produz vazio.
  //
  // M-003 §9.2 proibição 1: `context_reviewed` e `documents_reviewed` NÃO
  // aparecem aqui, nem no insert nem no update. Permanecem como histórico.
  const next = { known_facts: knownFacts, open_pendencies: openPendencies };

  const { error } = existing
    ? await supabase.from("consultation_records").update(next).eq("id", existing.id)
    : await supabase
        .from("consultation_records")
        // `curator_id` é NOT NULL: quem cria é quem age, e a autoria fica
        // registrada nativamente (M-003 §8).
        .insert({ case_id: caseId, curator_id: authState.user.id, ...next });

  if (error) {
    return fail(
      "curadoria.registerAcolhimento.gravacao",
      erroDeBanco("Não foi possível registrar o Acolhimento.", error, { caseId }),
      "Não foi possível registrar o Acolhimento.",
    );
  }

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/acolhimento`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Fases 2 e 3 — História e Caso (ONE ALIVIAR, Problema 1: nenhuma fase
// termina sem CTA; toda declaração é ato do Curador).
// ---------------------------------------------------------------------------

export async function registerHistoriaAction(input: unknown): Promise<CuradoriaActionResult> {
  let authState;
  try {
    // M-003 §7.3: passa a capturar o usuário — `curator_id` é NOT NULL e esta
    // action pode agora criar a linha da Consulta. Ajuste mecânico.
    authState = await requireCurator();
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

  if (readError) {
    return fail(
      "curadoria.registerHistoria.leitura",
      erroDeBanco("Não foi possível ler a História.", readError, { caseId }),
      "Não foi possível ler a História.",
    );
  }
  const patch: Record<string, unknown> = {};
  if (narrative?.trim()) patch.narrative = narrative.trim();
  // Confirmação é acumulativa: uma vez reconhecida, nunca regride (P5).
  if (confirmUnderstanding && !existing?.understanding_confirmed_at) {
    patch.understanding_confirmed_at = new Date().toISOString();
  }
  if (Object.keys(patch).length === 0) return { success: true };

  // M-003 D-2: a linha nasce de quem primeiro escreve conteúdo. A dependência
  // artificial "Conclua o Acolhimento antes de registrar a História" existia
  // só porque a action do Acolhimento era a única criadora — e, no ramo B,
  // deixaria a História inalcançável, porque lá não há nada a registrar.
  const { error } = existing
    ? await supabase.from("consultation_records").update(patch).eq("id", existing.id)
    : await supabase
        .from("consultation_records")
        .insert({ case_id: caseId, curator_id: authState.user.id, ...patch });
  if (error) {
    return fail(
      "curadoria.registerHistoria.gravacao",
      erroDeBanco("Não foi possível registrar a História.", error, { caseId }),
      "Não foi possível registrar a História.",
    );
  }

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

  if (readError) {
    return fail(
      "curadoria.registerCaso.leitura",
      erroDeBanco("Não foi possível ler o Caso.", readError, { caseId }),
      "Não foi possível ler o Caso.",
    );
  }

  const { error } = existing
    ? await supabase.from("case_clinical_context").update({ clinical_context: clinicalContext }).eq("id", existing.id)
    : await supabase.from("case_clinical_context").insert({ case_id: caseId, clinical_context: clinicalContext });

  if (error) {
    return fail(
      "curadoria.registerCaso.gravacao",
      erroDeBanco("Não foi possível registrar o contexto clínico.", error, { caseId }),
      "Não foi possível registrar o contexto clínico.",
    );
  }

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
        // ADR-065: `undefined` atravessa intacto — o repositório preserva.
        relationalReading: option.relationalReading,
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
    return fail("curadoria.saveReport", error, "Não foi possível salvar o Relatório.");
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

  // Bloco D (gate D18): a leitura do Relatório agora LANÇA em falha — o
  // catch a transforma em erro visível com referência; `null` continua sendo
  // apenas "o Relatório ainda não foi escrito".
  try {
    const report = await reportRepository.getReportBySelection(supabase, found.selection.id);
    if (!report) {
      return { success: false, error: "Escreva o Relatório antes de emiti-lo." };
    }

    // B-2 (RELEASE BLOCKERS / ADR-064): a composição é a única prosa de
    // abertura que a paciente lê — a voz do Curador enquadrando os três
    // caminhos. O rascunho assistido a preenche com texto de TRABALHO INTERNO
    // ("Revisão do Curador pendente"), e regenerar sobrescreve o que ele
    // escreveu na Mesa. Emitir isso entregaria a ela um bilhete de bastidor no
    // lugar da carta. A emissão recusa — e pede a frase dele.
    const { composicaoPendenteDoCurador } = await import("./relatorio-inteligente");
    const composicao = composicaoPendenteDoCurador(report.compositionRationale);
    if (composicao) {
      return {
        success: false,
        error:
          composicao === "DO_SISTEMA"
            ? "O Relatório não pode ser emitido: a abertura ainda é o texto do rascunho assistido — " +
              "ela fala com você (“Revisão do Curador pendente”), não com a paciente. " +
              "Escreva no campo “Por que estas três, juntas” a sua frase sobre como compôs os três caminhos."
            : "O Relatório não pode ser emitido: falta a abertura — a sua frase sobre por que " +
              "estas três, juntas, servem a esta pessoa. É a primeira coisa que ela lê.",
      };
    }

    // B-1 (RELEASE BLOCKERS / ADR-064): um Relatório emitido é definitivo —
    // ele não pode carregar a frase-sentinela do juízo relacional pendente.
    // A emissão falha NOMEANDO o que ainda depende do Curador.
    const { data: optionRows, error: optionsError } = await supabase
      .from("curadoria_report_options")
      .select("professional_profile_id, relational_reading")
      .eq("report_id", report.id);
    if (optionsError) {
      return fail("curadoria.emitReport", new Error(optionsError.message), "Não foi possível verificar a leitura relacional do Relatório.");
    }
    const { pendenciasDeJuizoRelacional } = await import("./relatorio-inteligente");
    const pendencias = pendenciasDeJuizoRelacional(
      (optionRows ?? []).map((row) => ({
        professionalProfileId: row.professional_profile_id as string,
        relationalReading: (row.relational_reading as string | null) ?? null,
      })),
    );
    if (pendencias.length > 0) {
      const conceitos = [...new Set(pendencias.map((p) => p.conceito))].join("; ");
      return {
        success: false,
        error:
          `O Relatório não pode ser emitido: a leitura relacional sobre ${conceitos} ` +
          `ainda aguarda a sua avaliação em ${pendencias.length} ponto(s). ` +
          `Escreva sua leitura no campo "Como conversa com a forma como ela quer ser cuidada" ` +
          `de cada opção — o documento que ela relê sozinha não pode prometer uma conversa que não virá.`,
      };
    }

    // ADR-094 (saída A, decidida em 25/08) · O JUÍZO HUMANO É CONDIÇÃO DE
    // EMISSÃO. Vem por último entre as guardas de propósito: as anteriores
    // falam do TEXTO que ela vai ler, e esta fala do ATO que o Método reserva
    // a uma pessoa. Se o ato não aconteceu, nem vale conferir a redação.
    //
    // O `SIM-51` encontrou uma Curadoria emitida e entregue com zero juízos,
    // onde o Método exigia nove. `lacunasDeJuizo` sabia dizer o que faltava e
    // tinha um único chamador em todo o `src/`: um painel que só informava.
    const veredicto = await veredictoDaEmissaoDoCase(
      supabase,
      found.selection.caseId,
      found.selection.id,
    );
    if (!veredicto.pode) {
      return { success: false, error: veredicto.motivo };
    }

    await reportRepository.approveReport(supabase, report.id, authState.user.id);
    await reportRepository.emitReport(supabase, report.id);
    revalidateCuradoria(found.selection.caseId);
    return { success: true };
  } catch (error) {
    return fail("curadoria.emitReport", error, "Não foi possível emitir o Relatório.");
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
    return fail("curadoria.generateAssistedDraft", error, "Não foi possível gerar o rascunho assistido.");
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

  // Bloco D (gate D18): falha de leitura vira erro com referência — nunca a
  // conclusão de negócio "entregue antes" com o banco fora do ar.
  try {
    const report = await reportRepository.getReportBySelection(supabase, found.selection.id);
    if (!report?.deliveredAt) {
      return {
        success: false,
        error: "Entregue a Curadoria antes de registrar o encontro em que ela foi apresentada.",
      };
    }

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
    return fail("curadoria.registerDevolutiva", error, "Não foi possível registrar a apresentação.");
  }
}

// ---------------------------------------------------------------------------
// D-9 · O PRIMEIRO ENCONTRO ACONTECEU
// ---------------------------------------------------------------------------

/**
 * Registra que o Primeiro Encontro com o Curador **aconteceu**.
 *
 * Existe porque agendar não é realizar, e porque os produtos do encontro —
 * reconhecimento da história, validação dos mapas — não provam o evento: o
 * Curador pode confirmar entendimento lendo a história, sem ter havido
 * encontro. Sem este ato, a realização só poderia ser inferida, e inferência
 * não é fato.
 *
 * **Idempotente e não destrutivo.** Se já houver prova registrada, a data
 * original permanece: um segundo clique não reescreve quando o encontro
 * aconteceu. O retorno é de sucesso — nada falhou e nada foi duplicado.
 *
 * Não escreve `understanding_confirmed_at`, não valida mapas, não muda fase e
 * não move responsabilidade: o handoff continua dependendo exclusivamente da
 * decisão.
 */
export async function registrarPrimeiroEncontroRealizadoAction(
  input: unknown,
): Promise<CuradoriaActionResult> {
  let authState;
  try {
    authState = await requireCurator();
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registrarPrimeiroEncontroInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { caseId } = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: readError } = await supabase
    .from("consultation_records")
    .select("id, meeting_held_at")
    .eq("case_id", caseId)
    .maybeSingle();

  if (readError) {
    return fail(
      "curadoria.registrarPrimeiroEncontro.leitura",
      erroDeBanco("Não foi possível ler o Acolhimento.", readError, { caseId }),
      "Não foi possível ler o Acolhimento.",
    );
  }

  // Já registrado: a data original é preservada. Sucesso idempotente.
  if (existing?.meeting_held_at) {
    return { success: true };
  }

  const agora = new Date().toISOString();

  const { error } = existing
    ? await supabase
        .from("consultation_records")
        .update({ meeting_held_at: agora })
        .eq("id", existing.id)
        // Corrida entre dois cliques: só grava quem chegar com a coluna ainda
        // vazia. O segundo não sobrescreve o primeiro.
        .is("meeting_held_at", null)
    : await supabase.from("consultation_records").insert({
        case_id: caseId,
        // `curator_id` é NOT NULL: quem age é quem fica registrado.
        curator_id: authState.user.id,
        meeting_held_at: agora,
      });

  if (error) {
    return fail(
      "curadoria.registrarPrimeiroEncontro.gravacao",
      erroDeBanco("Não foi possível registrar o Primeiro Encontro.", error, { caseId }),
      "Não foi possível registrar o Primeiro Encontro.",
    );
  }

  revalidateCuradoria(caseId);
  revalidatePath(`/portal-curador/casos/${caseId}/acolhimento`);
  return { success: true };
}
