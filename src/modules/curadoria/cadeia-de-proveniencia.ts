import type { ImportanceLevel } from "./mapa-prioridades";
import type { SubcriterionStatus } from "./mapa-profissional";
import type { NeedDegree } from "./protocolos";

/**
 * CADEIA DE PROVENIÊNCIA — de onde veio cada coisa que decide.
 *
 * @metodo Arquitetura §11.4 — a cadeia completa, ponta a ponta
 * @metodo Arquitetura §17.5 M3 — reconstruir a árvore sem que ninguém precise
 *         lembrar de nada
 * @metodo Congelamento I-8 — ausência de informação nunca vira ausência da
 *         característica
 *
 * Por que existe: as duas entradas do Motor decidem, e até aqui não havia como
 * responder "quem disse isto, e a partir de quê". A auditoria chamou a isso de
 * D1/D2 — as tabelas com proveniência não alcançam o Motor, e as que alcançam
 * não tinham proveniência nenhuma. O PP-02 criou onde gravar o autor; este
 * módulo monta a árvore que a §11.4 desenha.
 *
 * O QUE ELE NUNCA FAZ, e isto é o mais importante: **inventar elo**. Onde o
 * registro não existe, a cadeia diz que não existe e por quê. Preencher uma
 * lacuna com suposição transformaria "ninguém registrou" em "registrado por
 * alguém" — exatamente a falsificação que a 2.0 existe para impedir.
 *
 * Puro e determinístico: sem React, sem banco.
 */

export type EloId =
  | "DECLARACAO_ORIGINAL"
  | "PROPOSTA"
  | "CONFIRMACAO"
  | "LEITURA";

/**
 * ITEM 1.8-R1 §16 — AUSENTE E NAO_APLICAVEL SÃO COISAS DIFERENTES.
 *
 * Um booleano só sabia dizer "tem" ou "não tem", e com isso empurrava para a
 * mesma vala dois fatos opostos: o nó que **deveria existir e não existe** — que
 * é lacuna e bloqueia a afirmação dependente — e o nó que **não existe
 * semanticamente naquele caminho**, que não é lacuna nenhuma.
 *
 * O caso que obrigou a distinção: importância declarada à mão pelo Curador não
 * passou por regra, logo não tem proposta. Marcar isso como ausente tornava
 * `cadeia.completa` permanentemente falsa e transformava o funcionamento normal
 * do regime atual em pendência eterna.
 */
export type MarcaDoElo = "PRESENTE" | "AUSENTE" | "NAO_APLICAVEL";

export type EloDeProveniencia = {
  id: EloId;
  /** O que este elo afirma, em uma frase. */
  afirma: string;
  marca: MarcaDoElo;
  /** Atalho de leitura: `marca === "PRESENTE"`. Nunca verdadeiro para o que não existe. */
  presente: boolean;
  /**
   * O conteúdo do elo, quando ele tem um: o grau e as opções que ela escolheu,
   * a importância registrada, o estado do profissional. Existe para que a
   * superfície não precise buscar o mesmo dado numa segunda fonte — a cadeia é
   * a fonte única do que este elo afirma.
   */
  detalhe: string | null;
  /** Quem praticou o ato. `null` quando o elo não existe ou não tem autor registrado. */
  autor: string | null;
  /**
   * A data do elo, e ela significa coisas diferentes conforme a fonte:
   *
   * - na declaração dela, é `case_needs.declared_at` — **quando ela declarou**;
   * - na confirmação, é o `updated_at` do Mapa — **quando o registro foi
   *   gravado pela última vez**, que é a data mais próxima da confirmação que
   *   o banco guarda hoje. Não existe coluna de "data da confirmação", e
   *   inventá-la seria afirmar precisão que o sistema não tem.
   */
  em: string | null;
  /**
   * Por que o elo falta — ou por que ele não se aplica. `null` só quando o elo
   * está presente. Nunca vazio quando não está: uma ausência sem explicação é
   * indistinguível de um erro de leitura.
   */
  lacuna: string | null;
};

