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
import { PRACTICE_CONCEPTS_BY_CODE } from "./evidencias-pratica";
import { NEED_DEGREES, PERSON_QUESTIONS_BY_CODE } from "./protocolos";

import {
  acknowledgePersonNeed,
  loadProtocolDraft,
  registerPersonNeed,
  saveProtocolDraft,
  submitProfessionalProtocol,
  type DraftResponse,
  TEAM_REGISTRATION_SOURCE,
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

// O schema recusa desconhecido ANTES do domínio: conceito e opção são os do
// catálogo GERADO do banco (fonte única) — nunca rótulo, nunca cópia antiga.
const saveDraftSchema = z
  .object({
    responses: z.record(z.string().max(80), draftResponseSchema),
  })
  .superRefine((data, ctx) => {
    for (const [codigo, resposta] of Object.entries(data.responses)) {
      const conceito = PRACTICE_CONCEPTS_BY_CODE.get(codigo);
      if (!conceito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responses", codigo],
          message: `"${codigo}" não é conceito do Catálogo Canônico vigente.`,
        });
        continue;
      }
      for (const opcao of resposta.options) {
        if (!(opcao in conceito.options)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["responses", codigo, "options"],
            message: `"${opcao}" não é opção canônica de ${codigo}.`,
          });
        }
      }
    }
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

const personNeedSchema = z
  .object({
    caseId: z.string().uuid(),
    subcriterionCode: z.string().max(80),
    options: z.array(z.string().max(120)).max(20),
    degree: z.enum(NEED_DEGREES),
    flexibility: z.string().max(280).nullable(),
    guidedText: z.string().max(500).nullable(),
    origin: z.enum(["DIRETO", "TRADUCAO", "DECLARACAO_CLINICA"]),
    proposedReading: z.string().max(500).nullable(),
  })
  .superRefine((data, ctx) => {
    const pergunta = PERSON_QUESTIONS_BY_CODE.get(data.subcriterionCode);
    if (!pergunta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subcriterionCode"],
        message: `"${data.subcriterionCode}" não tem lado da pessoa no protocolo.`,
      });
      return;
    }
    for (const opcao of data.options) {
      if (!(opcao in pergunta.options)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: `"${opcao}" não é opção canônica de ${pergunta.id} (${data.subcriterionCode}).`,
        });
      }
    }
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

/**
 * DT-22 — `correction` guarda o texto dela nos DOIS desfechos que afirmam algo
 * sobre a tradução: o substitutivo (`CORRIGIDA`) e a justificativa da
 * discordância (`RECUSADA`). Reconhecer não tem o que guardar.
 *
 * A recusa é validada aqui e no repositório: a superfície nunca é a única
 * guarda de um conteúdo que pertence a ela.
 */
const acknowledgeSchema = z
  .object({
    caseId: z.string().uuid(),
    subcriterionCode: z.string().max(80),
    acknowledgment: z.enum(["RECONHECIDA", "CORRIGIDA", "RECUSADA"]),
    correction: z.string().max(500).nullable(),
  })
  .refine(
    (dados) =>
      dados.acknowledgment === "RECONHECIDA" || (dados.correction ?? "").trim().length > 0,
    {
      message:
        "Corrigir e discordar exigem o texto dela — sem ele, fica o estado sem o motivo, e o motivo é o que importa.",
      path: ["correction"],
    },
  );

export async function acknowledgePersonNeedAction(input: unknown) {
  await requireAnyRoleForAction(["curador_medico", "administrador"]);
  const parsed = acknowledgeSchema.safeParse(input);
  if (!parsed.success) {
    // A recusa do payload chega com a propria frase: "Formato invalido"
    // esconderia justamente o que falta (DT-22).
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Formato inválido." };
  }

  const supabase = await createServerSupabaseClient();
  try {
    await acknowledgePersonNeed(supabase, parsed.data);
  } catch (erro) {
    return { success: false as const, error: (erro as Error).message };
  }

  revalidateCaseSurfaces(parsed.data.caseId);
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// Cadastro administrativo do Protocolo (Release de Reconstrução, ETAPA 5).
// O cadastro é feito apenas pela equipe Aliviar (não há autocadastro), então
// o administrador precisa poder registrar o Catálogo 1.0.0 por um
// profissional. A proveniência conta a verdade: coletado pela equipe, não
// autodeclarado.
// ---------------------------------------------------------------------------

export async function saveProtocolDraftForProfessionalAction(
  professionalProfileId: string,
  input: unknown,
) {
  const state = await requireAnyRoleForAction(["administrador"]);
  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Resposta em formato inválido." };

  const supabase = await createServerSupabaseClient();
  await saveProtocolDraft(supabase, {
    professionalProfileId,
    responses: parsed.data.responses as Record<string, DraftResponse>,
    updatedBy: state.user.id,
  });

  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true as const };
}

export async function submitProtocolForProfessionalAction(professionalProfileId: string) {
  const state = await requireAnyRoleForAction(["administrador"]);

  const supabase = await createServerSupabaseClient();
  const draft = await loadProtocolDraft(supabase, professionalProfileId);

  if (Object.keys(draft.responses).length === 0) {
    return { success: false as const, error: "Não há respostas para registrar." };
  }

  const service = createAdminSupabaseClient();
  const resultado = await submitProfessionalProtocol(service, {
    professionalProfileId,
    responses: draft.responses,
    collectedBy: state.user.id,
    source: TEAM_REGISTRATION_SOURCE,
  });

  if (resultado.rejected.length > 0) {
    return {
      success: false as const,
      error: "Algumas respostas não passaram na validação do Catálogo.",
      rejected: resultado.rejected,
    };
  }

  revalidatePath(`/admin/profissionais/${professionalProfileId}`);
  return { success: true as const, registered: resultado.registered.length };
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
