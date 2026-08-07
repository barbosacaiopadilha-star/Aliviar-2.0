import { CATALOGO_GERADO } from "./catalogo-gerado";
import {
  conferirCoerencia,
  type AfirmacaoDeDerivacao,
  type CadeiaDeProveniencia,
  type ContradicaoDeProveniencia,
} from "./cadeia-de-proveniencia";
import type { CompatibilityReading, CompatibilityResult } from "./motor-compatibilidade";
import type { SubcriterionStatus } from "./mapa-profissional";
import type { NeedDegree } from "./protocolos";

/**
 * FICHA DE EXPLICAÇÃO — Item 1.8 (Arquitetura §11), fechada na R1 · A3.
 *
 * @metodo §11.0 — nenhuma derivação entra em superfície sem explicação
 *                 reproduzível
 * @metodo §11.2 — seis respostas obrigatórias, nunca fundidas num resumo
 * @metodo §11.3 — grau de confiança qualitativo, com cinco proibições
 * @metodo §11.4 — cadeia de proveniência fechada ponta a ponta
 * @metodo §11.5 — a mesma Ficha, três vocabulários
 * @metodo CONTRATO_1_8_R1 §9 — UMA única modelagem de proveniência
 * @metodo CONTRATO_1_8_R1 §12 — A UNIDADE DE BLOQUEIO É A AFIRMAÇÃO
 *
 * O QUE A A3 MUDOU: o bloqueio deixou de ser tudo-ou-nada. Cada uma das seis
 * respostas exige ramos específicos da cadeia (a matriz do §12), e uma
 * afirmação cujo ramo está ausente ou incoerente é marcada NÃO EXIBÍVEL — com
 * conceito, motivo e, quando houver, a contradição nomeada — enquanto as
 * respostas independentes continuam de pé. R2 ("não há posição") não depende
 * de ramo nenhum e nunca bloqueia.
 *
 * A COERÊNCIA é do módulo canônico (`conferirCoerencia`): fatos da cadeia
 * confrontados entre si e contra o que um consumidor afirma. A autoridade é
 * sempre o fato persistido que a cadeia carregou — nunca o valor recebido de
 * fora. A Ficha não relê banco, não resolve vínculo, não escolhe versão.
 *
 * Pura: sem React, sem banco, sem relógio. Mesma entrada, mesma saída.
 */

// ---------------------------------------------------------------------------
// Entrada — a leitura do Motor e a cadeia canônica, nada além
// ---------------------------------------------------------------------------

export type EntradaDaFicha = {
  readonly professionalProfileId: string;
  /** LE3 — o cruzamento que o Motor já produziu. A Ficha não recalcula. */
  readonly leitura: CompatibilityReading;
  /**
   * A proveniência de cada conceito lido — UMA cadeia por conceito, montada
   * pelo repositório canônico. Conceito lido sem cadeia correspondente tem
   * TODAS as afirmações dependentes bloqueadas (`SEM_ORIGEM`).
   */
  readonly cadeias: readonly CadeiaDeProveniencia[];
  /** Conceitos que o Método mantém fora do Motor (participação `NUNCA`). */
  readonly foraDoMotorPorMetodo: readonly string[];
  /** Conceitos com juízo humano pendente, evidência vencida ou divergência. */
  readonly pendencias?: readonly PendenciaDeLeitura[];
  /**
   * O que um CONSUMIDOR afirma sobre a derivação de cada conceito — a frase
   * que cita regra e versão. A coerência confronta contra o persistido; a
   * divergência bloqueia a afirmação dependente com a contradição nomeada.
   */
  readonly afirmacoes?: readonly (AfirmacaoDeDerivacao & {
    readonly subcriterionCode: string;
  })[];
};

export const NATUREZAS_DE_LACUNA = [
  "NINGUEM_OLHOU",
  "OLHARAM_E_NAO_SOUBERAM",
  "EVIDENCIA_VENCIDA",
  "JUIZO_HUMANO_PENDENTE",
  "DIVERGENCIA_ABERTA",
] as const;

export type NaturezaDeLacuna = (typeof NATUREZAS_DE_LACUNA)[number];