export type RamoDeProveniencia = {
  lado: "PESSOA" | "PROFISSIONAL";
  elos: EloDeProveniencia[];
  /**
   * Verdadeiro quando nenhum elo do ramo está AUSENTE. `NAO_APLICAVEL` não
   * impede completude: um caminho que não passa por regra está completo sem
   * proposta, e dizer o contrário seria cobrar um fato que não deveria existir.
   */
  completo: boolean;
};

export type CadeiaDeProveniencia = {
  subcriterionCode: string;
  ramos: RamoDeProveniencia[];
  completa: boolean;
  /** Os elos ausentes, nomeados — a lista que um auditor lê primeiro. */
  lacunas: { lado: RamoDeProveniencia["lado"]; elo: EloId; porque: string }[];
  /** A identidade do alvo desta cadeia — `null` quando o chamador não a deu. */
  alvo: { caseId: string | null; professionalProfileId: string | null };
  /**
   * OS FATOS TIPADOS, ECOADOS — 1.8-R1 · A2.
   *
   * Os elos contam a história em prosa; quem CONSOME a cadeia (a Ficha, a
   * coerência da A3) precisa dos fatos como dado: o grau declarado, a regra e
   * a versão exatas, a evidência apontada. Até aqui o montador os descartava
   * depois de escrever as frases — e um consumidor que precisasse deles teria
   * de recebê-los por fora, num segundo modelo. Foi exatamente assim que
   * `OrigemDoConceito` nasceu.
   *
   * Agora a cadeia carrega o que recebeu. Um modelo só: elos para ler, fatos
   * para confrontar. Nenhum campo aqui é uma segunda fonte — são os MESMOS
   * valores que produziram os elos, sem transformação.
   */
  fatos: FatosDaCadeia;
};

export type FatosDaCadeia = {
  declaracao: EntradaDaPessoa["declaracao"];
  importancia: EntradaDaPessoa["importancia"];
  /** `null` = não houve derivação (elo `NAO_APLICAVEL`), nunca "faltou". */
  proposta: PropostaDaCadeia | null;
  estado: EntradaDoProfissional["estado"];
  /** `null` = registro sem vínculo (elo `AUSENTE`), nunca "a mais recente". */
  evidencia: EvidenciaDaCadeia | null;
};

/**
 * O elo que a Onda 1 ainda não pode ter.
 *
 * A Camada de Derivação é da Onda 2 e exige a ADR-066. (A guarda C-01 proíbe
 * até o nome da tabela em `src/` enquanto ela não existir — e faz bem: foi ela
 * que apanhou este comentário.)
 * Enquanto ela não existir, este elo é sempre ausente — e dizê-lo é o
 * comportamento correto: a cadeia declara o que falta em vez de fingir que a
 * importância nasceu de uma regra.
 */
const IMPORTANCIA_DECLARADA_A_MAO =
  "Esta importância não veio de derivação: o Curador a declarou diretamente. Não há regra versionada a citar porque nenhuma foi usada — e isso não é lacuna, é o caminho manual funcionando como previsto (1.8-R1 §16).";

export type EntradaDaPessoa = {
  /** O que ela declarou, de `case_needs`. `null` = ela não declarou este conceito. */
  declaracao: {
    degree: NeedDegree;
    options: string[];
    declaredBy: string | null;
    declaredAt: string | null;
  } | null;
  /** A importância vigente no Mapa do Case. `null` = ninguém declarou ainda. */
  importancia: {
    importance: ImportanceLevel;
    declaredBy: string | null;
    /** `updated_at` do Mapa — quando o registro foi gravado, não "quando confirmou". */
    registradoEm: string | null;
  } | null;
  /**
   * A proposta persistida que derivou esta importância, quando houve derivação.
   *
   * `null` = a importância foi declarada à mão, e o elo `PROPOSTA` é
   * `NAO_APLICAVEL` (§16) — não uma lacuna.
   *
   * Os campos de confronto (`caseId`, `subcriterionCode`, `originRecord`,
   * `originVersion`) viajam junto de propósito: a fase seguinte confronta cada
   * um contra a linha persistida, e descartá-los aqui obrigaria a segunda
   * consulta que este contrato existe para evitar.
   */
  proposta?: PropostaDaCadeia | null;
};

