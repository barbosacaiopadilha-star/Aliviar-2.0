/**
 * A MESA ORGANIZADA PELAS FRASES DELA — o cruzamento visto do lado da pessoa.
 *
 * @metodo ADR-093 — as linhas são as preocupações dela, não a taxonomia
 * @metodo ADR-041 — a matriz do Motor, intocada: quem cruza continua sendo ela
 * @metodo ADR-039/040 — as duas declarações que o Motor compara
 * @metodo PROTOCOLO_PESSOA.md — P1..P17, uma pergunta por subcritério
 *
 * A Mesa antiga era uma grade de 29 subcritérios × N profissionais, e o
 * Curador trabalhava dentro da taxonomia. O problema não era defeito: era
 * ORDEM. Das cinco partes do trabalho — entender o que importa a ela, saber o
 * que é verdade sobre cada profissional, ver onde isso se encontra, escolher
 * três, escrever para ela decidir — só a terceira é mecânica, e é justamente a
 * que o Motor faz sozinho. A tela dava o primeiro plano a ela.
 *
 * Aqui a ordem se inverte: cada linha nasce de uma pergunta que foi feita A
 * ELA, e traz a resposta que ELA deu. O Método continua rodando embaixo — o
 * `subcriterionCode` de cada linha é o mesmo de sempre, e o Motor é chamado
 * sem nenhuma adaptação.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A DIVISÃO 17/12, E POR QUE ELA NÃO É ARBITRÁRIA
 *
 * Dos 29 subcritérios ativos, 17 têm pergunta no Protocolo da Pessoa e 12 não.
 * Os 12 são exatamente os técnicos — formação, experiência, histórico, limites
 * de atuação. Não é lacuna do Protocolo: é que **ela não tem como saber que
 * eles importam**. Nenhuma paciente pergunta pelo "volume de atuação" do
 * cirurgião, e é para isso que existe curadoria.
 *
 * Por isso os 12 não viram linha: viram a CONFERÊNCIA. É a resposta à objeção
 * que a ADR-093 registra — organizar a tela pelas frases dela poderia
 * transformar a Curadoria num espelho das preocupações dela, que é o oposto do
 * que ela contratou. Não transforma, porque nenhum subcritério escapa: cada um
 * dos 29 sai daqui como linha OU como órfão, nunca como nenhum dos dois e
 * nunca como os dois. `conferenciaCompleta` é essa promessa, verificável.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import type { ImportanceLevel } from "./mapa-prioridades";
import type { SubcriterionStatus } from "./mapa-profissional";
import {
  crossOne,
  type CompatibilityResult,
} from "./motor-compatibilidade";
import { participaDoMotor } from "./participacao-no-motor";
import { PERSON_PROTOCOL, type NeedDegree } from "./protocolos";

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/** O que ela respondeu numa pergunta do Protocolo. */
export type RespostaDaPessoa = {
  questionId: string;
  /** O rótulo da opção que ela escolheu, nas palavras do Catálogo. */
  resposta: string | null;
  /** O peso que ELA deu — não o que o Curador declarou depois. */
  grau: NeedDegree | null;
  /** Ela reconheceu a leitura do Curador? Ato exclusivo dela. */
  reconhecida: boolean;
};

export type ProfissionalNaMesa = {
  id: string;
  nome: string;
  /** Estado declarado no Mapa do Profissional, por subcritério. */
  estados: Readonly<Record<string, SubcriterionStatus>>;
};

export type EntradaDaMesa = {
  respostas: readonly RespostaDaPessoa[];
  /** Importância declarada pelo Curador, por subcritério. */
  importancias: Readonly<Record<string, ImportanceLevel>>;
  profissionais: readonly ProfissionalNaMesa[];
  /** Os subcritérios ativos — vêm do banco, nunca de uma lista aqui. */
  subcriteriosAtivos: readonly string[];
};

// ---------------------------------------------------------------------------
// Saída
// ---------------------------------------------------------------------------

/**
 * O que se sabe sobre UM profissional em UMA preocupação.
 *
 * `compatibilidade` é `null` em dois casos que não se confundem, e é por isso
 * que `motivo` existe: sem ele a tela mostraria o mesmo vazio para "o Método
 * decidiu não cruzar isto" e para "ninguém preencheu ainda".
 */
export type Celula = {
  profissionalId: string;
  estado: SubcriterionStatus | null;
  compatibilidade: CompatibilityResult | null;
  motivo: "CRUZADO" | "FORA_DO_MOTOR" | "SEM_IMPORTANCIA_DECLARADA" | "SEM_ESTADO_DECLARADO";
};

