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

export type EloDeProveniencia = {
  id: EloId;
  /** O que este elo afirma, em uma frase. */
  afirma: string;
  presente: boolean;
  /** Quem praticou o ato. `null` quando o elo não existe ou não tem autor registrado. */
  autor: string | null;
  /** Quando. `null` pelo mesmo motivo. */
  em: string | null;
  /**
   * Por que o elo falta. `null` quando ele está presente. Nunca vazio quando
   * ausente: uma lacuna sem explicação é indistinguível de um erro de leitura.
   */
  lacuna: string | null;
};

export type RamoDeProveniencia = {
  lado: "PESSOA" | "PROFISSIONAL";
  elos: EloDeProveniencia[];
  /** Verdadeiro só quando TODOS os elos do ramo existem. */
  completo: boolean;
};

export type CadeiaDeProveniencia = {
  subcriterionCode: string;
  ramos: RamoDeProveniencia[];
  completa: boolean;
  /** Os elos ausentes, nomeados — a lista que um auditor lê primeiro. */
  lacunas: { lado: RamoDeProveniencia["lado"]; elo: EloId; porque: string }[];
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
const PROPOSTA_AINDA_NAO_EXISTE =
  "A Camada de Derivação ainda não existe (Onda 2, ADR-066): não há regra versionada que tenha proposto este valor. Quem o declarou, declarou diretamente.";

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
  } | null;
};

export type EntradaDoProfissional = {
  /** A evidência de origem, de `practice_evidence`. `null` = não há. */
  evidencia: {
    version: number | null;
    source: string | null;
    verifiedBy: string | null;
    verifiedAt: string | null;
  } | null;
  /** O estado vigente no Mapa do Profissional. `null` = ninguém declarou ainda. */
  estado: {
    status: SubcriterionStatus;
    declaredBy: string | null;
  } | null;
};

function elo(
  id: EloId,
  afirma: string,
  dados: { autor?: string | null; em?: string | null } | null,
  lacuna: string,
): EloDeProveniencia {
  if (!dados) {
    return { id, afirma, presente: false, autor: null, em: null, lacuna };
  }
  return {
    id,
    afirma,
    presente: true,
    autor: dados.autor ?? null,
    em: dados.em ?? null,
    lacuna: null,
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
          ? { autor: pessoa.declaracao.declaredBy, em: pessoa.declaracao.declaredAt }
          : null,
        "Ela ainda não declarou nada sobre este conceito — não há resposta em `case_needs`.",
      ),
      elo("PROPOSTA", "A regra versionada que transformou a declaração em importância.", null, PROPOSTA_AINDA_NAO_EXISTE),
      elo(
        "CONFIRMACAO",
        "A importância que vale para este Case, e quem a declarou.",
        pessoa.importancia ? { autor: pessoa.importancia.declaredBy } : null,
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
      elo(
        "DECLARACAO_ORIGINAL",
        "A evidência de prática que sustenta este conceito, com fonte e verificação.",
        profissional.evidencia
          ? { autor: profissional.evidencia.verifiedBy, em: profissional.evidencia.verifiedAt }
          : null,
        "Não há evidência registrada na Base para este conceito.",
      ),
      elo("PROPOSTA", "A regra versionada que transformou a evidência em estado.", null, PROPOSTA_AINDA_NAO_EXISTE),
      elo(
        "CONFIRMACAO",
        "O estado que vale no Mapa do Profissional, e quem o declarou.",
        profissional.estado ? { autor: profissional.estado.declaredBy } : null,
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

  for (const ramo of [ramoPessoa, ramoProfissional]) {
    ramo.completo = ramo.elos.every((entrada) => entrada.presente);
  }

  const lacunas = [ramoPessoa, ramoProfissional].flatMap((ramo) =>
    ramo.elos
      .filter((entrada) => !entrada.presente)
      .map((entrada) => ({ lado: ramo.lado, elo: entrada.id, porque: entrada.lacuna! })),
  );

  return {
    subcriterionCode: input.subcriterionCode,
    ramos: [ramoPessoa, ramoProfissional],
    completa: lacunas.length === 0,
    lacunas,
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
