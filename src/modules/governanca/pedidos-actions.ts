"use server";

import { revalidatePath } from "next/cache";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireRoleForAction } from "@/modules/auth/guard";

import {
  assumirPedidoSchema,
  executarEliminacaoSchema,
  registrarDesfechoSchema,
} from "./pedidos-schema";

/**
 * AS TRÊS AÇÕES DA FILA DE PEDIDOS DO TITULAR.
 *
 * O `SIM-99` fechou a porta do banco (`eliminar_titular`) e deixou o buraco
 * ao lado: *"a porta existe e ninguém a chama"*. Estas ações são quem chama.
 *
 * REGIME, igual para as três:
 *   · gate de papel ANTES de qualquer coisa (`requireRoleForAction`), porque
 *     o service role abaixo ignora RLS por definição;
 *   · motivo/desfecho obrigatório — a porta do banco recusa vazio, e o texto
 *     é a resposta que a pessoa recebe;
 *   · nenhuma mensagem de erro vaza SQL, constraint ou nome de tabela:
 *     `falhaParaUsuario` devolve frase humana + referência para o log.
 *
 * POR QUE SERVICE ROLE. A migration de governança é explícita:
 * *"Abrir pedido é ato do titular; executá-lo é da operação (service role)"* —
 * `authenticated` tem `select, insert` e nada mais em `data_subject_requests`,
 * e `eliminar_titular` só é executável por `service_role`. A leitura da fila,
 * por contraste, roda no cliente normal com RLS (ver `pedidos-repository`).
 */

export type PedidoActionResult =
  | { success: true; aviso?: string }
  | { success: false; error: string };

const ROTA = "/admin/pedidos";

/**
 * EXECUTA A ELIMINAÇÃO — o ato irreversível.
 *
 * Ordem, e cada passo tem razão de estar onde está:
 *
 *  1. Gate de papel.
 *  2. Confirmação nominal conferida contra o nome LIDO DO BANCO, nunca contra
 *     um nome que veio no formulário. Confiar no nome postado tornaria a
 *     confirmação decorativa: quem monta a requisição escolheria os dois lados.
 *  3. A porta do banco (`eliminar_titular`), que audita antes de apagar e
 *     devolve os caminhos do storage.
 *  4. O storage, pela API — SQL não apaga blob. **É aqui que o PRIV-04 mora:**
 *     um `remove()` que falha em silêncio é exatamente a mentira que o achado
 *     descreveu. Se falhar, a ação NÃO diz sucesso limpo: grava
 *     `patient_document_orphaned` na auditoria, com os caminhos, e devolve
 *     aviso nomeando o que sobrou.
 *
 * O pedido não é "concluído": ele **desapareceu** com a pessoa, por cascata
 * (ver o comentário em `listarEliminacoesExecutadas`). A prova é a auditoria.
 */
