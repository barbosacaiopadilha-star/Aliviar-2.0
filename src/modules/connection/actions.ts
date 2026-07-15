"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";
import { getCase } from "@/modules/cases/repository";
import { getFinalCuradoriaDeliveryForCase } from "@/modules/concierge";

import {
  closeWithoutRelationship,
  confirmFirstAppointment,
  correctChoice,
  createConnection,
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
  registerContactIntentInputSchema,
  type CloseWithoutRelationshipFormInput,
  type ConfirmFirstAppointmentFormInput,
  type CorrectChoiceFormInput,
  type CreateConnectionFormInput,
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
  return "Não foi possível concluir esta ação.";
}

// Resolve, a partir do Caso, tudo que uma action precisa para autorizar e
// validar: o próprio Caso (dono), a FinalCuradoria entregue (prova de que
// P009/P010 já ocorreram — nenhuma Curadoria não validada tem linha em
// final_curadoria_deliveries) e os profissionais elegíveis daquela entrega
// específica.
async function loadAuthorizedContext(caseId: string, patientProfileId: string) {
  const supabase = await createServerSupabaseClient();

  const kase = await getCase(supabase, caseId);
  if (!kase) {
    return { outcome: "error" as const, error: "Caso não encontrado." };
  }
  if (kase.patientProfileId !== patientProfileId) {
    return {
      outcome: "error" as const,
      error: "Você não tem permissão para este Caso.",
    };
  }

  const delivery = await getFinalCuradoriaDeliveryForCase(supabase, caseId);
  if (!delivery) {
    return {
      outcome: "error" as const,
      error: "Sua Curadoria ainda não foi entregue.",
    };
  }

  const eligibility: EligibilityContext = {
    eligibleProfessionalProfileIds: delivery.providerPresentations.map(
      (presentation) => presentation.providerId,
    ),
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

  const context = await loadAuthorizedContext(
    parsed.data.caseId,
    authState.user.id,
  );
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
        finalCuradoriaDeliveryId: context.delivery.id,
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
async function loadExistingConnection(
  caseId: string,
  patientProfileId: string,
) {
  const context = await loadAuthorizedContext(caseId, patientProfileId);
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

  const context = await loadExistingConnection(
    parsed.data.caseId,
    authState.user.id,
  );
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

  const context = await loadExistingConnection(
    parsed.data.caseId,
    authState.user.id,
  );
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

  const context = await loadExistingConnection(
    parsed.data.caseId,
    authState.user.id,
  );
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    // Marco oficial de nascimento de um futuro Relationship (Fase 2,
    // Decisão 4) — nenhum Relationship é criado aqui; apenas a transição
    // de estado é persistida.
    const result = confirmFirstAppointment(context.record, {
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

  const context = await loadExistingConnection(
    parsed.data.caseId,
    authState.user.id,
  );
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