/** O nó `PROPOSTA` como o banco o guarda — lido só pelo repositório canônico. */
export type PropostaDaCadeia = {
  propostaId: string;
  ruleId: string;
  ruleVersion: number;
  caseId: string;
  subcriterionCode: string;
  suggestedValue: string;
  /** `case_needs` de origem e o grau que valia quando a proposta foi emitida. */
  originRecord: string | null;
  originVersion: string | null;
  originAuthor: string | null;
  emittedAt: string | null;
};

export type EntradaDoProfissional = {
  /** O estado vigente no Mapa do Profissional. `null` = ninguém declarou ainda. */
  estado: {
    status: SubcriterionStatus;
    declaredBy: string | null;
    /** `updated_at` do Mapa — mesma semântica do lado do Case. */
    registradoEm: string | null;
  } | null;
  /**
   * A evidência EXATA apontada por `professional_subcriterion_map.evidence_id`.
   *
   * `null` = registro sem vínculo (legado ou fluxo que ainda não o informa) —
   * o elo vira `AUSENTE`, e **nenhuma evidência é escolhida por proximidade ou
   * por maior versão** para preencher o buraco (1.8-R1 §11, §13).
   */
  evidencia?: EvidenciaDaCadeia | null;
};

/** A linha de `practice_evidence` alcançada pelo vínculo — nunca por `max(version)`. */
export type EvidenciaDaCadeia = {
  evidenceId: string;
  professionalProfileId: string;
  subcriterionCode: string;
  version: number;
  source: string;
  sourceTier: string;
  collectedBy: string | null;
  collectedAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationSource: string | null;
};

function elo(
  id: EloId,
  afirma: string,
  dados: { detalhe?: string | null; autor?: string | null; em?: string | null } | null,
  lacuna: string,
): EloDeProveniencia {
  if (!dados) {
    return { id, afirma, marca: "AUSENTE", presente: false, detalhe: null, autor: null, em: null, lacuna };
  }
  return {
    id,
    afirma,
    marca: "PRESENTE",
    presente: true,
    detalhe: dados.detalhe ?? null,
    autor: dados.autor ?? null,
    em: dados.em ?? null,
    lacuna: null,
  };
}

/**
 * O elo que não se aplica àquele caminho. Carrega o motivo, como os ausentes —
 * mas não conta como lacuna e não bloqueia nada.
 */
function eloNaoAplicavel(id: EloId, afirma: string, porque: string): EloDeProveniencia {
  return {
    id,
    afirma,
    marca: "NAO_APLICAVEL",
    presente: false,
    detalhe: null,
    autor: null,
    em: null,
    lacuna: porque,
  };
}

/**
 * Monta a cadeia de um conceito, dos dois lados.
 *
 * O ramo da pessoa: o que ela declarou → (proposta) → a importância confirmada.
 * O ramo do profissional: a evidência → (proposta) → o estado confirmado.
 *
 * A leitura do Motor (`LEITURA`) fecha os dois ramos: ela existe quando existem
 * importância e estado, porque é deles que a célula nasce.
 */
