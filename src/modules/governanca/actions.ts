"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthState } from "@/modules/auth/session";

import { ORIGENS_DE_ACEITE } from "./documentos";
import {
  abrirPedidoDeTitular,
  registrarAceites,
  revogarAceite,
  TIPOS_DE_PEDIDO,
} from "./repository";

/**
 * GOVERNANÇA — as actions do titular.
 *
 * O aceite eletrônico auditável em uma frase: o cliente diz apenas QUE
 * VERSÕES viu; o servidor decide se elas são as vigentes, carimba o hash lido
 * do banco e grava. Nenhum hash chega do navegador — um cliente adulterado
 * não consegue registrar aceite de texto diferente do publicado.
 *
 * IP e user-agent são coletados aqui, do cabeçalho da requisição. Eles são,
 * eles próprios, dado pessoal: a Política precisa declará-los (a circularidade
 * é real e assumida — sem eles não há prova de circunstância do ato).
 */

export type GovernancaActionResult = { success: true } | { success: false; error: string };

const aceiteSchema = z.object({
  versionIds: z.array(z.string().uuid()).min(1),
  origem: z.enum(ORIGENS_DE_ACEITE),
  contexto: z.record(z.string(), z.unknown()).optional(),
});

/** Circunstância do ato — o que o servidor consegue observar, e só isso. */
async function circunstancia(): Promise<{ ip: string | null; userAgent: string | null }> {
  const cabecalhos = await headers();
  // Atrás de proxy, o IP de origem chega em x-forwarded-for (o primeiro da
  // lista é o cliente). Ausência é registrada como ausência, nunca inventada.
  const encaminhado = cabecalhos.get("x-forwarded-for");
  const ip = encaminhado?.split(",")[0]?.trim() || cabecalhos.get("x-real-ip") || null;
  return { ip, userAgent: cabecalhos.get("user-agent") };
}

export async function registrarAceitesAction(input: unknown): Promise<GovernancaActionResult> {
  const state = await getAuthState();
  if (!state) return { success: false, error: "Não autorizado." };

  const parsed = aceiteSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { ip, userAgent } = await circunstancia();
  const supabase = await createServerSupabaseClient();

  try {
    await registrarAceites(supabase, {
      versionIds: parsed.data.versionIds,
      origem: parsed.data.origem,
      ip,
      userAgent,
      contexto: parsed.data.contexto,
    });
  } catch (erro) {
    return { success: false, error: (erro as Error).message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

const revogacaoSchema = z.object({
  acceptanceId: z.string().uuid(),
  motivo: z.string().max(500).optional(),
});

export async function revogarAceiteAction(input: unknown): Promise<GovernancaActionResult> {
  const state = await getAuthState();
  if (!state) return { success: false, error: "Não autorizado." };

  const parsed = revogacaoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { ip, userAgent } = await circunstancia();
  const supabase = await createServerSupabaseClient();

  try {
    // A RPC recusa revogar aceite alheio e recusa revogar o irrevogável — a
    // regra mora no banco, não nesta camada.
    await revogarAceite(supabase, {
      acceptanceId: parsed.data.acceptanceId,
      motivo: parsed.data.motivo ?? null,
      ip,
      userAgent,
    });
  } catch (erro) {
    return { success: false, error: (erro as Error).message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

const pedidoSchema = z.object({ tipo: z.enum(TIPOS_DE_PEDIDO) });

export async function abrirPedidoDeTitularAction(input: unknown): Promise<GovernancaActionResult> {
  const state = await getAuthState();
  if (!state) return { success: false, error: "Não autorizado." };

  const parsed = pedidoSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const supabase = await createServerSupabaseClient();
  try {
    await abrirPedidoDeTitular(supabase, {
      profileId: state.user.id,
      tipo: parsed.data.tipo,
    });
  } catch (erro) {
    return { success: false, error: (erro as Error).message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
