"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import {
  eligibleProfessionalProfileIds,
  findDeliveredCuradoria,
} from "@/modules/curadoria/delivery-contract";
import {
  createRelationship,
  reconstructRelationshipRecordFromRow,
  RelationshipError,
} from "@/modules/relationship";

import {
  closeWithoutRelationship,
  confirmFirstAppointment,
  correctChoice,
  createConnection,
  defineContactMode,
  registerContactIntent,
  type EligibilityContext,
} from "./commands";
import { ConnectionError } from "./errors";
import { SupabaseConnectionRepository } from "./repository";
import {
  closeWithoutRelationshipInputSchema,
  confirmFirstAppointmentInputSchema,
  correctChoiceInputSchema,
  createConnectionInputSchema,
  defineContactModeInputSchema,
  registerContactIntentInputSchema,
  type CloseWithoutRelationshipFormInput,
  type ConfirmFirstAppointmentFormInput,
  type CorrectChoiceFormInput,
  type CreateConnectionFormInput,
  type DefineContactModeFormInput,
  type RegisterContactIntentFormInput,
} from "./schema";
import type { ConnectionActionResult, ConnectionRecord } from "./types";

// Único ponto de entrada para os cinco comandos do domínio Connection —
// nunca UI, nunca texto editorial, nunca alteração de Caso/Curadoria/ACE.
// Cada action: valida input -> carrega sessão -> confirma autorização ->
// obtém o estado real -> chama o comando puro -> persiste -> responde de
// forma estruturada. Nunca expõe stack trace, ID desnecessário ou detalhe
// de banco (Etapa 7).

function mapErrorToMessage(error: unknown): string {
  if (error instanceof ConnectionError) {
    switch (error.code) {
      case "NOT_OWNER":
        return "Você não tem permissão para alterar este Connection.";
      case "PROFESSIONAL_NOT_IN_DELIVERY":
        return "O profissional escolhido não faz parte da sua Curadoria.";
      case "CORRECTION_NOT_ALLOWED":
        return "A escolha não pode mais ser corrigida.";
      case "INVALID_TRANSITION":
        return "Esta ação não é válida neste momento.";
      case "TERMINAL_STATE":
        return "Este Connection já foi encerrado — nenhuma nova ação é possível.";
      case "CONCURRENT_CONFLICT":
        return "Este Connection foi alterado por outra ação ao mesmo tempo. Atualize a página e tente novamente.";
      default:
        return "Não foi possível concluir esta ação.";
    }
  }
  // Defensivo — createRelationship (chamado internamente por
  // confirmFirstAppointmentAction, PR4) só lança RelationshipError se o
  // autor não for "sistema", o que esta action nunca constrói de forma
  // diferente; nunca deveria ocorrer em operação normal.
  if (error instanceof RelationshipError) {
    return "Não foi possível concluir esta ação.";
  }
  return "Não foi possível concluir esta ação.";
}

// Resolve, a partir do Caso, tudo que uma action precisa para autorizar e
// validar: o próprio Caso (dono), a entrega reconhecida pelo contrato canônico
// e os profissionais elegíveis daquela entrega específica.
//
// A prova de entrega deixou de ser "existe linha em final_curadoria_deliveries".
// Passou a ser a pergunta do contrato — "existe uma Curadoria validamente
// entregue para este Case?" —, que a Curadoria do Método responde e o ACE
// legado só responde quando o Método não respondeu. Esta camada não sabe qual
// das duas respondeu, e não deve saber.
//
// A AUTORIZAÇÃO VEM DA ENTREGA, NÃO DE `cases`.
//
// Antes, a primeira coisa aqui era `getCase(supabase, caseId)` — e ela recusava
// TODA escolha do paciente. A RLS de `cases` autoriza administrador,
// `responsible_id` e `assigned_curator_id`; o paciente não está nessa lista e
// nunca esteve. Ele alcança sua Curadoria pelas tabelas da entrega, não pelo
// Case. O resultado era "Caso não encontrado." para o dono legítimo do Caso.
//
// Funcionava enquanto a prova de entrega era `final_curadoria_deliveries`, que
// o paciente lê. Ao trocar a fonte pelo contrato canônico, a checagem anterior
// ficou sem cobertura — última consequência daquela migração.
//
// A autorização correta já está embutida no que resta: `findDeliveredCuradoria`
// lê `curadoria_reports` sob a RLS do próprio paciente, e a policy daquela
// tabela exige `is_patient_for_case(case_id)`. Alcançar a entrega É a prova de
// ser o paciente do Caso — não uma verificação a menos, uma verificação feita
// pelo banco em vez de pela aplicação. A RPC repete a checagem por dentro.
async function loadAuthorizedContext(caseId: string) {
  const supabase = await createServerSupabaseClient();

  const delivery = await findDeliveredCuradoria(supabase, caseId);
  if (!delivery) {
    return {
      outcome: "error" as const,
      error: "Sua Curadoria ainda não foi entregue.",
    };
  }

  const eligibility: EligibilityContext = {
    eligibleProfessionalProfileIds: [...eligibleProfessionalProfileIds(delivery)],
  };

  return { outcome: "ok" as const, supabase, delivery, eligibility };
}