export function montarCadeiaDeProveniencia(input: {
  subcriterionCode: string;
  pessoa: EntradaDaPessoa;
  profissional: EntradaDoProfissional;
  /**
   * A IDENTIDADE DO ALVO — de quem é esta cadeia (A3). O repositório canônico
   * a preenche com os parâmetros da consulta; sem ela, a coerência não teria
   * contra o que confrontar uma proposta ou evidência "de outro lugar".
   * `null` em chamadores antigos: a coerência pula o confronto que não pode
   * fazer, em vez de inventar identidade.
   */
  alvo?: { caseId: string | null; professionalProfileId: string | null };
}): CadeiaDeProveniencia {
  const { pessoa, profissional } = input;

  const temLeitura = Boolean(pessoa.importancia && profissional.estado);

  const ramoPessoa: RamoDeProveniencia = {
    lado: "PESSOA",
    elos: [
      elo(
        "DECLARACAO_ORIGINAL",
        "O que ela declarou sobre este conceito, com o grau nas palavras dela.",
        pessoa.declaracao
          ? {
              detalhe: [pessoa.declaracao.degree, ...pessoa.declaracao.options]
                .filter((parte) => parte && parte.trim() !== "")
                .join(" · "),
              autor: pessoa.declaracao.declaredBy,
              em: pessoa.declaracao.declaredAt,
            }
          : null,
        "Ela ainda não declarou nada sobre este conceito — não há resposta em `case_needs`.",
      ),
      pessoa.proposta
        ? elo(
            "PROPOSTA",
            "A regra versionada que transformou a declaração em importância.",
            {
              detalhe: `${pessoa.proposta.suggestedValue} · regra ${pessoa.proposta.ruleId} v${pessoa.proposta.ruleVersion}`,
              autor: pessoa.proposta.originAuthor,
              em: pessoa.proposta.emittedAt,
            },
            "",
          )
        : eloNaoAplicavel(
            "PROPOSTA",
            "A regra versionada que transformou a declaração em importância.",
            IMPORTANCIA_DECLARADA_A_MAO,
          ),
      elo(
        "CONFIRMACAO",
        "A importância que vale para este Case, e quem a declarou.",
        pessoa.importancia
          ? {
              detalhe: pessoa.importancia.importance,
              autor: pessoa.importancia.declaredBy,
              em: pessoa.importancia.registradoEm,
            }
          : null,
        "Ninguém declarou a importância deste conceito no Mapa de Prioridades.",
      ),
      elo(
        "LEITURA",
        "A célula do Motor nasce do encontro entre a importância e o estado.",
        temLeitura ? {} : null,
        "Sem importância declarada ou sem estado do profissional, não há célula a ler.",
      ),
    ],
    completo: false,
  };

  const ramoProfissional: RamoDeProveniencia = {
    lado: "PROFISSIONAL",
    elos: [
      // A1 (Etapa 1): este elo AFIRMAVA ler a Base de Evidências — fonte,
      // versão e verificação —, e o repositório nunca a leu: entregava sempre
      // ausência. Dizer que se lê o que não se lê é o mesmo vício que a cadeia
      // existe para combater, do lado de dentro. O texto passa a declarar o
      // que o sistema de fato sabe hoje: nada.
      // 1.8-R1: o vínculo passou a existir (`evidence_id`). Quando ele está lá,
      // a cadeia lê a linha EXATA que sustentava o estado — nunca "a mais
      // recente". Quando não está, o elo é AUSENTE e diz por quê.
      profissional.evidencia
        ? elo(
            "DECLARACAO_ORIGINAL",
            "A evidência de prática que sustenta este estado, na Base de Evidências.",
            {
              detalhe: `v${profissional.evidencia.version} · ${profissional.evidencia.sourceTier} · ${profissional.evidencia.source}`,
              autor: profissional.evidencia.collectedBy,
              em: profissional.evidencia.collectedAt,
            },
            "",
          )
        : elo(
            "DECLARACAO_ORIGINAL",
            "A evidência de prática que sustenta este estado, na Base de Evidências.",
            null,
            "Este registro não tem vínculo com a evidência que o sustentava: é anterior ao regime do vínculo, ou foi gravado por fluxo que ainda não o informa. Nenhuma evidência é escolhida por proximidade ou por ser a mais recente — sem vínculo, a origem deste lado permanece desconhecida.",
          ),
      eloNaoAplicavel(
        "PROPOSTA",
        "A regra versionada que transformou a evidência em estado.",
        "Não existe proposta do lado do profissional: o estado é declarado a partir da evidência, sem passar por regra de derivação. O emissor do lado profissional não pertence a esta Onda.",
      ),
      elo(
        "CONFIRMACAO",
        "O estado que vale no Mapa do Profissional, e quem o declarou.",
        profissional.estado
          ? {
              detalhe: profissional.estado.status,
              autor: profissional.estado.declaredBy,
              em: profissional.estado.registradoEm,
            }
          : null,
        "Ninguém declarou o estado deste conceito no Mapa do Profissional.",
      ),
      elo(
        "LEITURA",
        "A célula do Motor nasce do encontro entre a importância e o estado.",
        temLeitura ? {} : null,
        "Sem importância declarada ou sem estado do profissional, não há célula a ler.",
      ),
    ],
    completo: false,
  };

  // 1.8-R1 §16: só `AUSENTE` é lacuna. `NAO_APLICAVEL` é caminho que não passa
  // por ali, e cobrá-lo seria exigir um fato que não deveria existir.
  for (const ramo of [ramoPessoa, ramoProfissional]) {
    ramo.completo = ramo.elos.every((entrada) => entrada.marca !== "AUSENTE");
  }

  const lacunas = [ramoPessoa, ramoProfissional].flatMap((ramo) =>
    ramo.elos
      .filter((entrada) => entrada.marca === "AUSENTE")
      .map((entrada) => ({ lado: ramo.lado, elo: entrada.id, porque: entrada.lacuna! })),
  );

  return {
    subcriterionCode: input.subcriterionCode,
    ramos: [ramoPessoa, ramoProfissional],
    completa: lacunas.length === 0,
    lacunas,
    alvo: {
      caseId: input.alvo?.caseId ?? null,
      professionalProfileId: input.alvo?.professionalProfileId ?? null,
    },
    // Os mesmos valores que produziram os elos, sem transformação (A2).
    fatos: {
      declaracao: pessoa.declaracao,
      importancia: pessoa.importancia,
      proposta: pessoa.proposta ?? null,
      estado: profissional.estado,
      evidencia: profissional.evidencia ?? null,
    },
  };
}

