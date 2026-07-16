"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  requireAnyRoleForAction,
  requireRoleForAction,
} from "@/modules/auth/guard";
import type { AuthState } from "@/modules/auth/session";
import { getCase } from "@/modules/cases/repository";

import {
  closePlanned,
  registerInterruption,
  registerReopening,
} from "./commands";
import { RelationshipError } from "./errors";
import { SupabaseRelationshipRepository } from "./repository";
import {
  declarePlannedRelationshipClosureInputSchema,
  declareRelationshipInterruptionInputSchema,
  registerObservedRelationshipReopeningInputSchema,
  type DeclarePlannedRelationshipClosureFormInput,
  type DeclareRelationshipInterruptionFormInput,
  type RegisterObservedRelationshipReopeningFormInput,
} from "./schema";
import type {
  RelationshipActionResult,
  RelationshipAuthor,
  RelationshipRecord,
} from "./types";

// Único ponto de entrada para os contratos humanos já aprovados do
// domínio Relationship — nunca UI, nunca alteração de Connection/Caso/
// Curadoria/ACE, nunca ExperienceSignal. Cada action: valida input ->
// carrega sessão -> resolve autoria real (nunca confiando em ator/estado
// enviado pelo cliente) -> carrega o Relationship real -> chama o comando
// puro -> persiste via repository/RPC -> responde de forma estruturada.
// Mesmo padrão de connection/actions.ts.
//
// createRelationshipFromConnection (nascimento mecânico) não é exposto
// aqui como action pública — pertence ao PR4 (nascimento automático),
// nunca a uma chamada direta do cliente.

// "Equipe" = exatamente os dois papéis já reais no catálogo desta base
// (ADR-006; mesmos slugs usados por cases/concierge/team) — nenhum papel
// novo é inventado aqui.
const TEAM_ROLE_SLUGS = ["administrador", "curador_medico"] as const;

function mapErrorToMessage(error: unknown): string {
  if (error instanceof RelationshipError) {
    switch (error.code) {
      case "INVALID_AUTHOR":
        return "Você não tem permissão para realizar esta ação neste Relationship.";
      case "INVALID_TRANSITION":
        return "Esta ação não é válida neste momento.";
      case "RELATIONSHIP_NOT_ACTIVE":
        return "Este Relationship já foi encerrado — nenhuma nova ação é possível.";
      case "INVALID_TERMINATION":
        return "Uma observação é obrigatória quando a equipe registra esta interrupção.";
      case "INVALID_REOPEN":
        return "Não foi possível registrar esta reabertura.";
      case "RELATIONSHIP_ALREADY_EXISTS":
        return "Este Connection já possui um Relationship registrado.";
      case "CONNECTION_INVALID":
        return "O Connection referenciado não é válido.";
      case "CONCURRENT_CONFLICT":
        return "Este Relationship foi alterado por outra ação ao mesmo tempo. Atualize a página e tente novamente.";
      default:
        return "Não foi possível concluir esta ação.";
    }
  }
  return "Não foi possível concluir esta ação.";
}

// Carrega o Relationship do próprio Caso do paciente — nunca aceita um
// relationshipId vindo do cliente (mesma disciplina de "nenhum ID interno
// desnecessário exposto" já usada em connection/actions.ts). A checagem
// de posse aqui é redundante e intencional com a que o próprio comando
// puro (assertOwnerPatient) já faz — rejeição limpa e genérica antes de
// sequer chamar o domínio.
async function loadOwnRelationshipContext(
  caseId: string,
  patientProfileId: string,
) {
  const supabase = await createServerSupabaseClient();
  const repository = new SupabaseRelationshipRepository(supabase);
  const record = await repository.findByCaseId(caseId);

  if (!record) {
    return {
      outcome: "error" as const,
      error: "Nenhum Relationship encontrado para este Caso.",
    };
  }
  if (record.patientProfileId !== patientProfileId) {
    return {
      outcome: "error" as const,
      error: "Você não tem permissão para este Relationship.",
    };
  }

  return { outcome: "ok" as const, supabase, repository, record };
}

// Resolve se o ator autenticado é elegível como "equipe" para o Caso do
// Relationship em questão — administrador tem escopo global; curador
// médico só para o Caso ao qual está atribuído (mesmo recorte já usado
// pela RLS do PR1: has_role('administrador') or assigned_curator_id =
// auth.uid()). Nunca inventa uma terceira condição de elegibilidade.
async function resolveTeamEligibility(
  supabase: SupabaseClient,
  authState: AuthState,
  caseId: string,
): Promise<{ outcome: "ok" } | { outcome: "error"; error: string }> {
  if (authState.roles.includes("administrador")) {
    return { outcome: "ok" };
  }

  if (authState.roles.includes("curador_medico")) {
    const kase = await getCase(supabase, caseId);
    if (!kase) {
      return { outcome: "error", error: "Caso não encontrado." };
    }
    if (kase.assignedCuratorId === authState.user.id) {
      return { outcome: "ok" };
    }
  }

  return {
    outcome: "error",
    error: "Você não tem permissão para agir neste Relationship.",
  };
}

