import { CATALOGO_GERADO } from "./catalogo-gerado";
import type { CompatibilityReading, CompatibilityResult } from "./motor-compatibilidade";
import type { SubcriterionStatus } from "./mapa-profissional";
import type { NeedDegree } from "./protocolos";
import { deixouDeValer, type EstadoDaRegra } from "./regra-de-derivacao-contrato";

/**
 * FICHA DE EXPLICAÇÃO — Item 1.8 (Arquitetura §11).
 *
 * @metodo §11.0 — nenhuma derivação entra em superfície sem explicação
 *                 reproduzível. A explicabilidade é PRÉ-CONDIÇÃO da primeira
 *                 derivação apresentada a qualquer humano, não refinamento
 *                 posterior.
 * @metodo §11.2 — seis respostas obrigatórias, nunca fundidas num resumo
 * @metodo §11.3 — grau de confiança qualitativo, com cinco proibições
 * @metodo §11.4 — cadeia de proveniência fechada ponta a ponta
 * @metodo §11.5 — a mesma Ficha, três vocabulários
 *
 * LEITURA DERIVADA, NUNCA FATO NOVO. A Ficha não persiste nada, não corrige
 * proposta, não reordena ninguém e não cria classificação. Ela recompõe, a
 * partir de fatos que já existem, o porquê de um profissional aparecer como
 * aparece. Se os fatos não bastam, ela **não inventa**: declara o bloqueio com
 * nome, e a superfície não renderiza (AC-EXPLICA).
 *
 * Puro: sem React, sem banco, sem relógio. Mesma entrada, mesma saída.
 */

// ---------------------------------------------------------------------------
// Entrada — só contratos que já existem
// ---------------------------------------------------------------------------

/**
 * A origem da importância de um conceito, quando ela foi DERIVADA.
 *
 * `null` em `derivacao` significa importância declarada à mão pelo Curador —
 * caminho legítimo e hoje único, já que nenhuma regra real foi materializada.
 * O que **não** é legítimo é derivação sem regra, sem versão ou sem a
 * declaração original da pessoa: aí a cadeia do §11.4 está rompida.
 */
export type OrigemDoConceito = {
  readonly subcriterionCode: string;
  /** `case_needs` — o que a pessoa declarou, com data e autoria. */
  readonly declaracaoOriginal: {
    readonly degree: NeedDegree;
    readonly declaredAt: string;
    readonly declaredBy: string;
  } | null;
  /** Presente quando a importância veio da Camada de Derivação. */
  readonly derivacao: {
    readonly ruleId: string;
    readonly ruleVersion: number;
    readonly estadoDaRegra: EstadoDaRegra;
    readonly propostaId: string;
  } | null;
};