/**
 * A frase que um auditor lê primeiro: o que dá para reconstruir, e o que não.
 *
 * Nunca conclui qualidade, nunca julga quem declarou — descreve o estado da
 * rastreabilidade e mais nada (I-9).
 */
export function fraseDaCadeia(cadeia: CadeiaDeProveniencia): string {
  if (cadeia.completa) {
    return "Toda a cadeia deste conceito é reconstituível: declaração, proposta, confirmação e leitura.";
  }
  const total = cadeia.ramos.reduce((soma, ramo) => soma + ramo.elos.length, 0);
  const presentes = total - cadeia.lacunas.length;
  return `${presentes} de ${total} elos registrados. ${cadeia.lacunas.length} ainda não existe${
    cadeia.lacunas.length === 1 ? "" : "m"
  } — e a cadeia diz qual, em vez de supor.`;
}

// ---------------------------------------------------------------------------
// COERÊNCIA — 1.8-R1 · A3 (CONTRATO §10)
// ---------------------------------------------------------------------------

/**
 * O ENUM FECHADO DAS CONTRADIÇÕES, na ordem lavrada do §10.
 *
 * "Regra inexistente" e "versão inexistente" NÃO recebem código, de propósito:
 * a FK composta da MR1.3 as torna impossíveis no banco, e criar motivo para o
 * impossível seria código morto de outro tipo (§10, nota final).
 */
export const CONTRADICOES_DE_PROVENIENCIA = [
  "PROPOSTA_INEXISTENTE",
  "PROPOSTA_DE_OUTRA_REGRA",
  "PROPOSTA_DE_OUTRA_VERSAO",
  "ALVO_DIVERGENTE",
  "ORIGEM_DE_OUTRA_PESSOA",
  "ORIGEM_SUPERADA",
  "CONCEITO_DIVERGENTE",
  "EVIDENCIA_DIVERGENTE",
] as const;

export type ContradicaoDeProveniencia = (typeof CONTRADICOES_DE_PROVENIENCIA)[number];

/**
 * O que um CONSUMIDOR afirma sobre a derivação — a frase do Relatório que cita
 * regra e versão, o registro de auditoria que cita a proposta. A coerência
 * confronta o afirmado contra o persistido; a AUTORIDADE é sempre o fato que a
 * cadeia carregou do banco, nunca o valor recebido de fora.
 */
export type AfirmacaoDeDerivacao = {
  readonly ruleId?: string;
  readonly ruleVersion?: number;
  readonly propostaId?: string;
};