export async function executarEliminacaoAction(
  input: unknown,
): Promise<PedidoActionResult> {
  let authState;
  try {
    authState = await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = executarEliminacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  }
  const { profileId, motivo, confirmacao } = parsed.data;

  const admin = createAdminSupabaseClient();

  try {
    const { data: perfil, error: erroPerfil } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", profileId)
      .maybeSingle();
    if (erroPerfil) throw erroPerfil;
    if (!perfil) {
      return { success: false, error: "Esta pessoa já não existe — o pedido pode ter sido atendido." };
    }

    const nome = ((perfil.display_name as string | null) ?? "").trim();
    if (nome.length === 0 || confirmacao.trim() !== nome) {
      return {
        success: false,
        error: "A confirmação não corresponde ao nome do titular. Nada foi alterado.",
      };
    }

    const { data: resumo, error: erroPorta } = await admin.rpc("eliminar_titular", {
      _profile_id: profileId,
      _reason: motivo,
      _executed_by: authState.user.id,
    });
    if (erroPorta) throw erroPorta;

    const caminhos = Array.isArray(resumo?.storage_paths)
      ? (resumo.storage_paths as unknown[]).filter((c): c is string => typeof c === "string")
      : [];

    let aviso: string | undefined;
    if (caminhos.length > 0) {
      const { data: removidos, error: erroStorage } = await admin.storage
        .from("patient-documents")
        .remove(caminhos);

      // `remove()` devolve o que REALMENTE saiu. Comparar é o que transforma
      // "não deu erro" em "saiu" — a distinção que o PRIV-04 cobrava.
      const saiu = new Set((removidos ?? []).map((o) => o.name));
      const ficaram = caminhos.filter((c) => !saiu.has(c));

      if (erroStorage || ficaram.length > 0) {
        await admin.from("audit_logs").insert({
          actor_id: authState.user.id,
          action: "patient_document_orphaned",
          // O perfil já não existe: apontar para ele violaria a FK. O id vai
          // no metadata, como no resto da migration 20260903040000.
          target_profile_id: null,
          metadata: {
            profile_id: profileId,
            reason: "eliminação do titular: arquivo não removido do storage",
            paths: ficaram.length > 0 ? ficaram : caminhos,
            storage_error: erroStorage?.message ?? null,
          },
        });
        aviso =
          `A pessoa foi eliminada do banco, mas ${ficaram.length || caminhos.length} arquivo(s) ` +
          `não saíram do armazenamento. Ficou registrado na auditoria com os caminhos — ` +
          `é preciso removê-los no painel do Supabase.`;
      }
    }

    revalidatePath(ROTA);
    revalidatePath("/admin");
    return aviso ? { success: true, aviso } : { success: true };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("governanca.pedidos.eliminacao", erro, {
        mensagem: "Não foi possível executar a eliminação. Nada foi alterado pela metade.",
      }),
    };
  }
}

/**
 * REGISTRA O DESFECHO — para os pedidos que a plataforma não executa sozinha.
 *
 * Acesso, correção, portabilidade e revogação não têm porta no banco: quem os
 * cumpre é uma pessoa, fora daqui (juntando os dados, corrigindo o cadastro,
 * mandando a cópia). O que a tela pode fazer — e é o que a LGPD cobra — é
 * **registrar que a resposta foi dada, quando, e qual foi**.
 *
 * `concluido_em` é preenchido nos dois desfechos, inclusive na recusa: o prazo
 * do titular é prazo de RESPOSTA, e uma recusa fundamentada é uma resposta. O
 * CHECK da tabela só exige a data no `concluido`; preenchê-la também no
 * `recusado` é o que faz o relógio parar quando a pessoa foi respondida.
 */
export async function registrarDesfechoAction(
  input: unknown,
): Promise<PedidoActionResult> {
  try {
    await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = registrarDesfechoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  }

  const admin = createAdminSupabaseClient();
  try {
    const { error } = await admin
      .from("data_subject_requests")
      .update({
        status: parsed.data.status,
        desfecho: parsed.data.desfecho,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", parsed.data.requestId)
      // Um pedido já respondido não se responde de novo por um reenvio de
      // formulário: a resposta ao titular é ato único.
      .in("status", ["recebido", "em_execucao"]);
    if (error) throw error;

    revalidatePath(ROTA);
    revalidatePath("/admin");
    return { success: true };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("governanca.pedidos.desfecho", erro, {
        mensagem: "Não foi possível registrar o desfecho.",
      }),
    };
  }
}

/** Assume o pedido: `recebido` → `em_execucao`. Diz que alguém já está nele. */
export async function assumirPedidoAction(
  input: unknown,
): Promise<PedidoActionResult> {
  try {
    await requireRoleForAction("administrador");
  } catch {
    return { success: false, error: "Não autorizado." };
  }

  const parsed = assumirPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Pedido inválido." };
  }

  const admin = createAdminSupabaseClient();
  try {
    const { error } = await admin
      .from("data_subject_requests")
      .update({ status: "em_execucao" })
      .eq("id", parsed.data.requestId)
      .eq("status", "recebido");
    if (error) throw error;

    revalidatePath(ROTA);
    return { success: true };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("governanca.pedidos.assumir", erro, {
        mensagem: "Não foi possível assumir o pedido.",
      }),
    };
  }
}
