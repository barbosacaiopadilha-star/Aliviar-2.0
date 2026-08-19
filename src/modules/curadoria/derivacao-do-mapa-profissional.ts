/**
 * DERIVAÇÃO DO MAPA DO PROFISSIONAL — Item 1.A, a metade pura da antiga 1.2.
 *
 * @metodo CONTRATO_1_A (APROVADO — PA-13, 2026-08-08) — §3 a §10
 * @metodo P-04 / I-8 — lacuna nunca vira estado; do vazio, nada se afirma
 * @metodo ADR-067 — juízo humano nunca entra em derivação automática
 *
 * A função responde UMA pergunta: dado o Catálogo e as evidências que o
 * chamador entregou, o que a mecânica de derivação teria a dizer sobre cada
 * conceito? Na v1 a resposta é deliberadamente vazia de conteúdo material:
 * NENHUMA regra de correspondência evidência→estado foi aprovada (a decisão
 * da v1 é a Opção B do contrato §2), então nenhum estado é proposto — para
 * conceito nenhum. A mecânica nasce completa; o conteúdo entra depois, como
 * dado versionado lavrado pela Autoridade de Método (§10), nunca por edição
 * desta função.
 *
 * O que este módulo NÃO faz, por contrato (§1 e G-1..G-5): não persiste, não
 * lê banco, não busca evidência nem regra (completar a entrada é do chamador
 * futuro — o 2.C; registro vinculante do §8), não conhece "vigência" de regra
 * (regra chega resolvida por argumento — registro vinculante do §10), não
 * apresenta nada a humano e não contém correspondência opção→estado.
 *
 * Os três registros vinculantes do PA-13, executáveis aqui:
 *   1. ausência de evidência produz LACUNA, jamais NAO_INFORMADO — a linha da
 *      Arquitetura §10.4 que dizia o contrário está SUPERADA (§5);
 *   2. regra futura entra por argumento já resolvido, com versão explícita —
 *      esta função nunca resolve "vigente" (§10);
 *   3. completar o conjunto de evidências é do chamador; a função só
 *      seleciona a corrente DENTRO do que recebeu (§8).
 *
 * Relação com `motor-relacional.ts` (§11): aquele deriva a LEITURA relativa ao
 * par pessoa×profissional (ADR-065, satisfied_by); este deriva — quando houver
 * regra lavrada — o estado ABSOLUTO do Mapa. São objetos diferentes e não se
 * fundem por semelhança de pureza.
 *
 * Puro e determinístico: sem React, sem banco, sem relógio, sem ambiente.
 * Os dois imports são de tipo — apagados em runtime; nenhuma dependência viva.
 */

import type { CatalogoConceito } from "./catalogo-gerado";
import type { SubcriterionStatus } from "./mapa-profissional";

// ---------------------------------------------------------------------------
// Entrada — valores de domínio, imutáveis e serializáveis (§3.1)
// ---------------------------------------------------------------------------

/**
 * Uma linha de evidência do profissional, como VALOR. O chamador a extrai de
 * onde quiser (o 2.C, de `practice_evidence`); aqui ela é só dado. `version`
 * espelha o versionamento append-only da base ("a leitura corrente é
 * max(version)" — migration 20260731220000); `status` é o estado de
 * verificação, preservado para a regra futura que quiser exigi-lo.
 */
export type EvidenciaDeDerivacao = {
  id: string;
  subcriterionCode: string;
  version: number;
  options: readonly string[];
  status: string;
};

/**
 * A identidade de uma regra de correspondência JÁ RESOLVIDA pelo chamador
 * (registro vinculante do §10: a função nunca busca regra nem decide
 * vigência). A FORMA MATERIAL da regra — a correspondência evidência→estado —
 * não está lavrada (§10.2): este tipo carrega apenas a identidade versionada
 * que a saída declararia. Na v1 não existe intérprete: receber uma regra não
 * ativa braço nenhum.
 */
export type RegraResolvida = {
  subcriterionCode: string;
  ruleId: string;
  ruleVersion: number;
  /**
   * A FORMA MATERIAL, lavrada pela emenda do §10: qual estado a regra propõe
   * quando existe evidência corrente para o conceito.
   *
   * Vem NO ARGUMENTO, nunca do código: é isso que mantém a semântica material
   * fora deste módulo (G-4) e permite versionar, auditar e reverter uma regra
   * sem deploy. A função não sabe o que cada estado significa — só repassa o
   * que a regra resolvida declarou, com a proveniência junto.
   *
   * Ausência de evidência continua sendo LACUNA em qualquer regra: nenhuma
   * regra pode afirmar a partir do vazio (P-04 / I-8, registro do §5).
   */
  estadoQuandoCorrente: SubcriterionStatus;
};

