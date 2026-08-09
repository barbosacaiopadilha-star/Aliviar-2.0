"use server";

import {
  getAceLanguageModel,
  getAceLanguageModelHealth,
} from "@/modules/concierge/language-model";
import { requireAnyRoleForAction } from "@/modules/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  SYSTEM_PROMPT,
  USO_DA_ASSISTENCIA,
  VERSAO_DO_PROMPT,
  conceitoAceitaAssistencia,
  montarContextoDeRedacao,
  regimeDaAssistencia,
  validarSugestoes,
  type Sugestoes,
} from "./assistencia-de-redacao";
import { CRITERION_LABELS } from "./cruzamento";
import { loadCurrentPracticeEvidence } from "./evidencias-pratica-repository";
import { loadMesaCruzamento } from "./mesa-cruzamento";
import { RELATIONAL_CONCEPTS_BY_CODE } from "./motor-relacional";

/**
 * O ADAPTADOR da assistência de redação (CONTRATO_ASSISTENCIA_DE_REDACAO_IA
 * §11/§15).
 *
 * Recebe do cliente APENAS IDENTIFICADORES. Todo o contexto enviado ao modelo
 * é reconstruído aqui, no servidor, a partir do que a autoridade do banco
 * deixa este Curador alcançar — o cliente nunca dita o que vai ao modelo.
 *
 * Nada aqui é ato de domínio: a sugestão não é juízo, não é gravada, não vira
 * proposta e não alcança a tabela do julgamento — nem para ler. Só o texto
 * que o Curador submeter em `Registrar juízo` é ato (§7).
 *
 * Este arquivo NÃO nomeia a tabela do julgamento em lugar nenhum, nem em
 * comentário: a lista fechada de módulos que a mencionam é uma guarda
 * lavrada (G-2.4-7/8/9), e ela cresce por contrato, nunca por descuido.
 *
 * A chave do fornecedor nunca sai do servidor. O prompt nunca é logado
 * (regra já vigente do módulo de linguagem, ADR-056).
 */

/** Espera máxima da geração (§11). */
const TIMEOUT_MS = 15_000;

export type DesfechoDaSugestao =
  | { desfecho: "SUGESTOES_GERADAS"; sugestoes: Sugestoes }
  | { desfecho: "SEM_AUTORIDADE" }
  | { desfecho: "CONCEITO_FORA_DO_ESCOPO" }
  | { desfecho: "ASSISTENCIA_INDISPONIVEL" }
  | { desfecho: "SAIDA_RECUSADA" }
  | { desfecho: "ERRO_TECNICO" };

/**
 * Diz se a assistência pode sequer ser oferecida — lida no SERVIDOR e
 * passada à superfície como propriedade. Duas condições, ambas necessárias:
 * o regime está ativo (gate documental de privacidade, §14 do contrato) e o
 * fornecedor está configurado. Sem as duas, o botão não é exibido: melhor
 * ausente que quebrado (§11).
 */
export async function assistenciaDeRedacaoDisponivel(): Promise<boolean> {
  if (regimeDaAssistencia(process.env.ASSISTENCIA_DE_REDACAO_IA) !== "ATIVA") return false;
  return getAceLanguageModelHealth().healthy;
}

