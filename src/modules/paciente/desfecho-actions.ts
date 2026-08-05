"use server";

import { z } from "zod";

import { erroDeBanco, falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NaoAutenticadoError, requireRoleForAction } from "@/modules/auth/guard";
import { mensagemDoRetorno } from "@/modules/paciente/desfecho-mensagens";

/**
 * O DESFECHO DELA, POR CONCEITO — PP-03A.
 *
 * @metodo DT-22 — corrigir e discordar exigem o texto dela; reconhecer não tem
 *         o que guardar
 * @metodo PP-03 §5 — contrato mínimo: um verbo, duas colunas, uma linha
 * @metodo ADR-068 §4 — o que ela faz sobre a tradução é reconhecer ou discordar
 *
 * Por que existe como arquivo próprio, e não como um parâmetro em
 * `acknowledgePersonNeedAction`: aquela ação exige `curador_medico` ou
 * `administrador` — é o defeito que o PP-03 nomeia, o Curador praticando o ato
 * dela. Reaproveitá-la exigiria afrouxar seu guarda de papel, e um guarda com
 * duas portas não é guarda. As duas ações continuam existindo, com donos
 * diferentes: o Curador registra a TRADUÇÃO, ela registra o DESFECHO.
 *
 * Toda a autoridade vive na RPC `acknowledge_case_need` (SECURITY DEFINER):
 * aqui não há `UPDATE`, não há tabela, não há regra de domínio duplicada. Esta
 * camada faz duas coisas — garante que quem chama é uma paciente autenticada,
 * e traduz os retornos nomeados do banco em frases que falam com ela.
 */

const DESFECHOS = ["RECONHECIDA", "CORRIGIDA", "RECUSADA"] as const;

export type DesfechoDoConceito = (typeof DESFECHOS)[number];

const schema = z
  .object({
    caseId: z.string().uuid(),
    subcriterionCode: z.string().min(1),
    acknowledgment: z.enum(DESFECHOS),
    // O CHECK do banco limita `correction` a 500 caracteres; recusar aqui
    // evita que ela escreva um texto longo e perca o que escreveu.
    correction: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (dados) =>
      dados.acknowledgment === "RECONHECIDA" || (dados.correction ?? "").trim().length > 0,
    {
      message:
        "Para corrigir ou discordar, conte o que está diferente — sem isso fica o estado sem o motivo, e o motivo é o que importa.",
      path: ["correction"],
    },
  );

export type DesfechoResult =
  | { success: true; desfecho: DesfechoDoConceito }
  | { success: false; code: "SESSAO_EXPIRADA"; error: string }
  | { success: false; code?: undefined; error: string };

const SESSAO_EXPIRADA: DesfechoResult = {
  success: false,
  code: "SESSAO_EXPIRADA",
  error: "Sua sessão expirou. Entre novamente para continuar.",
};

/**
 * Cada retorno nomeado da RPC vira uma frase para ela. Nenhum é acusação: o
 * conceito que não existe, a tradução que não houve e o Perfil já reconhecido
 * são estados do trabalho, não erros dela.
 *
 * As frases vivem em `desfecho-mensagens.ts`, módulo puro: este arquivo é
 * `"use server"` e só pode exportar funções async. C9 — nenhum retorno
 * específico da RPC cai no genérico; um teste compara a lista de retornos com
 * as chaves do mapa.
 */

export async function registrarDesfechoAction(input: unknown): Promise<DesfechoResult> {
  try {
    await requireRoleForAction("paciente");
  } catch (erro) {
    // Por TIPO, nunca por substring: sem sessão é reentrada, não acusação.
    if (erro instanceof NaoAutenticadoError) return SESSAO_EXPIRADA;
    return { success: false, error: "Este Perfil não é seu." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    // A recusa chega com a própria frase: "Formato inválido" esconderia
    // justamente o que falta (DT-22).
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Não foi possível registrar essa resposta.",
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("acknowledge_case_need", {
    _case_id: parsed.data.caseId,
    _subcriterion_code: parsed.data.subcriterionCode,
    _acknowledgment: parsed.data.acknowledgment,
    _correction: parsed.data.correction ?? null,
  });

  if (error) {
    // 42501 é falta de privilégio de EXECUTE — a sessão virou `anon` entre o
    // guarda e a RPC. É erro de AUTH, nunca de posse: a resposta de posse
    // legítima da função é o dado 'NAO_AUTORIZADO', tratado abaixo.
    if ((error as { code?: string }).code === "42501") return SESSAO_EXPIRADA;

    return {
      success: false,
      error: falhaParaUsuario(
        "paciente.registrarDesfecho",
        erroDeBanco("Não foi possível registrar o desfecho.", error, {
          caseId: parsed.data.caseId,
        }),
        { mensagem: "Não foi possível registrar agora. Tente de novo." },
      ),
    };
  }

  if (DESFECHOS.includes(data as DesfechoDoConceito)) {
    // NENHUM revalidatePath — mesma prova de 2026-08-02 registrada em
    // `reconhecimento-actions.ts`: revalidar dentro da action embute a
    // re-renderização da página corrente na resposta do POST, e ela nunca
    // fecha. Todas as rotas da paciente são dinâmicas; cada GET já é fresco.
    return { success: true, desfecho: data as DesfechoDoConceito };
  }

  return {
    success: false,
    error: mensagemDoRetorno(data as string),
  };
}