/** Uma linha: uma coisa que ela disse, e o que cada candidato responde a ela. */
export type Linha = {
  questionId: string;
  subcriterionCode: string;
  /** A pergunta como foi feita a ela. */
  pergunta: string;
  /** A resposta dela — o que dá o título humano da linha. */
  resposta: string | null;
  grau: NeedDegree | null;
  reconhecida: boolean;
  importancia: ImportanceLevel | null;
  celulas: readonly Celula[];
};

/** Um subcritério que ela não tem como pedir — e que por isso é conferido. */
export type Orfao = {
  subcriterionCode: string;
  importancia: ImportanceLevel | null;
  celulas: readonly Celula[];
  /**
   * Já foi tratado? Um órfão sem importância declarada é o que a conferência
   * final cobra: "isto não corresponde a nada que ela disse — confirma que não
   * influencia?". Declarar `NAO_INFLUENCIA` é resposta legítima e fecha o item.
   */
  conferido: boolean;
};

export type MesaPorPreocupacoes = {
  linhas: readonly Linha[];
  orfaos: readonly Orfao[];
  /** Os órfãos que ainda esperam a conferência do Curador. */
  pendentesDeConferencia: readonly string[];
  /**
   * A promessa verificável: todo subcritério ativo saiu daqui uma vez, como
   * linha ou como órfão. Falso significa que a cobertura do Método furou.
   */
  conferenciaCompleta: boolean;
};

// ---------------------------------------------------------------------------
// A montagem
// ---------------------------------------------------------------------------

function celulasDe(
  subcriterionCode: string,
  importancia: ImportanceLevel | null,
  profissionais: readonly ProfissionalNaMesa[],
): readonly Celula[] {
  return profissionais.map((profissional) => {
    const estado = profissional.estados[subcriterionCode] ?? null;

    // A ordem destas três recusas importa. "Fora do Motor" vem primeiro
    // porque é decisão do Método e não depende de ninguém ter preenchido
    // nada: perguntar por importância ou estado num conceito que o Método
    // recusa cruzar seria cobrar trabalho que não deve ser feito.
    if (!participaDoMotor(subcriterionCode)) {
      return { profissionalId: profissional.id, estado, compatibilidade: null, motivo: "FORA_DO_MOTOR" };
    }
    if (importancia === null) {
      return {
        profissionalId: profissional.id,
        estado,
        compatibilidade: null,
        motivo: "SEM_IMPORTANCIA_DECLARADA",
      };
    }
    if (estado === null) {
      return {
        profissionalId: profissional.id,
        estado: null,
        compatibilidade: null,
        motivo: "SEM_ESTADO_DECLARADO",
      };
    }

    return {
      profissionalId: profissional.id,
      estado,
      compatibilidade: crossOne(importancia, estado),
      motivo: "CRUZADO",
    };
  });
}

/**
 * Monta a Mesa. Não decide nada: organiza o que já foi declarado, do jeito que
 * deixa a pessoa visível.
 */
export function montarMesaPorPreocupacoes(entrada: EntradaDaMesa): MesaPorPreocupacoes {
  const { respostas, importancias, profissionais, subcriteriosAtivos } = entrada;

  const respostaPorPergunta = new Map(respostas.map((r) => [r.questionId, r]));
  const ativos = new Set(subcriteriosAtivos);

  // As linhas seguem a ordem do Protocolo — a ordem em que a conversa
  // aconteceu com ela, não a ordem alfabética da taxonomia.
  const linhas: Linha[] = [];
  for (const pergunta of PERSON_PROTOCOL) {
    if (!ativos.has(pergunta.subcriterionCode)) continue;
    const dela = respostaPorPergunta.get(pergunta.id) ?? null;
    const importancia = importancias[pergunta.subcriterionCode] ?? null;
    linhas.push({
      questionId: pergunta.id,
      subcriterionCode: pergunta.subcriterionCode,
      pergunta: pergunta.question,
      resposta: dela?.resposta ?? null,
      grau: dela?.grau ?? null,
      reconhecida: dela?.reconhecida ?? false,
      importancia,
      celulas: celulasDe(pergunta.subcriterionCode, importancia, profissionais),
    });
  }

  const cobertos = new Set(linhas.map((l) => l.subcriterionCode));

  const orfaos: Orfao[] = subcriteriosAtivos
    .filter((code) => !cobertos.has(code))
    .map((code) => {
      const importancia = importancias[code] ?? null;
      return {
        subcriterionCode: code,
        importancia,
        celulas: celulasDe(code, importancia, profissionais),
        // Um conceito que o Método não cruza não pede conferência de
        // ninguém — cobrá-la seria inventar trabalho.
        conferido: importancia !== null || !participaDoMotor(code),
      };
    });

  return {
    linhas,
    orfaos,
    pendentesDeConferencia: orfaos.filter((o) => !o.conferido).map((o) => o.subcriterionCode),
    conferenciaCompleta: linhas.length + orfaos.length === ativos.size,
  };
}
