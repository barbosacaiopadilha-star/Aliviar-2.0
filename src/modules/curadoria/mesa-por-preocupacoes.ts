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
import {
  CONCEITOS_RELACIONAIS_HUMANOS,
  JULGAMENTOS_TECNICOS_EXIGIDOS,
} from "./julgamentos";
import { PERSON_PROTOCOL, type AcknowledgmentState, type NeedDegree, type PersonMode } from "./protocolos";

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/** O que ela respondeu numa pergunta do Protocolo. */
export type RespostaDaPessoa = {
  questionId: string;
  /** Os CÓDIGOS que ela marcou — a edição precisa deles, a leitura não. */
  opcoesMarcadas?: readonly string[];
  /** O rótulo da opção que ela escolheu, nas palavras do Catálogo. */
  resposta: string | null;
  /** O peso que ELA deu — não o que o Curador declarou depois. */
  grau: NeedDegree | null;
  /**
   * O DESFECHO DO RECONHECIMENTO — os quatro do Método, não um booleano.
   *
   * @metodo M-001 §6.2.1 — os quatro desfechos
   * @metodo DT-22 — `CORRIGIDA` e `RECUSADA` guardam o texto DELA
   *
   * Aqui havia `reconhecida: boolean`, e ele achatava três coisas que não são
   * a mesma: ela ainda não viu (`PENDENTE`), ela corrigiu (`CORRIGIDA`) e ela
   * recusou (`RECUSADA`). A tela dizia "aguarda o reconhecimento dela" nos
   * três casos — dizendo que ela está calada exatamente quando ela falou.
   *
   * Desde o PP-03C a paciente discorda e corrige por conta própria. Uma
   * discordância que a tela chama de silêncio atravessa a Curadoria inteira
   * sem ninguém ver, e o produto passa a ouvi-la sem ter onde escutá-la.
   */
  reconhecimento: AcknowledgmentState;
  /** O que ela escreveu ao corrigir ou recusar — as palavras dela. */
  correcao: string | null;
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
  /**
   * O nome humano de cada conceito, como o Catálogo do Método o escreve
   * (`method_subcriteria.name`) — `SIM-45`.
   *
   * A tela mostrava `EXPERIENCIA_VOLUME_DE_ATUACAO` com os underscores
   * trocados por espaços: *"experiencia volume de atuacao"*, sem acento e em
   * minúsculas. O Curador lia código cru numa tela cuja tese é falar a língua
   * de gente. O rótulo sempre existiu no Catálogo; o que faltava era carregá-lo.
   *
   * Opcional de propósito: quem monta a Mesa em teste não precisa recitar 29
   * rótulos para provar cobertura. Faltando o rótulo, o `Orfao` devolve o
   * CÓDIGO inteiro, em maiúsculas — que parece código, porque é. O
   * *de-underscore* era pior justamente por parecer prosa.
   */
  rotulos?: Readonly<Record<string, string>>;
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
  /** O desfecho do reconhecimento, com as palavras dela quando houve. */
  reconhecimento: AcknowledgmentState;
  correcao: string | null;
  importancia: ImportanceLevel | null;
  celulas: readonly Celula[];
  /** O que a linha precisa para virar editável, sem uma segunda consulta. */
  opcoesMarcadas: readonly string[];
  opcoes: readonly { codigo: string; rotulo: string }[];
  multi: boolean;
  origem: PersonMode;
  /**
   * Os três respondem a mesma coisa aqui?
   *
   * Uma linha em que todos são iguais ocupa espaço e não ajuda a escolher —
   * ela não distingue ninguém. É da mesma família do `SIM-29`, que a tela
   * DELA já sofria: a comparação repetia a mesma ausência quinze vezes. A
   * informação não some; ela para de gritar, e o espaço fica para as linhas
   * que separam os candidatos.
   */
  todosIguais: boolean;
};

/** Um subcritério que ela não tem como pedir — e que por isso é conferido. */
export type Orfao = {
  subcriterionCode: string;
  /**
   * O nome do conceito como o Catálogo o escreve — o que a tela mostra.
   *
   * A linha tem a frase DELA por título; o órfão não tem frase nenhuma,
   * porque ela não tem como pedir isto. O título dele é o nome que o Método
   * dá ao conceito — nunca o código (`SIM-45`).
   */
  rotulo: string;
  importancia: ImportanceLevel | null;
  celulas: readonly Celula[];
  /**
   * Já foi tratado? Um órfão sem importância declarada é o que a conferência
   * final cobra: "isto não corresponde a nada que ela disse — confirma que não
   * influencia?". Declarar `NAO_INFLUENCIA` é resposta legítima e fecha o item.
   */
  conferido: boolean;
};