export async function sugerirRedacaoAction(input: {
  caseId: string;
  professionalProfileId: string;
  subcriterionCode: string;
}): Promise<DesfechoDaSugestao> {
  if (!(await assistenciaDeRedacaoDisponivel())) {
    return { desfecho: "ASSISTENCIA_INDISPONIVEL" };
  }

  // Os seis conceitos lavrados — `AREA` e qualquer outro código são
  // recusados antes de qualquer leitura.
  if (!conceitoAceitaAssistencia(input.subcriterionCode)) {
    return { desfecho: "CONCEITO_FORA_DO_ESCOPO" };
  }

  try {
    await requireAnyRoleForAction(["curador_medico", "administrador"]);
  } catch {
    return { desfecho: "SEM_AUTORIDADE" };
  }

  try {
    // Cliente do USUÁRIO: a RLS (`can_access_case`) é a autoridade sobre o
    // alcance. Um Case fora do escopo deste Curador não monta.
    const supabase = await createServerSupabaseClient();

    let view;
    try {
      view = await loadMesaCruzamento(supabase, input.caseId, 0);
    } catch {
      return { desfecho: "SEM_AUTORIDADE" };
    }

    // O profissional precisa ser ELEGÍVEL NESTE Case — a mesma leitura que
    // a Mesa usa para montar o painel. Isso fecha o isolamento por Case e
    // por profissional de uma vez: quem não está nesta coluna não tem
    // contexto montado, e portanto nada seu chega ao modelo.
    const elegivel = view.comparison.some(
      (coluna) => coluna.professionalProfileId === input.professionalProfileId,
    );
    if (!elegivel) return { desfecho: "SEM_AUTORIDADE" };

    // Natureza e rótulo vêm das MESMAS fontes que a tela usa — nunca de um
    // segundo catálogo que pudesse divergir do que o Curador está vendo.
    const natureza = RELATIONAL_CONCEPTS_BY_CODE.has(input.subcriterionCode)
      ? ("RELACIONAL" as const)
      : ("TECNICO" as const);
    const rotulo =
      natureza === "RELACIONAL"
        ? (RELATIONAL_CONCEPTS_BY_CODE.get(input.subcriterionCode)?.name ?? input.subcriterionCode)
        : (CRITERION_LABELS[input.subcriterionCode as keyof typeof CRITERION_LABELS] ??
          input.subcriterionCode);

    // As evidências CORRENTES deste profissional, lidas sob a RLS — e
    // recortadas ao conceito do cartão, exatamente como a tela recorta.
    const porProfissional = await loadCurrentPracticeEvidence(supabase, [
      input.professionalProfileId,
    ]);
    const doConceito = (porProfissional.get(input.professionalProfileId) ?? []).filter(
      (evidencia) =>
        natureza === "RELACIONAL"
          ? evidencia.subcriterionCode === input.subcriterionCode
          : evidencia.subcriterionCode.startsWith(`${input.subcriterionCode}_`),
    );

    const contexto = montarContextoDeRedacao({
      conceito: input.subcriterionCode,
      rotulo,
      natureza,
      evidenciasCorrentes: doConceito.map((evidencia) => ({
        // O mesmo `resumo` que a tela mostra — o código do conceito, nunca
        // texto livre do profissional (§3: "exatamente o que já está na tela").
        resumo: evidencia.subcriterionCode,
        versao: evidencia.version,
        status: evidencia.status,
      })),
    });

    const modelo = await getAceLanguageModel();
    const resposta = await modelo.run({
      usageId: USO_DA_ASSISTENCIA,
      prompt: SYSTEM_PROMPT,
      input: contexto,
      timeoutMs: TIMEOUT_MS,
      context: { versaoDoPrompt: VERSAO_DO_PROMPT },
    });

    if (resposta.metadata.status !== "ok" || resposta.output === null) {
      return { desfecho: "ERRO_TECNICO" };
    }

    // FALHA FECHADA (§9): saída inválida não é exibida, não é corrigida e
    // não é truncada — o Curador escreve normalmente.
    const validado = validarSugestoes(resposta.output, contexto);
    if (!validado.ok) return { desfecho: "SAIDA_RECUSADA" };

    // Só as três strings atravessam a fronteira. Nada de contexto, nada de
    // identificador, nada de metadado do fornecedor.
    return { desfecho: "SUGESTOES_GERADAS", sugestoes: validado.sugestoes };
  } catch {
    // Sanitizado: nunca propaga mensagem de infraestrutura à superfície.
    return { desfecho: "ERRO_TECNICO" };
  }
}