export async function declarePlannedRelationshipClosureAction(
  input: DeclarePlannedRelationshipClosureFormInput,
): Promise<RelationshipActionResult> {
  const parsed = declarePlannedRelationshipClosureInputSchema.safeParse(input);
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

  const context = await loadOwnRelationshipContext(
    parsed.data.caseId,
    authState.user.id,
  );
  if (context.outcome === "error") {
    return { success: false, error: context.error };
  }

  const now = new Date().toISOString();

  try {
    const result = closePlanned(context.record, {
      author: { kind: "paciente", patientProfileId: authState.user.id },
      occurredAt: now,
      recordedAt: now,
    });
    await context.repository.update(
      context.record.status,
      result.record,
      result.event,
    );
    revalidatePath("/paciente/curadoria");
    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

// Autoria dupla (Fase 2/Etapa 1): paciente proprietário OU equipe
// (administrador/curador atribuído) — nunca um terceiro caminho, nunca
// equipe agindo "como se fosse" o paciente (o ator gravado no evento é
// sempre o real, paciente ou membro de equipe, nunca simulado).
export async function declareRelationshipInterruptionAction(
  input: DeclareRelationshipInterruptionFormInput,
): Promise<RelationshipActionResult> {
  const parsed = declareRelationshipInterruptionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireAnyRoleForAction(["paciente", ...TEAM_ROLE_SLUGS]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();
  const repository = new SupabaseRelationshipRepository(supabase);
  const record = await repository.findByCaseId(parsed.data.caseId);
  if (!record) {
    return {
      success: false,
      error: "Nenhum Relationship encontrado para este Caso.",
    };
  }

  let author: RelationshipAuthor;
  if (
    authState.roles.includes("paciente") &&
    authState.user.id === record.patientProfileId
  ) {
    author = { kind: "paciente", patientProfileId: authState.user.id };
  } else {
    const eligibility = await resolveTeamEligibility(
      supabase,
      authState,
      record.caseId,
    );
    if (eligibility.outcome === "error") {
      return { success: false, error: eligibility.error };
    }
    author = { kind: "equipe", teamMemberId: authState.user.id };
  }

  const now = new Date().toISOString();

  try {
    const result = registerInterruption(record, {
      author,
      observation: parsed.data.observation ?? null,
      occurredAt: now,
      recordedAt: now,
    });
    await repository.update(record.status, result.record, result.event);
    revalidatePath("/paciente/curadoria");
    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}

// Reabertura observada — exclusivamente equipe (Fase 2/Etapa 4/5). Além
// das garantias já feitas pelo domínio (Relationship terminal, novo Caso
// não vazio) e pelo banco (novo Caso realmente existe), esta action
// resolve tecnicamente três validações adicionais que a especificação
// (Fase 3/Etapa 11) exige mas que dependem de dados fora do domínio puro
// — nunca uma nova regra de produto, apenas a checagem de consistência já
// implícita na própria definição de "reabertura":
//   1. o novo Caso é realmente diferente do Caso original deste
//      Relationship (reabrir para o mesmo Caso não tem sentido);
//   2. o novo Caso pertence ao mesmo paciente deste Relationship (nunca
//      um paciente diferente);
//   3. o evento é temporalmente posterior ao encerramento já registrado
//      (updatedAt do próprio Relationship terminal).
export async function registerObservedRelationshipReopeningAction(
  input: RegisterObservedRelationshipReopeningFormInput,
): Promise<RelationshipActionResult> {
  const parsed =
    registerObservedRelationshipReopeningInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  let authState;
  try {
    authState = await requireAnyRoleForAction([...TEAM_ROLE_SLUGS]);
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const supabase = await createServerSupabaseClient();
  const repository = new SupabaseRelationshipRepository(supabase);
  const record: RelationshipRecord | null = await repository.findByCaseId(
    parsed.data.caseId,
  );
  if (!record) {
    return {
      success: false,
      error: "Nenhum Relationship encontrado para este Caso.",
    };
  }

  const eligibility = await resolveTeamEligibility(
    supabase,
    authState,
    record.caseId,
  );
  if (eligibility.outcome === "error") {
    return { success: false, error: eligibility.error };
  }

  if (parsed.data.newCaseId === record.caseId) {
    return {
      success: false,
      error:
        "O novo Caso precisa ser diferente do Caso original deste Relationship.",
    };
  }

  const newCase = await getCase(supabase, parsed.data.newCaseId);
  if (!newCase) {
    return {
      success: false,
      error: "O novo Caso informado não foi encontrado.",
    };
  }
  if (newCase.patientProfileId !== record.patientProfileId) {
    return {
      success: false,
      error:
        "O novo Caso precisa pertencer ao mesmo paciente deste Relationship.",
    };
  }

  const now = new Date().toISOString();
  if (now < record.updatedAt) {
    // Defesa em profundidade contra relógio de servidor inconsistente —
    // não deveria ocorrer em operação normal.
    return {
      success: false,
      error: "Não foi possível registrar esta reabertura.",
    };
  }

  try {
    const result = registerReopening(record, {
      author: { kind: "equipe", teamMemberId: authState.user.id },
      reference: { newCaseId: parsed.data.newCaseId },
      occurredAt: now,
      recordedAt: now,
    });
    await repository.registerReopening(record.id, result.event);
    revalidatePath("/paciente/curadoria");
    return { success: true };
  } catch (error) {
    return { success: false, error: mapErrorToMessage(error) };
  }
}
