"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { revalidateCaseSurfaces } from "@/modules/cases/revalidate";

import { resolveOwnProfessionalProfile } from "./escrita-operacional";
// A escala vem do domínio — repetir os literais aqui foi como o valor antigo
// sobreviveu à renomeação e o typecheck teve de encontrá-lo.
import { NEED_DEGREES } from "./protocolos";

import {
  acknowledgePersonNeed,
  loadProtocolDraft,
  registerPersonNeed,
  saveProtocolDraft,
  submitProfessionalProtocol,
  type DraftResponse,
} from "./protocolos-repository";

/**
 * PROTOCOLO DA PRÁTICA — as actions do profissional.
 *
 * O profissional trabalha no PRÓPRIO rascunho (RLS de dono). A submissão é a
 * porta controlada: a sessão dele autentica e resolve o próprio perfil; a
 * escrita na Base — append-only, escrita da operação — atravessa pelo
 * service role, com `collected_by` = ele e fonte dizendo autodeclaração.
 * A proveniência conta a verdade: quem respondeu, quando, e que ninguém
 * verificou ainda.
 */

const draftResponseSchema = z.object({
  options: z.array(z.string().max(120)).max(30),
  details: z.record(z.string(), z.unknown()),
  conditionNote: z.string().max(280).nullable(),
  observation: z.string().max(280).nullable(),
});

const saveDraftSchema = z.object({
  responses: z.record(z.string().max(80), draftResponseSchema),
});

async function resolveOwnProfessionalProfileId(userId: string): Promise<string> {
  const supabase = await createServerSupabaseClient();
  return resolveOwnProfessionalProfile(supabase, userId);
}

export async function saveOwnProtocolDraftAction(input: unknown) {
  const state = await requireAnyRoleForAction(["profissional"]);
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Resposta em formato inválido." };

  const professionalProfileId = await resolveOwnProfessionalProfileId(state.user.id);
  const supabase = await createServerSupabaseClient();

  await saveProtocolDraft(supabase, {
    professionalProfileId,
    responses: parsed.data.responses as Record<string, DraftResponse>,
    updatedBy: state.user.id,
  });

  revalidatePath("/profissional");
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// Protocolo da Pessoa — actions do Curador, dentro da conversa
// ---------------------------------------------------------------------------

const personNeedSchema = z.object({
  caseId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  options: z.array(z.string().max(120)).max(20),
  degree: z.enum(NEED_DEGREES),
  flexibility: z.string().max(280).nullable(),
  guidedText: z.string().max(500).nullable(),
  origin: z.enum(["DIRETO", "TRADUCAO", "DECLARACAO_CLINICA"]),
  proposedReading: z.string().max(500).nullable(),
});

export async function registerPersonNeedAction(input: unknown) {
  const state = await requireAnyRoleForAction(["curador_medico", "administrador"]);
  const parsed = personNeedSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Resposta em formato inválido." };

  const supabase = await createServerSupabaseClient();
  try {
    await registerPersonNeed(supabase, { ...parsed.data, declaredBy: state.user.id });
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  // Uma porta só de revalidação — foi a lista por action que criou o defeito
  // do dado certo atrás de tela velha, e revalidateCaseSurfaces existe para
  // que ele não volte.
  revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

const acknowledgeSchema = z.object({
  caseId: z.string().uuid(),
  subcriterionCode: z.string().max(80),
  acknowledgment: z.enum(["RECONHECIDA", "CORRIGIDA", "RECUSADA"]),
  correction: z.string().max(500).nullable(),
});

export async function acknowledgePersonNeedAction(input: unknown) {
  await requireAnyRoleForAction(["curador_medico", "administrador"]);
  const parsed = acknowledgeSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Formato inválido." };

  const supabase = await createServerSupabaseClient();
  try {
    await acknowledgePersonNeed(supabase, parsed.data);
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

export async function submitOwnProtocolAction() {
  const state = await requireAnyRoleForAction(["profissional"]);
  const professionalProfileId = await resolveOwnProfessionalProfileId(state.user.id);

  const supabase = await createServerSupabaseClient();
  const draft = await loadProtocolDraft(supabase, professionalProfileId);

  if (Object.keys(draft.responses).length === 0) {
    return { success: false as const, error: "Não há respostas para submeter." };
  }

  // A porta controlada: a Base tem escrita da operação; a sessão que chegou
  // até aqui é comprovadamente o dono do perfil, e é ele o autor registrado.
  const service = createAdminSupabaseClient();
  const resultado = await submitProfessionalProtocol(service, {
    professionalProfileId,
    responses: draft.responses,
    collectedBy: state.user.id,
  });

  if (resultado.rejected.length > 0) {
    return {
      success: false as const,
      error: "Algumas respostas não passaram na validação do Catálogo.",
      rejected: resultado.rejected,
    };
  }

  revalidatePath("/profissional");
  return { success: true as const, registered: resultado.registered.length };
}