export type PendenciaDeLeitura = {
  readonly subcriterionCode: string;
  readonly natureza: Extract<
    NaturezaDeLacuna,
    "EVIDENCIA_VENCIDA" | "JUIZO_HUMANO_PENDENTE" | "DIVERGENCIA_ABERTA"
  >;
};

// ---------------------------------------------------------------------------
// Grau de confiança — §11.3, qualitativo e só
// ---------------------------------------------------------------------------

export const GRAUS_DE_CONFIANCA = [
  "LEITURA_COMPLETA",
  "LEITURA_COM_LACUNAS",
  "LEITURA_INSUFICIENTE",
] as const;

export type GrauDeConfianca = (typeof GRAUS_DE_CONFIANCA)[number];

// ---------------------------------------------------------------------------
// As seis respostas — §11.2
// ---------------------------------------------------------------------------

export type ConceitoComCorrespondencia = {
  readonly subcriterionCode: string;
  readonly degreeDela: NeedDegree;
  readonly estadoDele: SubcriterionStatus;
  readonly resultado: CompatibilityResult;
};

export type CriterioQueInfluenciou = {
  readonly subcriterionCode: string;
  readonly resultado: CompatibilityResult;
};

export const MOTIVOS_DE_NAO_INFLUENCIA = [
  "FORA_DO_MOTOR_POR_METODO",
  "SEM_IMPORTANCIA_DECLARADA_PELO_CASE",
  "GRAU_SEM_PREFERENCIA",
] as const;

export type MotivoDeNaoInfluencia = (typeof MOTIVOS_DE_NAO_INFLUENCIA)[number];

export type CriterioQueNaoInfluenciou = {
  readonly subcriterionCode: string;
  readonly motivo: MotivoDeNaoInfluencia;
};

export type LacunaDaLeitura = {
  readonly subcriterionCode: string;
  readonly natureza: NaturezaDeLacuna;
};

/**
 * As seis respostas do §11.2, cada uma no seu campo. Fundi-las num resumo
 * seria exatamente o que a Arquitetura proíbe: quem pergunta "quais lacunas?"
 * não pode receber "no geral, boa leitura".
 */
export type SeisRespostas = {
  /** 1 — Por que foi escolhida? */
  readonly porQueFoiEscolhida: readonly ConceitoComCorrespondencia[];
  /**
   * 2 — Por que ficou nesta posição? NÃO HÁ POSIÇÃO (§4.6). A resposta é
   * constante e explícita: a Ficha diz isso em vez de silenciar.
   */
  readonly porQueNestaPosicao: typeof NAO_HA_POSICAO;
  /** 3 — Quais critérios influenciaram? */
  readonly criteriosQueInfluenciaram: readonly CriterioQueInfluenciou[];
  /** 4 — Quais NÃO influenciaram, e por quê? Três motivos, nunca fundidos. */
  readonly criteriosQueNaoInfluenciaram: readonly CriterioQueNaoInfluenciou[];
  /** 5 — Quais lacunas existem? Separadas por natureza. */
  readonly lacunas: readonly LacunaDaLeitura[];
  /** 6 — Qual o grau de confiança? Qualitativo (§11.3). */
  readonly grauDeConfianca: GrauDeConfianca;
};

export const NAO_HA_POSICAO = "NAO_HA_POSICAO" as const;

// ---------------------------------------------------------------------------
// AC-EXPLICA POR AFIRMAÇÃO — §12/§13
// ---------------------------------------------------------------------------

/** As seis afirmações da matriz lavrada. */
export const AFIRMACOES = ["R1", "R2", "R3", "R4", "R5", "R6"] as const;
export type Afirmacao = (typeof AFIRMACOES)[number];

/**
 * Os motivos de não-exibição. `SEM_EVIDENCIA_VINCULADA` materializa o §6 do
 * contrato: estado afirmado sem vínculo → ramo estado AUSENTE → afirmação
 * dependente não exibível. `PROVENIENCIA_INCONSISTENTE` é o único que EXIGE
 * discriminador — o tipo torna a omissão incompilável.
 */
export const MOTIVOS_DE_BLOQUEIO = [
  "SEM_ORIGEM",
  "SEM_DECLARACAO_ORIGINAL",
  "SEM_REGRA",
  "SEM_VERSAO",
  "VERSAO_INVALIDA",
  "SEM_EVIDENCIA_VINCULADA",
  "PROVENIENCIA_INCONSISTENTE",
] as const;