/** Todo contexto entra por argumento. Nada mais existe (§3.1). */
export type EntradaDaDerivacao = {
  /** Conceitos do Catálogo GERADO (fonte executável vigente), como valores. */
  conceitos: readonly CatalogoConceito[];
  /** As evidências que o chamador reuniu. O que não veio aqui não existe. */
  evidencias: readonly EvidenciaDeDerivacao[];
  /** Regras já resolvidas, com versão explícita. Na v1: nenhuma é aplicável. */
  regras?: readonly RegraResolvida[];
};

// ---------------------------------------------------------------------------
// Saída — quatro braços, lista fechada (§3.2)
// ---------------------------------------------------------------------------

export type MotivoForaDaDerivacao =
  | "CRUZAMENTO_HUMANO"
  | "CRUZAMENTO_MISTO"
  | "CONCEITO_INATIVO";

/** A taxonomia exata do §6 — lacuna é fato do mundo, com nome. */
export type MotivoDeLacuna =
  | "SEM_EVIDENCIA"
  | "EVIDENCIA_INSUFICIENTE"
  | "EVIDENCIA_CONFLITANTE";

/**
 * A proveniência que o braço derivador carregará (§3.3): regra nomeada e
 * versionada + a evidência EXATA por ponteiro (id + version) — nunca
 * snapshot, nunca busca (C-01c vale aqui).
 */
export type ProvenienciaDaProposta = {
  ruleId: string;
  ruleVersion: number;
  evidenciaId: string;
  evidenciaVersion: number;
};

/**
 * Exatamente um braço por conceito avaliado. LACUNA e PROPOSTO são declarados
 * desde a v1 — são o contrato que o 2.C consumirá — e INALCANÇÁVEIS até a
 * primeira regra de correspondência ser lavrada (§3.2): nenhum caminho de
 * código os produz, e as guardas do item provam isso nos dois sentidos.
 */
export type DerivacaoDeConceito =
  | { braco: "FORA_DA_DERIVACAO"; code: string; motivo: MotivoForaDaDerivacao }
  | { braco: "NAO_SUPORTADO"; code: string; motivo: "SEM_REGRA_APROVADA" }
  | { braco: "LACUNA"; code: string; motivo: MotivoDeLacuna }
  | { braco: "PROPOSTO"; code: string; estado: SubcriterionStatus; proveniencia: ProvenienciaDaProposta };

/** A saída inteira: pequena, sem efeito, sem metadado operacional (§3.2). */
export type DerivacaoDoMapa = {
  /** Um resultado por conceito recebido, em ordem lexicográfica de `code`. */
  resultados: readonly DerivacaoDeConceito[];
};

// ---------------------------------------------------------------------------
// Erro técnico — defeito do chamador, nunca fato do mundo (§6)
// ---------------------------------------------------------------------------

/**
 * Entrada inválida é EXCEÇÃO, jamais lacuna, jamais braço (§6: "erro técnico
 * e lacuna de domínio não se misturam"). Lista fechada de motivos.
 */
export type MotivoTecnico =
  | "ENTRADA_MALFORMADA"
  | "CONCEITO_MALFORMADO"
  | "CONCEITO_DUPLICADO"
  | "CONCEITO_SEM_CLASSIFICACAO"
  | "EVIDENCIA_MALFORMADA"
  | "EVIDENCIA_DUPLICADA"
  | "EVIDENCIA_DE_OUTRO_CONCEITO"
  | "REGRA_MALFORMADA"
  | "REGRA_DUPLICADA"
  | "REGRA_DE_OUTRO_CONCEITO"
  | "SELECAO_COM_CONCEITOS_MISTURADOS";

export class EntradaInvalidaDaDerivacao extends Error {
  readonly motivo: MotivoTecnico;

  constructor(motivo: MotivoTecnico, detalhe: string) {
    super(`Entrada inválida da derivação (${motivo}): ${detalhe}`);
    this.name = "EntradaInvalidaDaDerivacao";
    this.motivo = motivo;
  }
}