/**
 * Os órfãos agrupados pelo EIXO — porque o juízo é do eixo, não do subcritério.
 *
 * A ADR-067 §5 exige UM juízo de formação por profissional. Renderizar o
 * pedido em cada subcritério cobraria cinco, e foi exatamente o que a primeira
 * versão desta tela fez: 42 botões onde o Método pede 18. O agrupamento existe
 * para que a tela não tenha como errar isso de novo.
 */
export type GrupoDeOrfaos = {
  eixo: string;
  /** `TECNICO` quando a ADR-067 exige juízo deste eixo; `null` quando não. */
  juizo: "TECNICO" | null;
  itens: readonly Orfao[];
};

export type MesaPorPreocupacoes = {
  linhas: readonly Linha[];
  orfaos: readonly Orfao[];
  /** Os mesmos órfãos, agrupados por eixo — é assim que a tela os desenha. */
  gruposDeOrfaos: readonly GrupoDeOrfaos[];
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
 * ONDE CADA JUÍZO PERTENCE — e por que isto é regra do Método, não layout.
 *
 * A ADR-067 §5 exige três juízos técnicos por profissional (H8–H10: formação,
 * experiência, histórico) e três relacionais (H11) quando o Case os declarou.
 * A Mesa antiga empilhava os seis num bloco, longe do fato que os justificava.
 *
 * Aqui eles caem sozinhos no lugar certo, e o encaixe não foi arranjado: os
 * três relacionais SÃO perguntas feitas a ela (P11, P14, P17), e os três
 * técnicos SÃO os eixos que ela não tem como pedir. Quando se para de
 * organizar a tela pela taxonomia, a estrutura do Método aparece.
 *
 * Devolve `null` quando o conceito não pede juízo — a maioria deles.
 */
export function juizoExigidoEm(subcriterionCode: string): "TECNICO" | "RELACIONAL" | null {
  if ((CONCEITOS_RELACIONAIS_HUMANOS as readonly string[]).includes(subcriterionCode)) {
    return "RELACIONAL";
  }
  // Os técnicos são declarados por EIXO ("FORMACAO"), e o Mapa fala em
  // subcritérios ("FORMACAO_GRADUACAO"). O juízo é do eixo inteiro: pedi-lo
  // por subcritério seria cobrar cinco juízos de formação onde a ADR-067
  // exige um.
  const eixo = subcriterionCode.split("_")[0];
  if ((JULGAMENTOS_TECNICOS_EXIGIDOS as readonly string[]).includes(eixo)) return "TECNICO";
  return null;
}

/**
 * Todos os candidatos respondem a mesma coisa nesta linha?
 *
 * Com menos de dois candidatos a pergunta não faz sentido — uma coluna só
 * nunca "separa" ninguém, e marcar a linha como redundante esconderia a única
 * informação que existe.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * LINHA QUE EXIGE JUÍZO NUNCA É IGUAL — `SIM-43`.
 *
 * O que aconteceu: a tela colapsa a linha redundante numa frase só, e o
 * colapso troca as células por um `colSpan`. Só que é dentro da célula que
 * mora o ato de registrar o juízo. Resultado medido na Mesa, com três
 * profissionais: o Método exige 18 pontos de juízo (ADR-067 §5) e a tela
 * oferecia **12**. Sumiam os relacionais de `MODELO_PREFERENCIAS_E_RESTRICOES`
 * e `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`, três profissionais cada.
 *
 * E para conceito fora do Motor o sumiço era **estrutural, nunca eventual**:
 * toda célula sai com `motivo: FORA_DO_MOTOR` e `compatibilidade: null`, logo
 * a igualdade era verdadeira sempre, por construção. A linha do P17 dizia
 * *"Os três respondem igual aqui: Exige juízo seu. Não separa ninguém"* —
 * cobrando o ato e retirando o ato, na mesma frase.
 *
 * A correção é de domínio, não de layout, e por isso mora aqui: **onde o
 * Método exige um juízo POR PROFISSIONAL, os candidatos não respondem a mesma
 * coisa — eles ainda não foram julgados.** A igualdade das células é ausência
 * de juízo, e chamar ausência de igualdade é afirmar sobre os três algo que
 * ninguém verificou.
 */
function saoTodasIguais(celulas: readonly Celula[], exigeJuizo: boolean): boolean {
  if (exigeJuizo) return false;
  if (celulas.length < 2) return false;
  const primeira = celulas[0];
  return celulas.every(
    (c) => c.motivo === primeira.motivo && c.compatibilidade === primeira.compatibilidade,
  );
}

/**
 * A ORDEM DOS DOZE — e por que a formação vem por último.
 *
 * A formação é o que todo mundo quer saber primeiro, e é exatamente por isso
 * que ela não pode vir primeiro. O diploma é o atalho que qualquer pessoa
 * usaria sozinha, em casa, sem curadoria nenhuma — e é o mais fácil de
 * confundir com resposta. Aberta a tela pela formação, todo o resto passa a ser
 * lido como nota de rodapé de um currículo.
 *
 * Então os doze descem do mais próximo da experiência dela para o mais
 * distante: o que a pessoa já fez (experiência), o que ela declara NÃO fazer
 * (limites — que é o que protege de indicação fora de alcance), onde já
 * esteve (histórico), e só então onde estudou.
 *
 * Ordem pedida pelo Fundador em 25/08. Ela não muda cálculo nenhum: o Motor
 * cruza cada célula do mesmo jeito, e nenhum conceito sai da conferência.
 */
const EIXOS_EM_ORDEM = ["EXPERIENCIA", "PRATICA", "HISTORICO", "FORMACAO"] as const;

function ordemDosOrfaos(a: string, b: string): number {
  const posicao = (code: string) => {
    const indice = EIXOS_EM_ORDEM.findIndex((eixo) => code.startsWith(`${eixo}_`));
    // Eixo desconhecido não vai para o fim em silêncio: cai ANTES da formação,
    // onde alguém o vê. Sumir no rodapé é como um conceito novo passa
    // despercebido por meses.
    return indice === -1 ? EIXOS_EM_ORDEM.length - 1 : indice;
  };
  const diferenca = posicao(a) - posicao(b);
  return diferenca !== 0 ? diferenca : a.localeCompare(b);
}

/**
 * Monta a Mesa. Não decide nada: organiza o que já foi declarado, do jeito que
 * deixa a pessoa visível.
 */
export function montarMesaPorPreocupacoes(entrada: EntradaDaMesa): MesaPorPreocupacoes {
  const { respostas, importancias, profissionais, subcriteriosAtivos, rotulos } = entrada;

  const respostaPorPergunta = new Map(respostas.map((r) => [r.questionId, r]));
  const ativos = new Set(subcriteriosAtivos);

  // As linhas seguem a ordem do Protocolo — a ordem em que a conversa
  // aconteceu com ela, não a ordem alfabética da taxonomia.
  const linhas: Linha[] = [];
  for (const pergunta of PERSON_PROTOCOL) {
    if (!ativos.has(pergunta.subcriterionCode)) continue;
    const dela = respostaPorPergunta.get(pergunta.id) ?? null;
    const importancia = importancias[pergunta.subcriterionCode] ?? null;
    const celulasDaLinha = celulasDe(pergunta.subcriterionCode, importancia, profissionais);
    linhas.push({
      questionId: pergunta.id,
      subcriterionCode: pergunta.subcriterionCode,
      pergunta: pergunta.question,
      resposta: dela?.resposta ?? null,
      grau: dela?.grau ?? null,
      reconhecimento: dela?.reconhecimento ?? "PENDENTE",
      correcao: dela?.correcao ?? null,
      importancia,
      celulas: celulasDaLinha,
      todosIguais: saoTodasIguais(
        celulasDaLinha,
        juizoExigidoEm(pergunta.subcriterionCode) !== null,
      ),
      opcoesMarcadas: dela?.opcoesMarcadas ?? [],
      opcoes: Object.entries(pergunta.options).map(([codigo, rotulo]) => ({ codigo, rotulo })),
      multi: pergunta.multi,
      origem: pergunta.mode,
    });
  }

  const cobertos = new Set(linhas.map((l) => l.subcriterionCode));

  const orfaos: Orfao[] = subcriteriosAtivos
    .filter((code) => !cobertos.has(code))
    .sort(ordemDosOrfaos)
    .map((code) => {
      const importancia = importancias[code] ?? null;
      return {
        subcriterionCode: code,
        rotulo: rotulos?.[code] ?? code,
        importancia,
        celulas: celulasDe(code, importancia, profissionais),
        // Um conceito que o Método não cruza não pede conferência de
        // ninguém — cobrá-la seria inventar trabalho.
        conferido: importancia !== null || !participaDoMotor(code),
      };
    });

  const gruposDeOrfaos: GrupoDeOrfaos[] = [];
  for (const orfao of orfaos) {
    const eixo = orfao.subcriterionCode.split("_")[0];
    const ultimo = gruposDeOrfaos[gruposDeOrfaos.length - 1];
    if (ultimo && ultimo.eixo === eixo) {
      (ultimo.itens as Orfao[]).push(orfao);
      continue;
    }
    gruposDeOrfaos.push({
      eixo,
      juizo: juizoExigidoEm(orfao.subcriterionCode) === "TECNICO" ? "TECNICO" : null,
      itens: [orfao],
    });
  }

  return {
    linhas,
    orfaos,
    gruposDeOrfaos,
    pendentesDeConferencia: orfaos.filter((o) => !o.conferido).map((o) => o.subcriterionCode),
    conferenciaCompleta: linhas.length + orfaos.length === ativos.size,
  };
}