export type EntradaDaFicha = {
  readonly professionalProfileId: string;
  /** LE3 — o cruzamento que o Motor já produziu. A Ficha não recalcula. */
  readonly leitura: CompatibilityReading;
  /** LE1 — a origem de cada conceito lido. */
  readonly origens: readonly OrigemDoConceito[];
  /** Conceitos que o Método mantém fora do Motor (participação `NUNCA`). */
  readonly foraDoMotorPorMetodo: readonly string[];
  /** Conceitos com juízo humano pendente, evidência vencida ou divergência. */
  readonly pendencias?: readonly PendenciaDeLeitura[];
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
// Proveniência — §11.4
// ---------------------------------------------------------------------------

export type ProvenienciaDoConceito = {
  readonly subcriterionCode: string;
  readonly declaracaoOriginal: NonNullable<OrigemDoConceito["declaracaoOriginal"]>;
  /** `null` quando a importância foi declarada à mão, sem passar por regra. */
  readonly regra: {
    readonly ruleId: string;
    readonly ruleVersion: number;
    readonly estadoDaRegra: EstadoDaRegra;
    readonly propostaId: string;
  } | null;
};

export type FichaDeExplicacao = {
  readonly professionalProfileId: string;
  readonly respostas: SeisRespostas;
  readonly proveniencia: readonly ProvenienciaDoConceito[];
};

// ---------------------------------------------------------------------------
// AC-EXPLICA — bloqueio nomeado, nunca silêncio, nunca reserva genérica
// ---------------------------------------------------------------------------

export const MOTIVOS_DE_BLOQUEIO = [
  "SEM_ORIGEM",
  "SEM_DECLARACAO_ORIGINAL",
  "SEM_REGRA",
  "SEM_VERSAO",
  "VERSAO_INVALIDA",
  "REGRA_NAO_APLICAVEL",
  "PROVENIENCIA_INCONSISTENTE",
] as const;

export type MotivoDeBloqueio = (typeof MOTIVOS_DE_BLOQUEIO)[number];

export type Bloqueio = {
  readonly subcriterionCode: string;
  readonly motivo: MotivoDeBloqueio;
};

export type ResultadoDaFicha =
  | { readonly renderizavel: true; readonly ficha: FichaDeExplicacao }
  | {
      readonly renderizavel: false;
      readonly professionalProfileId: string;
      readonly bloqueios: readonly Bloqueio[];
    };

// ---------------------------------------------------------------------------
// Construção
// ---------------------------------------------------------------------------

const CONCEITOS_ATIVOS = new Set(
  CATALOGO_GERADO.filter((c) => c.active).map((c) => c.code),
);

/**
 * A cadeia do §11.4, conferida conceito a conceito.
 *
 * Uma importância pode chegar por dois caminhos legítimos: declarada à mão pelo
 * Curador, ou derivada por regra. O que a Ficha recusa é o meio-termo — algo
 * que se apresenta como derivado mas não consegue dizer de qual regra, de qual
 * versão, ou sobre qual declaração da pessoa. Aí não há explicação: há
 * aparência de explicação, que é pior.
 */
function conferirProveniencia(origem: OrigemDoConceito): Bloqueio[] {
  const bloqueios: Bloqueio[] = [];
  const code = origem.subcriterionCode;

  if (!origem.declaracaoOriginal) {
    bloqueios.push({ subcriterionCode: code, motivo: "SEM_DECLARACAO_ORIGINAL" });
  }

  if (origem.derivacao) {
    const { ruleId, ruleVersion, estadoDaRegra } = origem.derivacao;
    if (!ruleId.trim()) bloqueios.push({ subcriterionCode: code, motivo: "SEM_REGRA" });
    if (ruleVersion === null || ruleVersion === undefined) {
      bloqueios.push({ subcriterionCode: code, motivo: "SEM_VERSAO" });
    } else if (!Number.isInteger(ruleVersion) || ruleVersion < 1) {
      // Versão não é "a regra atual": é um número exato. Zero, fracionário ou
      // negativo não identifica versão nenhuma — é lookup implícito disfarçado.
      bloqueios.push({ subcriterionCode: code, motivo: "VERSAO_INVALIDA" });
    }
    if (deixouDeValer(estadoDaRegra) || estadoDaRegra === "PROPOSTA") {
      // Regra revogada, suspensa ou ainda em proposta não sustenta a frase que
      // já está na tela. Fingir validade é o defeito que o §11.0 nomeia.
      bloqueios.push({ subcriterionCode: code, motivo: "REGRA_NAO_APLICAVEL" });
    }
  }

  return bloqueios;
}

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
 * CONSIGO MESMO. Nenhum termo aqui olha para outro profissional, e o resultado
 * é um dos três estados nomeados: não há número intermediário do qual ele seja
 * derivado, porque um número intermediário viraria chave de ordenação no dia
 * seguinte.
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
  const origemPorCodigo = new Map(entrada.origens.map((o) => [o.subcriterionCode, o]));
  const pendenciaPorCodigo = new Map(
    (entrada.pendencias ?? []).map((p) => [p.subcriterionCode, p]),
  );
  const foraDoMotor = new Set(entrada.foraDoMotorPorMetodo);

  const bloqueios: Bloqueio[] = [];
  const proveniencia: ProvenienciaDoConceito[] = [];
  const comCorrespondencia: ConceitoComCorrespondencia[] = [];
  const influenciaram: CriterioQueInfluenciou[] = [];
  const naoInfluenciaram: CriterioQueNaoInfluenciou[] = [];
  const lacunas: LacunaDaLeitura[] = [];
  const essenciais: string[] = [];

  for (const row of entrada.leitura.rows) {
    const code = row.subcriterionCode;
    const origem = origemPorCodigo.get(code);

    // Sem origem não há o que explicar. Renderizar aqui seria afirmar um fato
    // sobre alguém sem conseguir dizer de onde ele veio.
    if (!origem) {
      bloqueios.push({ subcriterionCode: code, motivo: "SEM_ORIGEM" });
      continue;
    }

    const problemas = conferirProveniencia(origem);
    if (problemas.length > 0) {
      bloqueios.push(...problemas);
      continue;
    }

    // A partir daqui `declaracaoOriginal` existe: `conferirProveniencia` já
    // teria bloqueado.
    const declaracao = origem.declaracaoOriginal!;
    if (declaracao.degree === "ESSENCIAL") essenciais.push(code);

    proveniencia.push({
      subcriterionCode: code,
      declaracaoOriginal: declaracao,
      regra: origem.derivacao,
    });

    if (foraDoMotor.has(code)) {
      naoInfluenciaram.push({ subcriterionCode: code, motivo: "FORA_DO_MOTOR_POR_METODO" });
      continue;
    }
    if (declaracao.degree === "SEM_PREFERENCIA") {
      naoInfluenciaram.push({ subcriterionCode: code, motivo: "GRAU_SEM_PREFERENCIA" });
      continue;
    }

    influenciaram.push({ subcriterionCode: code, resultado: row.result });

    const natureza = classificarLacuna(row.status, pendenciaPorCodigo.get(code));
    if (natureza) {
      lacunas.push({ subcriterionCode: code, natureza });
    } else if (row.status) {
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

  if (bloqueios.length > 0) {
    return {
      renderizavel: false,
      professionalProfileId: entrada.professionalProfileId,
      bloqueios,
    };
  }

  return {
    renderizavel: true,
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
      proveniencia,
    },
  };
}

/**
 * AC-EXPLICA para um conjunto. A superfície precisa de DUAS listas: o que pode
 * renderizar e o que existe mas não é exibível. Devolver só a primeira seria o
 * silêncio que o critério proíbe.
 */
export type LeituraExplicada = {
  readonly fichas: readonly FichaDeExplicacao[];
  readonly naoExibiveis: readonly {
    readonly professionalProfileId: string;
    readonly bloqueios: readonly Bloqueio[];
  }[];
};

export function explicarLeitura(entradas: readonly EntradaDaFicha[]): LeituraExplicada {
  const fichas: FichaDeExplicacao[] = [];
  const naoExibiveis: LeituraExplicada["naoExibiveis"][number][] = [];

  for (const entrada of entradas) {
    const resultado = construirFicha(entrada);
    if (resultado.renderizavel) fichas.push(resultado.ficha);
    else {
      naoExibiveis.push({
        professionalProfileId: resultado.professionalProfileId,
        bloqueios: resultado.bloqueios,
      });
    }
  }

  return { fichas, naoExibiveis };
}