// ---------------------------------------------------------------------------
// Validação — a porta técnica
// ---------------------------------------------------------------------------

function stringPreenchida(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim().length > 0;
}

function validarEvidencia(evidencia: EvidenciaDeDerivacao): void {
  if (typeof evidencia !== "object" || evidencia === null) {
    throw new EntradaInvalidaDaDerivacao("EVIDENCIA_MALFORMADA", "evidência não é objeto.");
  }
  if (!stringPreenchida(evidencia.id)) {
    throw new EntradaInvalidaDaDerivacao("EVIDENCIA_MALFORMADA", "evidência sem `id`.");
  }
  if (!stringPreenchida(evidencia.subcriterionCode)) {
    throw new EntradaInvalidaDaDerivacao(
      "EVIDENCIA_MALFORMADA",
      `evidência ${evidencia.id} sem \`subcriterionCode\`.`,
    );
  }
  if (!Number.isInteger(evidencia.version) || evidencia.version <= 0) {
    // Espelha o CHECK do banco (`version > 0`): versão fora do regime
    // append-only é defeito do chamador, não fato a interpretar.
    throw new EntradaInvalidaDaDerivacao(
      "EVIDENCIA_MALFORMADA",
      `evidência ${evidencia.id} com \`version\` fora do regime append-only: ${String(evidencia.version)}.`,
    );
  }
  if (
    !Array.isArray(evidencia.options) ||
    evidencia.options.some((opcao) => typeof opcao !== "string")
  ) {
    throw new EntradaInvalidaDaDerivacao(
      "EVIDENCIA_MALFORMADA",
      `evidência ${evidencia.id} com \`options\` que não é lista de códigos.`,
    );
  }
  if (!stringPreenchida(evidencia.status)) {
    throw new EntradaInvalidaDaDerivacao(
      "EVIDENCIA_MALFORMADA",
      `evidência ${evidencia.id} sem \`status\` de verificação.`,
    );
  }
}

const CRUZAMENTOS_CONHECIDOS = ["automatico", "humano", "misto"] as const;

