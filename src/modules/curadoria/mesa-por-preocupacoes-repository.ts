/**
 * O QUE A MESA NOVA LÊ — e por que ela não lê quase nada de novo.
 *
 * @metodo ADR-093 — as linhas são as preocupações dela
 *
 * Nenhuma tabela nova nasceu para esta tela. As respostas dela já viviam em
 * `case_needs`, com a opção escolhida, o grau que ela declarou e o estado do
 * reconhecimento; a importância já vivia em `case_priority_map`; os estados dos
 * profissionais já viviam em `professional_subcriterion_map`. A Mesa antiga lia
 * as mesmas três fontes — e as juntava por subcritério, que é o que fazia a
 * pessoa desaparecer atrás da taxonomia.
 *
 * A diferença é só a junção. Aqui ela é pela PERGUNTA, e a resposta dela vem
 * junto — em texto, como ela escolheu, e não como código.
 *
 * As consultas dos profissionais são em lote, uma por tabela. Um `for` sobre a
 * lista chamando o repositório por profissional produziria 1+N idas ao banco
 * numa tela que é o coração do trabalho do Curador.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadCasePriorityMap } from "./mapa-prioridades-repository";
import {
  montarMesaPorPreocupacoes,
  type MesaPorPreocupacoes,
  type ProfissionalNaMesa,
  type RespostaDaPessoa,
} from "./mesa-por-preocupacoes";
import { loadCaseNeeds } from "./protocolos-repository";
import { PERSON_PROTOCOL, PERSON_QUESTIONS_BY_CODE } from "./protocolos";
import type { SubcriterionStatus } from "./mapa-profissional";
import type { ImportanceLevel } from "./mapa-prioridades";

export type MesaCarregada = MesaPorPreocupacoes & {
  profissionais: readonly { id: string; nome: string }[];
};

/**
 * A resposta dela em TEXTO.
 *
 * `case_needs.options` guarda códigos; o Catálogo guarda os rótulos. Mostrar o
 * código na tela seria devolver a ela a linguagem da máquina — que é
 * exatamente o que esta Mesa existe para desfazer.
 *
 * `guided_text` vence quando existe: é ela falando com as próprias palavras,
 * autorizado pelo Protocolo só onde ele permite, e nenhuma opção de catálogo
 * representa melhor do que o que ela mesma escreveu.
 */
function respostaEmTexto(
  subcriterionCode: string,
  options: readonly string[],
  guidedText: string | null,
): string | null {
  if (guidedText && guidedText.trim().length > 0) return guidedText.trim();

  const pergunta = PERSON_QUESTIONS_BY_CODE.get(subcriterionCode);
  if (!pergunta) return null;

  const rotulos = options
    .map((codigo) => pergunta.options[codigo])
    .filter((rotulo): rotulo is string => Boolean(rotulo));

  return rotulos.length > 0 ? rotulos.join(" · ") : null;
}

export async function carregarMesaPorPreocupacoes(
  supabase: SupabaseClient,
  caseId: string,
  profissionaisDoCase: readonly { id: string; nome: string }[],
): Promise<MesaCarregada> {
  const ids = profissionaisDoCase.map((p) => p.id);

  const [needs, priorityMap, { data: mapaRows }, { data: catalogoRows }] = await Promise.all([
    loadCaseNeeds(supabase, caseId),
    loadCasePriorityMap(supabase, caseId),
    ids.length > 0
      ? supabase
          .from("professional_subcriterion_map")
          .select("professional_profile_id, status, method_subcriteria(code)")
          .in("professional_profile_id", ids)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase.from("method_subcriteria").select("code").eq("active", true),
  ]);

  const subcriteriosAtivos = ((catalogoRows ?? []) as { code: string }[]).map((r) => r.code);

  // Uma resposta por PERGUNTA, e a ponte é o subcritério — que é a mesma
  // chave que o Protocolo e o Motor já usam. Nenhum mapeamento novo.
  const respostas: RespostaDaPessoa[] = [];
  for (const pergunta of PERSON_PROTOCOL) {
    const dela = needs.find((n) => n.subcriterionCode === pergunta.subcriterionCode);
    if (!dela) continue;
    respostas.push({
      questionId: pergunta.id,
      opcoesMarcadas: dela.options,
      resposta: respostaEmTexto(pergunta.subcriterionCode, dela.options, dela.guidedText),
      grau: dela.degree,
      reconhecida: dela.acknowledgment === "RECONHECIDA",
    });
  }

  const estadosPorProfissional = new Map<string, Record<string, SubcriterionStatus>>(
    ids.map((id) => [id, {}]),
  );
  for (const row of (mapaRows ?? []) as {
    professional_profile_id: string;
    status: SubcriterionStatus;
    method_subcriteria: { code: string } | { code: string }[] | null;
  }[]) {
    const conceito = Array.isArray(row.method_subcriteria)
      ? row.method_subcriteria[0]
      : row.method_subcriteria;
    if (!conceito) continue;
    const destino = estadosPorProfissional.get(row.professional_profile_id);
    if (destino) destino[conceito.code] = row.status;
  }

  const profissionais: ProfissionalNaMesa[] = profissionaisDoCase.map((p) => ({
    id: p.id,
    nome: p.nome,
    estados: estadosPorProfissional.get(p.id) ?? {},
  }));

  const importancias: Record<string, ImportanceLevel> = {};
  for (const item of priorityMap.items) {
    importancias[item.subcriterionCode] = item.importance;
  }

  return {
    ...montarMesaPorPreocupacoes({
      respostas,
      importancias,
      profissionais,
      subcriteriosAtivos,
    }),
    profissionais: profissionaisDoCase,
  };
}
