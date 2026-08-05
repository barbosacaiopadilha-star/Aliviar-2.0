import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { montarCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";
import type {
  LinhaDoReconhecimento,
  LinhaTecnica,
  ModeloDoReconhecimento,
} from "@/modules/paciente/reconhecimento-contrato";
import { loadCasePriorityMap } from "@/modules/curadoria/mapa-prioridades-repository";
import { IMPORTANCE_LABELS, SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";
import { NEED_DEGREE_LABELS, PERSON_QUESTIONS_BY_CODE } from "@/modules/curadoria/protocolos";
import { loadCaseNeeds } from "@/modules/curadoria/protocolos-repository";

/**
 * O MODELO DO RECONHECIMENTO — tudo o que a tela precisará, montado uma vez.
 *
 * @metodo Arquitetura §6.2.1 — reconhecimento em duas colunas
 * @metodo DT-37 — toda capacidade operacional começa pelo modelo de dados; a
 *         interface apenas consome
 *
 * Por que existe: a comparação que ela precisa ver — a fala dela ao lado do que
 * ficou registrado — mora hoje em duas fontes que nunca se encontraram na mesma
 * tela. `loadPatientPerfil` traz só o Mapa; `case_needs` fica de fora. Montar
 * isso na superfície faria a UI voltar ao banco e reconstruir, por conta
 * própria, o que o Item 1.9 já sabe montar.
 *
 * **Loader irmão, e não extensão de `loadPatientPerfil` (A1).** A razão é de
 * responsabilidade: `loadPatientPerfil` responde "como está o Perfil dela" e é
 * consumido por superfícies que não têm nada a ver com reconhecimento.
 * Acrescentar `case_needs` e a cadeia ali faria todas elas pagarem por duas
 * consultas que não usam, e misturaria duas perguntas diferentes num contrato
 * só. Aqui a pergunta é outra — "o que ela declarou, e o que virou disso" — e
 * merece contrato próprio.
 *
 * O que ele NUNCA faz: reconstruir a cadeia. Ela vem inteira de
 * `montarCadeiaDeProveniencia`, o montador puro do Item 1.9 — inclusive as
 * lacunas, que a tela exibe sem reescrever.
 *
 * Leitura apenas. Nenhuma escrita, nenhuma decisão, nenhum desfecho.
 */

export type { ModeloDoReconhecimento };

const ROTULO_POR_CODIGO = new Map(
  SUBCRITERION_CATALOG.map((entrada) => [entrada.code, entrada.name]),
);

/**
 * Um conceito tem lado da pessoa quando existe pergunta a ela no Protocolo.
 * Os 12 técnicos não têm: ninguém declara preferência por fellowship, e é o
 * Curador quem os julga contra o caso. A separação acontece **aqui**, no
 * modelo (A5) — a tela recebe duas listas prontas e não decide nada.
 */
function temLadoDaPessoa(subcriterionCode: string): boolean {
  return PERSON_QUESTIONS_BY_CODE.has(subcriterionCode);
}

/**
 * MR-01 — O QUE ELA DISSE, DITO COMO ELA DISSE.
 *
 * A verificação em navegador da Etapa 2D mostrou `explicacao_simples` na coluna
 * "O que você disse" (DEF-2): o código canônico com que a resposta é ARMAZENADA
 * chegava inteiro à tela dela. O modelo era o único lugar do produto que não
 * traduzia — o painel do Curador faz `question.options[option]`, e o bloco da
 * ADR-065 usa `relationalPersonOptionLabel`.
 *
 * O mapa é o mesmo do painel do Curador: `PERSON_QUESTIONS_BY_CODE`, derivado
 * do Catálogo. Nenhum mapa novo nasce aqui — os dois lados passam a verbalizar
 * pela mesma fonte, que é o ponto.
 *
 * (`relationalPersonOptionLabel` não serve: cobre só os conceitos relacionais
 * da ADR-065 e só o campo `principal`. Aqui o universo é o Protocolo inteiro.)
 *
 * Opção que o Catálogo não nomeia mais: a resposta dela NÃO some — isso seria
 * transformar ausência de rótulo em ausência da escolha (I-8) —, mas também
 * não vira código na tela (M3). Vira o que de fato é: algo que ela escolheu e
 * que o Catálogo deixou de nomear.
 */
const OPCAO_SEM_ROTULO = "Uma opção que o Catálogo não descreve mais";

function rotuloDaOpcao(subcriterionCode: string, valor: string): string {
  return PERSON_QUESTIONS_BY_CODE.get(subcriterionCode)?.options[valor] ?? OPCAO_SEM_ROTULO;
}

export async function loadModeloDoReconhecimento(
  supabase: SupabaseClient,
  caseId: string,
): Promise<ModeloDoReconhecimento> {
  const [needs, mapa] = await Promise.all([
    loadCaseNeeds(supabase, caseId),
    loadCasePriorityMap(supabase, caseId),
  ]);

  const declaracaoPorCodigo = new Map(needs.map((need) => [need.subcriterionCode, need]));
  const importanciaPorCodigo = new Map(mapa.items.map((item) => [item.subcriterionCode, item]));

  // O universo é a união do que ela declarou com o que foi registrado: um
  // conceito declarado por ela e ainda não registrado precisa aparecer — é
  // justamente a lacuna que o reconhecimento existe para mostrar.
  const codigos = [
    ...new Set([...declaracaoPorCodigo.keys(), ...importanciaPorCodigo.keys()]),
  ].sort();

  const linhas: LinhaDoReconhecimento[] = [];
  const tecnicos: LinhaTecnica[] = [];

  for (const code of codigos) {
    const declaracao = declaracaoPorCodigo.get(code) ?? null;
    const importancia = importanciaPorCodigo.get(code) ?? null;
    const label = ROTULO_POR_CODIGO.get(code) ?? code;

    if (!temLadoDaPessoa(code)) {
      // Sem lado dela, não há o que comparar: o conceito só existe se alguém
      // o registrou. Sem registro, não entra em bloco nenhum.
      if (importancia) {
        // B3 — procedência real, e só ela: quem registrou e quando. Sem cadeia,
        // porque não há lado dela para encadear; sem valor de enfeite, porque
        // ausência dita por nome é informação e ausência preenchida é mentira.
        tecnicos.push({
          subcriterionCode: code,
          label,
          importancia: IMPORTANCE_LABELS[importancia.importance],
          autor: importancia.declaredBy ?? null,
          registradoEm: importancia.registradoEm ?? null,
        });
      }
      continue;
    }

    linhas.push({
      subcriterionCode: code,
      label,
      // B2 — a tela recebe o que vai exibir, no mesmo objeto: nada de procurar
      // autoria ou data dentro da cadeia para montar uma frase.
      declaracao: declaracao
        ? {
            grau: NEED_DEGREE_LABELS[declaracao.degree],
            // MR-01 — rótulo humano, nunca o código com que se armazena.
            opcoes: declaracao.options.map((valor) => rotuloDaOpcao(code, valor)),
            em: declaracao.declaredAt,
            autor: declaracao.declaredBy,
          }
        : null,
      registro: importancia
        ? {
            importancia: IMPORTANCE_LABELS[importancia.importance],
            autor: importancia.declaredBy ?? null,
            registradoEm: importancia.registradoEm ?? null,
          }
        : null,
      // A cadeia vem inteira do Item 1.9 — a tela nunca a remonta, e as lacunas
      // que ela exibe são as que o montador nomeou.
      cadeia: montarCadeiaDeProveniencia({
        subcriterionCode: code,
        pessoa: {
          declaracao: declaracao
            ? {
                degree: declaracao.degree,
                options: declaracao.options,
                declaredBy: declaracao.declaredBy,
                declaredAt: declaracao.declaredAt,
              }
            : null,
          importancia: importancia
            ? {
                importance: importancia.importance,
                declaredBy: importancia.declaredBy ?? null,
                registradoEm: importancia.registradoEm ?? null,
              }
            : null,
        },
        // A4: não há profissional no reconhecimento — ela reconhece o próprio
        // Perfil, não uma comparação. Declarar ausência é dizer a verdade;
        // inventar um profissional produziria uma cadeia falsa.
        profissional: { estado: null },
      }),
      // Etapa 2C — o estado do ato dela, vindo do MESMO `loadCaseNeeds` da
      // Etapa 2A. Nenhuma consulta nova, nenhuma regra nova: a tela precisa
      // saber o que já foi praticado para não oferecer o que não cabe.
      ato: {
        houveTraducao: declaracao?.origin === "TRADUCAO",
        desfecho: declaracao?.acknowledgment ?? "PENDENTE",
        leituraProposta: declaracao?.proposedReading ?? null,
        correcao: declaracao?.correction ?? null,
      },
    });
  }

  return { caseId, linhas, tecnicos };
}