function validarEntrada(entrada: EntradaDaDerivacao): {
  conceitos: readonly CatalogoConceito[];
  evidencias: readonly EvidenciaDeDerivacao[];
  regras: readonly RegraResolvida[];
} {
  if (typeof entrada !== "object" || entrada === null) {
    throw new EntradaInvalidaDaDerivacao("ENTRADA_MALFORMADA", "a entrada não é um objeto.");
  }
  const { conceitos, evidencias } = entrada;
  const regras = entrada.regras ?? [];
  if (!Array.isArray(conceitos)) {
    throw new EntradaInvalidaDaDerivacao("ENTRADA_MALFORMADA", "`conceitos` não é lista.");
  }
  if (!Array.isArray(evidencias)) {
    throw new EntradaInvalidaDaDerivacao("ENTRADA_MALFORMADA", "`evidencias` não é lista.");
  }
  if (!Array.isArray(regras)) {
    throw new EntradaInvalidaDaDerivacao("ENTRADA_MALFORMADA", "`regras` não é lista.");
  }

  const codigos = new Set<string>();
  for (const conceito of conceitos) {
    if (typeof conceito !== "object" || conceito === null || !stringPreenchida(conceito.code)) {
      throw new EntradaInvalidaDaDerivacao("CONCEITO_MALFORMADO", "conceito sem `code`.");
    }
    if (typeof conceito.active !== "boolean") {
      throw new EntradaInvalidaDaDerivacao(
        "CONCEITO_MALFORMADO",
        `${conceito.code} sem \`active\` booleano.`,
      );
    }
    if (codigos.has(conceito.code)) {
      throw new EntradaInvalidaDaDerivacao(
        "CONCEITO_DUPLICADO",
        `${conceito.code} aparece mais de uma vez na entrada.`,
      );
    }
    codigos.add(conceito.code);
    if (
      conceito.active &&
      !(CRUZAMENTOS_CONHECIDOS as readonly (string | null)[]).includes(conceito.cruzamento)
    ) {
      // Conceito ATIVO sem classe de cruzamento é o Catálogo e este contrato
      // divergindo — defeito estrutural, nunca material a interpretar.
      throw new EntradaInvalidaDaDerivacao(
        "CONCEITO_SEM_CLASSIFICACAO",
        `${conceito.code} está ativo com cruzamento desconhecido: ${String(conceito.cruzamento)}.`,
      );
    }
  }

  const idsDeEvidencia = new Set<string>();
  for (const evidencia of evidencias) {
    validarEvidencia(evidencia);
    if (idsDeEvidencia.has(evidencia.id)) {
      throw new EntradaInvalidaDaDerivacao(
        "EVIDENCIA_DUPLICADA",
        `a evidência ${evidencia.id} aparece mais de uma vez.`,
      );
    }
    idsDeEvidencia.add(evidencia.id);
    if (!codigos.has(evidencia.subcriterionCode)) {
      // §6, nominal: "evidência de outro conceito" é entrada inválida.
      throw new EntradaInvalidaDaDerivacao(
        "EVIDENCIA_DE_OUTRO_CONCEITO",
        `a evidência ${evidencia.id} aponta ${evidencia.subcriterionCode}, que não está entre os conceitos da entrada.`,
      );
    }
  }

  const conceitosComRegra = new Set<string>();
  for (const regra of regras) {
    if (
      typeof regra !== "object" ||
      regra === null ||
      !stringPreenchida(regra.ruleId) ||
      !Number.isInteger(regra.ruleVersion) ||
      regra.ruleVersion <= 0 ||
      !stringPreenchida(regra.subcriterionCode)
    ) {
      throw new EntradaInvalidaDaDerivacao(
        "REGRA_MALFORMADA",
        "regra sem identidade completa (`ruleId` + `ruleVersion` inteira positiva + `subcriterionCode`).",
      );
    }
    if (conceitosComRegra.has(regra.subcriterionCode)) {
      throw new EntradaInvalidaDaDerivacao(
        "REGRA_DUPLICADA",
        `mais de uma regra resolvida para ${regra.subcriterionCode} — resolver a corrente é do chamador.`,
      );
    }
    conceitosComRegra.add(regra.subcriterionCode);
    if (!codigos.has(regra.subcriterionCode)) {
      throw new EntradaInvalidaDaDerivacao(
        "REGRA_DE_OUTRO_CONCEITO",
        `a regra ${regra.ruleId} aponta ${regra.subcriterionCode}, que não está entre os conceitos da entrada.`,
      );
    }
  }

  return { conceitos, evidencias, regras };
}

// ---------------------------------------------------------------------------
// Seleção DENTRO da entrada — a única regra de composição já lavrada (§8)
// ---------------------------------------------------------------------------

/**
 * O resultado da seleção da corrente. `CONFLITO_DE_VERSAO` existe porque a
 * função NÃO ARBITRA (§6): duas linhas na mesma versão máxima são um empate
 * que nenhuma regra lavrada resolve — devolvê-lo nomeado é a resposta
 * honesta; escolher uma seria heurística.
 */
export type SelecaoDeCorrente =
  | { situacao: "AUSENTE" }
  | { situacao: "CORRENTE"; evidencia: EvidenciaDeDerivacao }
  | { situacao: "CONFLITO_DE_VERSAO"; versao: number; ids: readonly string[] };

/**
 * Seleciona a evidência corrente de UM conceito, dentro do que foi recebido:
 * "leitura corrente = max(version)" — a regra já lavrada no contrato canônico
 * de `practice_evidence`, e a ÚNICA que esta função aplica (§8). Não busca
 * nada: registro vinculante do PA-13 — completar o conjunto é do chamador.
 */
export function selecionarEvidenciaCorrente(
  evidencias: readonly EvidenciaDeDerivacao[],
): SelecaoDeCorrente {
  for (const evidencia of evidencias) validarEvidencia(evidencia);
  const codigos = new Set(evidencias.map((evidencia) => evidencia.subcriterionCode));
  if (codigos.size > 1) {
    throw new EntradaInvalidaDaDerivacao(
      "SELECAO_COM_CONCEITOS_MISTURADOS",
      `a seleção da corrente é por conceito — recebeu ${[...codigos].sort().join(", ")}.`,
    );
  }
  if (evidencias.length === 0) return { situacao: "AUSENTE" };

  const maiorVersao = Math.max(...evidencias.map((evidencia) => evidencia.version));
  const naVersaoMaxima = evidencias.filter((evidencia) => evidencia.version === maiorVersao);
  if (naVersaoMaxima.length > 1) {
    return {
      situacao: "CONFLITO_DE_VERSAO",
      versao: maiorVersao,
      ids: naVersaoMaxima.map((evidencia) => evidencia.id).sort(),
    };
  }
  return { situacao: "CORRENTE", evidencia: naVersaoMaxima[0] };
}