export type MotivoDeBloqueio = (typeof MOTIVOS_DE_BLOQUEIO)[number];

export type BloqueioDeAfirmacao =
  | {
      readonly afirmacao: Afirmacao;
      readonly subcriterionCode: string;
      readonly motivo: Exclude<MotivoDeBloqueio, "PROVENIENCIA_INCONSISTENTE">;
    }
  | {
      readonly afirmacao: Afirmacao;
      readonly subcriterionCode: string;
      readonly motivo: "PROVENIENCIA_INCONSISTENTE";
      /** OBRIGATÓRIO: inconsistência sem contradição nomeada não compila. */
      readonly contradicao: ContradicaoDeProveniencia;
    };

/** O status de cada afirmação — a unidade de bloqueio do §12. */
export type StatusDasAfirmacoes = Readonly<Record<Afirmacao, { readonly exibivel: boolean }>>;

export type FichaDeExplicacao = {
  readonly professionalProfileId: string;
  readonly respostas: SeisRespostas;
  /** Por afirmação: o que a superfície pode exibir (§12). R2 nunca bloqueia. */
  readonly status: StatusDasAfirmacoes;
  readonly cadeias: readonly CadeiaDeProveniencia[];
};

/**
 * O resultado NÃO é mais tudo-ou-nada (§13): a Ficha sempre existe, com o
 * status de cada afirmação; os bloqueios dizem exatamente qual afirmação não é
 * exibível, sobre qual conceito e por quê. `integral` é o atalho: nenhuma
 * afirmação bloqueada.
 */
export type ResultadoDaFicha = {
  readonly ficha: FichaDeExplicacao;
  readonly bloqueios: readonly BloqueioDeAfirmacao[];
  readonly integral: boolean;
};

// ---------------------------------------------------------------------------
// Construção
// ---------------------------------------------------------------------------

const CONCEITOS_ATIVOS = new Set(
  CATALOGO_GERADO.filter((c) => c.active).map((c) => c.code),
);

/**
 * A MATRIZ DO §12, por contradição/motivo → afirmações atingidas.
 *
 * Ramo importância sustenta R1, R3 e R6; ramo estado sustenta R1, R5 e R6.
 * R2 não depende de ramo (constante do contrato). R4-metodológica é fato do
 * Catálogo; R4-grau depende da declaração, e cai junto com ela.
 */
const RAMO_IMPORTANCIA: readonly Afirmacao[] = ["R1", "R3", "R6"];
const RAMO_ESTADO: readonly Afirmacao[] = ["R1", "R5", "R6"];
const TODOS_OS_RAMOS: readonly Afirmacao[] = ["R1", "R3", "R4", "R5", "R6"];

const CONTRADICOES_DO_ESTADO: ReadonlySet<ContradicaoDeProveniencia> = new Set([
  "EVIDENCIA_DIVERGENTE",
]);

function classificarLacuna(
  status: SubcriterionStatus | null,
  pendencia: PendenciaDeLeitura | undefined,
): NaturezaDeLacuna | null {
  if (pendencia) return pendencia.natureza;
  if (status === null) return "NINGUEM_OLHOU";
  if (status === "NAO_INFORMADO") return "OLHARAM_E_NAO_SOUBERAM";
  return null;
}

/**
 * §11.3 — a confiança descreve a suficiência da leitura de um profissional
 * CONSIGO MESMO, calculada só sobre o que passou no AC-EXPLICA (§15).
 * Inconsistência de proveniência nunca vira score: ela bloqueia R6, e o valor
 * calculado fica registrado sem ser exibível.
 */
function grauDeConfianca(
  lidos: readonly ConceitoComCorrespondencia[],
  lacunas: readonly LacunaDaLeitura[],
  essenciaisDoCase: readonly string[],
): GrauDeConfianca {
  const comEstado = new Set(lidos.map((c) => c.subcriterionCode));
  const nenhumEssencialLido =
    essenciaisDoCase.length > 0 && essenciaisDoCase.every((code) => !comEstado.has(code));

  if (nenhumEssencialLido) return "LEITURA_INSUFICIENTE";
  if (lacunas.length > 0) return "LEITURA_COM_LACUNAS";
  return "LEITURA_COMPLETA";
}

