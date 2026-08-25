"use server";

import { erroDeBanco, falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NaoAutenticadoError, requireRoleForAction } from "@/modules/auth/guard";
import { DECISION_MESSAGES } from "@/modules/curadoria/reconhecimento-do-perfil";

/**
 * O ATO DELA — ADR-042.
 *
 * "A paciente confirmou que o Mapa de Prioridades reflete o que foi
 * compreendido durante a Consulta Inicial."
 *
 * O que mudou em relação a `validateProfileAction`, que esta ação substitui:
 *
 *   dono ......... exigia `requireCurator()`. O ato que o Método define como
 *                  dela só podia ser feito por outra pessoa.
 *   condição ..... exigia `readiness.canValidate`, isto é, os 100 pontos de
 *                  `priority_weights` somando exatamente 100.
 *   agora ........ é dela, e depende só do Mapa de Prioridades estar completo.
 *
 * Não existe aqui: soma de pontos, `priority_weights`, `cruzamento_weights`,
 * campo livre obrigatório, nem comparação com a string "VALIDATED" — a
 * decisão inteira vive no banco, numa função que faz uma coisa só.
 */
/**
 * Bloco D: sessão expirada é um desfecho DISCRIMINADO (`code`), nunca uma
 * frase para comparar por substring. Antes, qualquer falha de autenticação —
 * inclusive a sessão que simplesmente venceu com a aba aberta — virava
 * "Este Perfil não é seu.": uma acusação de posse para um erro de auth.
 */
export type ReconhecimentoResult =
  | { success: true; jaEstava: boolean }
  | { success: false; code: "SESSAO_EXPIRADA"; error: string }
  | { success: false; code?: undefined; error: string };

const SESSAO_EXPIRADA: ReconhecimentoResult = {
  success: false,
  code: "SESSAO_EXPIRADA",
  error: "Sua sessão expirou. Entre novamente para continuar.",
};

/**
 * Cada código que a função do banco devolve vira uma frase que fala com ela.
 * "MAPA_INCOMPLETO" não é erro dela — é estado do trabalho da Curadoria, e a
 * mensagem diz isso.
 */
const MENSAGENS: Record<string, string> = {
  NAO_AUTORIZADO: "Este Perfil não é seu.",
  PERFIL_INEXISTENTE:
    "O seu Perfil ainda não foi aberto. Ele nasce na Consulta Inicial, junto com a Curadoria.",
  MAPA_INCOMPLETO: DECISION_MESSAGES.MAPA_INCOMPLETO,
  // FALTAVA (achado da curadoria simulada, 25/08): a RPC devolve este código
  // desde a ADR-065 — o Perfil que ela reconhece INCLUI o bloco relacional,
  // as 15 conversas do Protocolo da Pessoa — e o mapa não o conhecia. A
  // paciente caía na genérica "tente de novo", que MENTE: o estado não é
  // transitório, e tentar de novo nunca resolveria. Estado do trabalho da
  // Curadoria, dito como tal — nunca erro dela.
  BLOCO_RELACIONAL_INCOMPLETO:
    "Falta uma parte da conversa: como você quer ser cuidada. Seu Curador ainda está registrando essas respostas — quando terminar, este botão passa a funcionar.",
  PERFIL_SUBSTITUIDO: DECISION_MESSAGES.PERFIL_SUBSTITUIDO,
};

export async function reconhecerPerfilAction(input: {
  caseId: string;
}): Promise<ReconhecimentoResult> {
  try {
    await requireRoleForAction("paciente");
  } catch (erro) {
    // Por TIPO, nunca por substring: sem sessão é reentrada, não acusação.
    if (erro instanceof NaoAutenticadoError) {
      return SESSAO_EXPIRADA;
    }
    // Autenticado sem o papel de paciente: aí sim o Perfil não é da pessoa.
    return { success: false, error: "Este Perfil não é seu." };
  }

  if (!input.caseId) {
    return { success: false, error: "Faltou identificar o Case." };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("acknowledge_priority_profile", {
    _case_id: input.caseId,
  });

  if (error) {
    // 42501 aqui é falta de privilégio de EXECUTE — a sessão virou `anon`
    // entre o guarda e a RPC (expirou no meio). É erro de AUTH, nunca de
    // posse: a resposta de posse legítima da função do banco é o dado
    // "NAO_AUTORIZADO", tratado abaixo. Detecção por código, não por texto.
    if ((error as { code?: string }).code === "42501") {
      return SESSAO_EXPIRADA;
    }
    return {
      success: false,
      error: falhaParaUsuario(
        "paciente.reconhecerPerfil",
        erroDeBanco("Não foi possível registrar o reconhecimento.", error, {
          caseId: input.caseId,
        }),
        { mensagem: "Não foi possível registrar agora. Tente de novo." },
      ),
    };
  }

  // Idempotência: reconhecer duas vezes não é falha. A tela diz que já estava
  // feito em vez de acusar erro por algo que ela fez certo.
  if (data === "RECONHECIDO" || data === "JA_RECONHECIDO") {
    // NENHUM revalidatePath aqui — de propósito, e com prova (2026-08-02):
    //
    // 1. Revalidar /portal-paciente era no-op (Decisão A: virou redirect).
    // 2. Revalidar /paciente (a página de origem) deixava o stream da
    //    resposta do POST aberto para sempre — "Registrando…" eterno com o
    //    RPC já persistido no banco.
    // 3. Revalidar SÓ as outras rotas (/paciente/perfil) travou IGUAL:
    //    qualquer revalidatePath dentro da action faz o Next embutir a
    //    re-renderização da página CORRENTE na resposta do POST, e é essa
    //    renderização embutida que nunca fecha (banco VALIDATED às
    //    06:29:18, botão preso 20s+; o GET da mesma árvore fecha em ~300ms).
    //
    // E revalidar não compra nada: todas as rotas do paciente são dinâmicas
    // (nenhuma no prerender-manifest) — cada GET já renderiza fresco. A
    // página corrente é atualizada pelo router.refresh() do cliente, que
    // roda DEPOIS de a action retornar.
    return { success: true, jaEstava: data === "JA_RECONHECIDO" };
  }

  return {
    success: false,
    error: MENSAGENS[data as string] ?? "Não foi possível registrar agora.",
  };
}