// ---------------------------------------------------------------------------
// A derivação — total sobre domínio fechado, discriminada por conceito (§9)
// ---------------------------------------------------------------------------

/**
 * Classifica UM conceito. A classe vem do atributo `cruzamento` do próprio
 * conceito recebido — dado do Catálogo, nunca lista paralela deste módulo
 * (o precedente do repositório: universo derivado do dado, não de cópia).
 */
function classificarConceito(
  conceito: CatalogoConceito,
  evidencias: readonly EvidenciaDeDerivacao[],
  regras: readonly RegraResolvida[],
): DerivacaoDeConceito {
  if (!conceito.active) {
    return { braco: "FORA_DA_DERIVACAO", code: conceito.code, motivo: "CONCEITO_INATIVO" };
  }
  if (conceito.cruzamento === "humano") {
    return { braco: "FORA_DA_DERIVACAO", code: conceito.code, motivo: "CRUZAMENTO_HUMANO" };
  }
  if (conceito.cruzamento === "misto") {
    // A parte humana do misto não se separa sem decisão (§7) — o conceito
    // inteiro fica fora até que uma partição seja lavrada.
    return { braco: "FORA_DA_DERIVACAO", code: conceito.code, motivo: "CRUZAMENTO_MISTO" };
  }

  // Conceito automático. Sem regra resolvida PARA ESTE conceito, nada muda:
  // o braço segue NAO_SUPORTADO, exatamente como na v1. Quem não passa regra
  // recebe o mesmo resultado de antes — a ativação é opt-in, por conceito.
  const regra = regras.find((r) => r.subcriterionCode === conceito.code);
  if (!regra) {
    return { braco: "NAO_SUPORTADO", code: conceito.code, motivo: "SEM_REGRA_APROVADA" };
  }

  // Coberto por regra: a evidência corrente decide. P-04 / I-8 continua de pé
  // e é o ponto inteiro deste bloco — do vazio nada se afirma. Ausência,
  // insuficiência e conflito viram LACUNA COM NOME, nunca estado positivo,
  // nunca NAO_INFORMADO (registro vinculante do §5).
  const doConceito = evidencias.filter((e) => e.subcriterionCode === conceito.code);
  const selecao = selecionarEvidenciaCorrente(doConceito);

  if (selecao.situacao === "AUSENTE") {
    return { braco: "LACUNA", code: conceito.code, motivo: "SEM_EVIDENCIA" };
  }
  if (selecao.situacao === "CONFLITO_DE_VERSAO") {
    return { braco: "LACUNA", code: conceito.code, motivo: "EVIDENCIA_CONFLITANTE" };
  }

  // O estado vem DA REGRA, não daqui: este módulo não sabe o que cada estado
  // significa e não escolhe nenhum. É o que mantém a semântica material fora
  // do código (G-4) — trocar a regra troca o resultado, sem tocar nesta linha.
  //
  // PROPOSTO é proposta: o 2.C decide se persiste, e a proveniência viaja
  // junto por ponteiro exato (regra + evidência, ambas versionadas), para que
  // a Ficha de Explicação feche o ramo até a linha que sustentou o estado.
  return {
    braco: "PROPOSTO",
    code: conceito.code,
    estado: regra.estadoQuandoCorrente,
    proveniencia: {
      ruleId: regra.ruleId,
      ruleVersion: regra.ruleVersion,
      evidenciaId: selecao.evidencia.id,
      evidenciaVersion: selecao.evidencia.version,
    },
  };
}

/**
 * A função do Item 1.A (§3): um resultado por conceito recebido, exatamente
 * um braço cada, em ordem lexicográfica de `code` — a ordem de chegada não
 * tem semântica e não sobrevive (§9, invariância de ordenação).
 */
export function derivarMapaDoProfissional(entrada: EntradaDaDerivacao): DerivacaoDoMapa {
  const { conceitos, evidencias, regras } = validarEntrada(entrada);

  const resultados = conceitos
    .map((conceito) => classificarConceito(conceito, evidencias, regras))
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));

  return { resultados };
}