/**
 * Confronta a cadeia contra si mesma e contra o que o consumidor afirma.
 *
 * SEM segunda leitura do banco: os fatos já vieram do repositório canônico, e
 * reler aqui seria a segunda fonte que este módulo existe para impedir. O que
 * se confronta:
 *
 *  - fatos ↔ fatos (a proposta é DESTE alvo? a origem é DESTA declaração? a
 *    evidência é DESTE profissional e DESTE conceito?);
 *  - afirmado ↔ persistido (a regra/versão que alguém citou é a que emitiu?).
 *
 * Regime histórico (§16): `declaredBy = null` é registro anterior ao regime de
 * autoria — o confronto de autor SÓ acontece quando os dois lados existem.
 * Ausência legítima nunca vira contradição.
 */
export function conferirCoerencia(
  cadeia: CadeiaDeProveniencia,
  afirmado?: AfirmacaoDeDerivacao,
): ContradicaoDeProveniencia[] {
  const contradicoes: ContradicaoDeProveniencia[] = [];
  const { proposta, declaracao, evidencia } = cadeia.fatos;

  // --- afirmado ↔ persistido -----------------------------------------------
  if (afirmado && (afirmado.ruleId !== undefined || afirmado.ruleVersion !== undefined)) {
    if (!proposta) {
      // O caminho afirmado exige proposta, e ela não existe. Isto NÃO é o
      // caminho manual: manual é quando NINGUÉM afirma regra (§6).
      contradicoes.push("PROPOSTA_INEXISTENTE");
    } else {
      if (afirmado.ruleId !== undefined && afirmado.ruleId !== proposta.ruleId) {
        contradicoes.push("PROPOSTA_DE_OUTRA_REGRA");
      }
      if (afirmado.ruleVersion !== undefined && afirmado.ruleVersion !== proposta.ruleVersion) {
        contradicoes.push("PROPOSTA_DE_OUTRA_VERSAO");
      }
      if (afirmado.propostaId !== undefined && afirmado.propostaId !== proposta.propostaId) {
        contradicoes.push("ALVO_DIVERGENTE");
      }
    }
  }

  // --- a proposta é deste alvo? --------------------------------------------
  if (proposta) {
    if (cadeia.alvo.caseId !== null && proposta.caseId !== cadeia.alvo.caseId) {
      contradicoes.push("ALVO_DIVERGENTE");
    }
    if (proposta.subcriterionCode !== cadeia.subcriterionCode) {
      contradicoes.push("CONCEITO_DIVERGENTE");
    }

    // --- a origem é desta declaração? --------------------------------------
    if (declaracao) {
      if (
        proposta.originAuthor !== null &&
        declaracao.declaredBy !== null &&
        proposta.originAuthor !== declaracao.declaredBy
      ) {
        contradicoes.push("ORIGEM_DE_OUTRA_PESSOA");
      }
      // S1 (ADR-066 §9): a proposta guarda o grau que valia quando foi
      // emitida. Se a pessoa redeclarou depois, a proposta está SUPERADA — e
      // uma frase apoiada nela estaria afirmando o passado como presente.
      if (proposta.originVersion !== null && proposta.originVersion !== declaracao.degree) {
        contradicoes.push("ORIGEM_SUPERADA");
      }
    }
  }

  // --- a evidência é deste profissional, deste conceito? -------------------
  if (evidencia) {
    const profissionalDivergente =
      cadeia.alvo.professionalProfileId !== null &&
      evidencia.professionalProfileId !== cadeia.alvo.professionalProfileId;
    const conceitoDivergente = evidencia.subcriterionCode !== cadeia.subcriterionCode;
    if (profissionalDivergente || conceitoDivergente) {
      // No banco, a FK composta e o trigger de conceito tornam isto
      // impossível (provas A/B/C da A1.1). A conferência existe para a cadeia
      // sintética e para o dia em que alguém desligar a proteção — defesa em
      // profundidade, com o mesmo nome nas duas camadas.
      contradicoes.push("EVIDENCIA_DIVERGENTE");
    }
  }

  return contradicoes;
}