export async function createConnectionAction(
  input: CreateConnectionFormInput,
): Promise<ConnectionActionResult> {
  const parsed = createConnectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadAuthorizedContext(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const repository = new SupabaseConnectionRepository(context.supabase);

  const existing = await repository.findByCaseId(parsed.data.caseId);
  if (existing) {
    return {
      success: false,
      error: "Este Caso já possui um Connection registrado.",
    };
  }

  const now = new Date().toISOString();

  try {
    const result = createConnection(
      {
        caseId: parsed.data.caseId,
        anchor: context.delivery.anchor,
        patientProfileId: authState.user.id,
        professionalProfileId: parsed.data.professionalProfileId,
        actorId: authState.user.id,
        occurredAt: now,
        recordedAt: now,
      },
      context.eligibility,
    );

    await repository.create(result.record, result.event);
    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

// Comum às quatro actions restantes: carregar o Connection existente do
// Caso (nunca aceitar um connectionId vindo do client — Etapa 6: nenhum ID
// interno desnecessário é exposto) e devolver o repository já pronto.
async function loadExistingConnection(caseId: string) {
  const context = await loadAuthorizedContext(caseId);
  if (context.outcome === "error") {
    return context;
  }

  const repository = new SupabaseConnectionRepository(context.supabase);
  const record = await repository.findByCaseId(caseId);
  if (!record) {
    return {
      outcome: "error" as const,
      error: "Nenhum Connection encontrado para este Caso.",
    };
  }

  return {
    outcome: "ok" as const,
    repository,
    record,
    eligibility: context.eligibility,
  };
}

async function persistTransition(
  repository: SupabaseConnectionRepository,
  previousRecord: ConnectionRecord,
  result: {
    record: ConnectionRecord;
    event: Parameters<SupabaseConnectionRepository["update"]>[2];
  },
): Promise<ConnectionActionResult> {
  try {
    await repository.update(previousRecord.status, result.record, result.event);
    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

export async function correctChoiceAction(
  input: CorrectChoiceFormInput,
): Promise<ConnectionActionResult> {
  const parsed = correctChoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadExistingConnection(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    const result = correctChoice(
      context.record,
      {
        requestedByPatientProfileId: authState.user.id,
        newProfessionalProfileId: parsed.data.newProfessionalProfileId,
        actorId: authState.user.id,
        occurredAt: now,
        recordedAt: now,
      },
      context.eligibility,
    );

    return await persistTransition(context.repository, context.record, result);
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

export async function registerContactIntentAction(
  input: RegisterContactIntentFormInput,
): Promise<ConnectionActionResult> {
  const parsed = registerContactIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadExistingConnection(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    const result = registerContactIntent(context.record, {
      requestedByPatientProfileId: authState.user.id,
      actorId: authState.user.id,
      occurredAt: now,
      recordedAt: now,
    });

    return await persistTransition(context.repository, context.record, result);
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

/**
 * A paciente declara como quer começar. Único ator autorizado: ela.
 *
 * Não é transição — o status não muda —, por isso não passa por
 * `persistTransition`. Idempotente: repetir o mesmo modo devolve sucesso sem
 * gravar evento novo, porque histórico só nasce de mudança real.
 */
export async function defineContactModeAction(
  input: DefineContactModeFormInput,
): Promise<ConnectionActionResult> {
  const parsed = defineContactModeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadExistingConnection(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();
  const previousMode = context.record.contactMode;

  try {
    const result = defineContactMode(context.record, {
      requestedByPatientProfileId: authState.user.id,
      contactMode: parsed.data.contactMode,
      actorId: authState.user.id,
      occurredAt: now,
      recordedAt: now,
    });

    // Mesmo modo: nada a persistir, e isso é sucesso.
    if (result === null) return { success: true };

    await context.repository.setContactMode(
      context.record.id,
      previousMode,
      parsed.data.contactMode,
      result.event,
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

export async function confirmFirstAppointmentAction(
  input: ConfirmFirstAppointmentFormInput,
): Promise<ConnectionActionResult> {
  const parsed = confirmFirstAppointmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadExistingConnection(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    // Marco oficial de nascimento do Relationship (Fase 2, Decisão 4;
    // Fase 3/PR4) — os dois comandos puros (Connection e Relationship)
    // são chamados aqui, nunca contornados; a persistência dos dois
    // efeitos é uma única escrita atômica (RPC dedicada, PR4), nunca duas
    // chamadas separadas.
    const confirmed = confirmFirstAppointment(context.record, {
      requestedByPatientProfileId: authState.user.id,
      actorId: authState.user.id,
      occurredAt: now,
      recordedAt: now,
    });

    const relationshipBirth = createRelationship({
      connectionId: context.record.id,
      caseId: context.record.caseId,
      patientProfileId: context.record.patientProfileId,
      professionalProfileId: context.record.professionalProfileId,
      author: { kind: "sistema", actorId: authState.user.id },
      occurredAt: now,
      recordedAt: now,
    });

    const result =
      await context.repository.confirmFirstAppointmentAndBirthRelationship(
        context.record.status,
        confirmed.record,
        confirmed.event,
        relationshipBirth.event,
      );
    // Reconstrói (nunca uma segunda gravação) só para validar que a
    // linha retornada pela RPC é um RelationshipRecord bem formado —
    // esta action não precisa devolver o Relationship ao cliente
    // (ConnectionActionResult carrega só sucesso/erro).
    reconstructRelationshipRecordFromRow(result.relationshipRow);

    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

export async function closeWithoutRelationshipAction(
  input: CloseWithoutRelationshipFormInput,
): Promise<ConnectionActionResult> {
  const parsed = closeWithoutRelationshipInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireRoleForAction("paciente");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const context = await loadExistingConnection(parsed.data.caseId);
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    const result = closeWithoutRelationship(context.record, {
      requestedByPatientProfileId: authState.user.id,
      actorId: authState.user.id,
      occurredAt: now,
      recordedAt: now,
      reason: parsed.data.reason,
    });

    return await persistTransition(context.repository, context.record, result);
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}