export function construirFicha(entrada: EntradaDaFicha): ResultadoDaFicha {
  const cadeiaPorCodigo = new Map(entrada.cadeias.map((c) => [c.subcriterionCode, c]));
  const pendenciaPorCodigo = new Map(
    (entrada.pendencias ?? []).map((p) => [p.subcriterionCode, p]),
  );
  const afirmacaoPorCodigo = new Map(
    (entrada.afirmacoes ?? []).map((a) => [a.subcriterionCode, a]),
  );
  const foraDoMotor = new Set(entrada.foraDoMotorPorMetodo);

  const bloqueios: BloqueioDeAfirmacao[] = [];
  const cadeiasUsadas: CadeiaDeProveniencia[] = [];
  const comCorrespondencia: ConceitoComCorrespondencia[] = [];
  const influenciaram: CriterioQueInfluenciou[] = [];
  const naoInfluenciaram: CriterioQueNaoInfluenciou[] = [];
  const lacunas: LacunaDaLeitura[] = [];
  const essenciais: string[] = [];

  const bloquear = (
    afirmacoes: readonly Afirmacao[],
    subcriterionCode: string,
    motivo: Exclude<MotivoDeBloqueio, "PROVENIENCIA_INCONSISTENTE">,
  ) => {
    for (const afirmacao of afirmacoes) bloqueios.push({ afirmacao, subcriterionCode, motivo });
  };
  const bloquearPorContradicao = (
    afirmacoes: readonly Afirmacao[],
    subcriterionCode: string,
    contradicao: ContradicaoDeProveniencia,
  ) => {
    for (const afirmacao of afirmacoes) {
      bloqueios.push({
        afirmacao,
        subcriterionCode,
        motivo: "PROVENIENCIA_INCONSISTENTE",
        contradicao,
      });
    }
  };

  for (const row of entrada.leitura.rows) {
    const code = row.subcriterionCode;
    const cadeia = cadeiaPorCodigo.get(code);

    // Sem cadeia não há o que explicar sobre NENHUM ramo deste conceito.
    if (!cadeia) {
      bloquear(TODOS_OS_RAMOS, code, "SEM_ORIGEM");
      continue;
    }
    cadeiasUsadas.push(cadeia);

    // R4-metodológica é fato do Catálogo — não depende de ramo (§12).
    if (foraDoMotor.has(code)) {
      naoInfluenciaram.push({ subcriterionCode: code, motivo: "FORA_DO_MOTOR_POR_METODO" });
      continue;
    }

    const { declaracao, proposta } = cadeia.fatos;
    let importanciaSustentada = true;
    let estadoSustentado = true;

    // --- ramo importância --------------------------------------------------
    if (!declaracao) {
      bloquear([...RAMO_IMPORTANCIA, "R4"], code, "SEM_DECLARACAO_ORIGINAL");
      importanciaSustentada = false;
    } else {
      if (declaracao.degree === "ESSENCIAL") essenciais.push(code);

      if (proposta) {
        if (!proposta.ruleId.trim()) {
          bloquear(RAMO_IMPORTANCIA, code, "SEM_REGRA");
          importanciaSustentada = false;
        }
        if (proposta.ruleVersion === null || proposta.ruleVersion === undefined) {
          bloquear(RAMO_IMPORTANCIA, code, "SEM_VERSAO");
          importanciaSustentada = false;
        } else if (!Number.isInteger(proposta.ruleVersion) || proposta.ruleVersion < 1) {
          bloquear(RAMO_IMPORTANCIA, code, "VERSAO_INVALIDA");
          importanciaSustentada = false;
        }
      }
    }

    // --- coerência: fatos ↔ fatos, afirmado ↔ persistido (§10) -------------
    for (const contradicao of conferirCoerencia(cadeia, afirmacaoPorCodigo.get(code))) {
      if (CONTRADICOES_DO_ESTADO.has(contradicao)) {
        bloquearPorContradicao(RAMO_ESTADO, code, contradicao);
        estadoSustentado = false;
      } else {
        bloquearPorContradicao(RAMO_IMPORTANCIA, code, contradicao);
        importanciaSustentada = false;
      }
    }

    // --- ramo estado (§6): estado AFIRMADO exige a evidência exata ---------
    const estadoAfirmado = row.status !== null;
    if (estadoAfirmado && !cadeia.fatos.evidencia) {
      // R5 fica de fora DE PROPÓSITO: a frase de R5 é sobre a lacuna, e a
      // lacuna é exatamente o que existe. Bloquear o relato da falta porque
      // falta seria o silêncio que o AC-EXPLICA proíbe.
      bloquear(["R1", "R3", "R6"], code, "SEM_EVIDENCIA_VINCULADA");
      estadoSustentado = false;
    }

    // --- conteúdo ----------------------------------------------------------
    if (declaracao?.degree === "SEM_PREFERENCIA") {
      naoInfluenciaram.push({ subcriterionCode: code, motivo: "GRAU_SEM_PREFERENCIA" });
      continue;
    }

    if (importanciaSustentada && (!estadoAfirmado || estadoSustentado)) {
      influenciaram.push({ subcriterionCode: code, resultado: row.result });
    }

    const natureza = classificarLacuna(row.status, pendenciaPorCodigo.get(code));
    if (natureza) {
      lacunas.push({ subcriterionCode: code, natureza });
    } else if (row.status && importanciaSustentada && estadoSustentado && declaracao) {
      comCorrespondencia.push({
        subcriterionCode: code,
        degreeDela: declaracao.degree,
        estadoDele: row.status,
        resultado: row.result,
      });
    }
  }

  // §11.2, resposta 4(b): conceito ativo que o Case não declarou é fato sobre o
  // CASE, nunca sobre o profissional.
  const lidos = new Set(entrada.leitura.rows.map((r) => r.subcriterionCode));
  for (const code of CONCEITOS_ATIVOS) {
    if (!lidos.has(code)) {
      naoInfluenciaram.push({
        subcriterionCode: code,
        motivo: "SEM_IMPORTANCIA_DECLARADA_PELO_CASE",
      });
    }
  }

  const bloqueadas = new Set(bloqueios.map((b) => b.afirmacao));
  const status: StatusDasAfirmacoes = {
    R1: { exibivel: !bloqueadas.has("R1") },
    R2: { exibivel: true }, // constante do contrato — nenhum ramo (§12)
    R3: { exibivel: !bloqueadas.has("R3") },
    R4: { exibivel: !bloqueadas.has("R4") },
    R5: { exibivel: !bloqueadas.has("R5") },
    R6: { exibivel: !bloqueadas.has("R6") },
  };

  return {
    ficha: {
      professionalProfileId: entrada.professionalProfileId,
      respostas: {
        porQueFoiEscolhida: comCorrespondencia,
        porQueNestaPosicao: NAO_HA_POSICAO,
        criteriosQueInfluenciaram: influenciaram,
        criteriosQueNaoInfluenciaram: naoInfluenciaram,
        lacunas,
        grauDeConfianca: grauDeConfianca(comCorrespondencia, lacunas, essenciais),
      },
      status,
      cadeias: cadeiasUsadas,
    },
    bloqueios,
    integral: bloqueios.length === 0,
  };
}

/**
 * AC-EXPLICA para um conjunto. A superfície precisa das DUAS informações: as
 * Fichas (todas — bloqueio de afirmação não é desaparecimento da Ficha, §13) e
 * a lista do que não é exibível, com motivo e contradição. Devolver só a
 * primeira seria o silêncio que o critério proíbe.
 */
export type LeituraExplicada = {
  readonly fichas: readonly FichaDeExplicacao[];
  readonly naoExibiveis: readonly {
    readonly professionalProfileId: string;
    readonly bloqueios: readonly BloqueioDeAfirmacao[];
  }[];
};

export function explicarLeitura(entradas: readonly EntradaDaFicha[]): LeituraExplicada {
  const fichas: FichaDeExplicacao[] = [];
  const naoExibiveis: LeituraExplicada["naoExibiveis"][number][] = [];

  for (const entrada of entradas) {
    const resultado = construirFicha(entrada);
    fichas.push(resultado.ficha);
    if (!resultado.integral) {
      naoExibiveis.push({
        professionalProfileId: resultado.ficha.professionalProfileId,
        bloqueios: resultado.bloqueios,
      });
    }
  }

  return { fichas, naoExibiveis };
}
