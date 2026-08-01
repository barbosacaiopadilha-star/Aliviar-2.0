"use server";

import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";

import {
  APPROACH_RESPONSE_KINDS,
  APPROACH_RESPONSE_SOURCES,
} from "./approach";
import { SupabaseApproachRepository } from "./approach-repository";
import { ConnectionError } from "./errors";
import type { ConnectionActionResult } from "./types";

/**
 * Ações da continuidade operacional — do Concierge responsável, nunca da
 * paciente.
 *
 * A autorização real é da RLS (`can_access_case`): estas actions checam o
 * papel para dar erro cedo e legível, mas quem decide se a linha pode ser
 * escrita é o banco. Nenhuma delas altera responsabilidade, escolha da
 * paciente ou Relationship.
 */

const idSchema = z.object({ id: z.string().uuid() });
const respondSchema = z.object({
  id: z.string().uuid(),
  responseKind: z.enum(APPROACH_RESPONSE_KINDS),
  responseSource: z.enum(APPROACH_RESPONSE_SOURCES),
});

function toMessage(error: unknown): string {
  if (error instanceof ConnectionError) {
    switch (error.code) {
      case "INVALID_TRANSITION":
        return "Esta ação não é válida neste momento.";
      case "CONCURRENT_CONFLICT":
        return "Já existe uma tentativa aberta para esta escolha.";
      default:
        return "Não foi possível concluir esta ação.";
    }
  }
  return "Não foi possível concluir esta ação.";
}

async function context() {
  const authState = await requireAnyRoleForAction(["concierge", "administrador"]);
  const supabase = await createServerSupabaseClient();
  return {
    actorId: authState.user.id,
    repository: new SupabaseApproachRepository(supabase),
    now: new Date().toISOString(),
  };
}

export async function createApproachAttemptAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = z.object({ connectionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.create(parsed.data.connectionId, actorId, now, now);
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

export async function dispatchApproachAttemptAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.dispatch(parsed.data.id, actorId, now, now);
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/**
 * Registra o desfecho. `INDISPONIVEL` **não** troca o profissional e **não**
 * seleciona substituto — é fato sobre a tentativa, e a escolha continua sendo
 * da paciente.
 */
export async function respondApproachAttemptAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = respondSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.respond(
      parsed.data.id,
      parsed.data.responseKind,
      parsed.data.responseSource,
      actorId,
      now,
      now,
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/** Cancelar a tentativa não encerra a Connection. */
export async function cancelApproachAttemptAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.cancel(parsed.data.id, actorId, now, now);
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/** Ler não executa o trabalho (ADR-044). */
export async function markNotificationReadAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.markRead(parsed.data.id, actorId, now);
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}

/** Arquivar tira da caixa. Não encerra trabalho nem tentativa. */
export async function archiveNotificationAction(
  input: unknown,
): Promise<ConnectionActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  try {
    const { actorId, repository, now } = await context();
    await repository.archive(parsed.data.id, actorId, now);
    return { success: true };
  } catch (error) {
    return { success: false, error: toMessage(error) };
  }
}
