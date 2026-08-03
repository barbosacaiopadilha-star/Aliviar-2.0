/**
 * BASE DE EVIDÊNCIAS DE PRÁTICA — o domínio puro.
 *
 * @metodo Catálogo Canônico 1.0.0 (ADR-046 aprova; ADR-047 torna o banco
 *         autoritativo) — 28 conceitos, 5 eixos, 166 opções
 * @metodo Protocolo da Prática Profissional — Q1..Q28
 * @metodo Gramática das Perguntas — P18 (mais opções ≠ melhor), P20 (resposta
 *         não é evidência verificada), texto livre nunca é conceito
 *
 * FONTE ÚNICA (BLOCO E / FRENTE 1): este módulo NÃO mantém lista própria.
 * Tudo — códigos, eixos, ordem, opções, condicionais, versão — deriva de
 * `catalogo-gerado.ts`, que é emitido do banco local por
 * `scripts/gerar-catalogo-ts.mjs` e travado por hash no gate de paridade
 * (`tests/remediacao/paridade-catalogo.integration.test.ts`). O array manual
 * que vivia aqui divergiu do banco em 16 pontos (AUDITORIA_01 §3.1 D1–D16) e
 * morreu por isso.
 *
 * O que permanece DESTE lado (decisões de Método que o banco não carrega):
 *   - a participação de cada conceito perante o Motor (Matriz de Cobertura);
 *   - o mapeamento evidence_source → fonte mínima da Política de Fontes
 *     ("entrevista" é fonte institucional — SOURCE_TIER_EXAMPLES já a lista);
 *   - as regras de validação executáveis (inclusive a regra da resposta-mãe
 *     sobre as conditional_rules do banco).
 *
 * O que ele NUNCA faz: pontuar, ordenar, comparar profissionais, interpretar
 * texto livre, ou concluir compatibilidade.
 *
 * Puro e determinístico: sem React, sem banco (o banco chega via gerado).
 */

import {
  CATALOGO_EIXOS,
  CATALOGO_GERADO,
  CATALOGO_VERSAO,
  type CatalogoCampo,
  type CatalogoConceito,
  type CatalogoConditionalRule,
} from "./catalogo-gerado";
import { SOURCE_TIERS, type SourceTier } from "./fontes";

export const PRACTICE_CATALOG_VERSION = CATALOGO_VERSAO;

// ---------------------------------------------------------------------------
// A forma de um conceito
// ---------------------------------------------------------------------------

/** Os 5 eixos vigentes — exatamente os do banco (D1 morreu: é ACESSO_AO_CUIDADO). */
export const EVIDENCE_AXES = CATALOGO_EIXOS;
export type EvidenceAxis = (typeof EVIDENCE_AXES)[number];

/**
 * CONDUTA: resposta por opções canônicas do campo `principal`.
 * FATO_ESTRUTURADO: `response_type = estruturado` no banco — a resposta vive
 * em `details` (campos datados, listas, e os campos fechados complementares).
 */
export type ConceptKind = "CONDUTA" | "FATO_ESTRUTURADO";

/** O papel do conceito perante o Motor — contrato da Matriz de Cobertura. */
export type MotorParticipation = "DIRETO" | "INDIRETO" | "NUNCA";

/** Um campo complementar fechado (ex.: frequencia_habitual, faixa, formas). */
export type ConceptField = {
  field: string;
  /** Opções canônicas do campo (código → rótulo vigente do banco). */
  options: Readonly<Record<string, string>>;
};

export type ConceptConditionalRule = CatalogoConditionalRule;

export type PracticeConcept = {
  code: string;
  name: string;
  axis: EvidenceAxis;
  /** Subgrupo histórico do banco (FORMACAO/EXPERIENCIA/… dentro do eixo). */
  group: string;
  kind: ConceptKind;
  motor: MotorParticipation;
  /** Múltipla seleção no campo principal? Marcar mais NUNCA é melhor (P18). */
  multi: boolean;
  /** Opções canônicas do campo `principal` (código → rótulo). Vazio p/ FATO. */
  options: Readonly<Record<string, string>>;
  /** Campos complementares fechados, na ordem do banco. */
  fields: readonly ConceptField[];
  /** As regras condicionais DO BANCO — a única representação (Etapa 6). */
  conditionalRules: readonly ConceptConditionalRule[];
  /** Valores do principal que só valem acompanhados de condição estruturada. */
  requireCondition: readonly string[];
  /** Conceitos cuja resposta exige `details` (fatos estruturados). */
  requireDetails: boolean;
  /** Fonte mínima que sustenta a informação (derivada de evidence_source). */
  minimumTier: SourceTier;
  /** O evidence_source do banco, preservado (institucional/entrevista/…). */
  evidenceSource: string;
  /** Meses até a verificação vencer (review_months do banco). */
  reviewAfterMonths: number;
  /** response_type do banco, preservado para superfícies que o exibem. */
  responseType: string;
  displayOrder: number;
  catalogVersion: string;
};

/**
 * Participação no Motor — decisão de Método da Matriz de Cobertura; o banco
 * não a carrega. Todo conceito ativo PRECISA constar aqui: a guarda de
 * construção abaixo transforma ausência em erro de código, nunca de dado.
 */
const MOTOR_PARTICIPATION: Record<string, MotorParticipation> = {
  ACESSO_MODALIDADE: "DIRETO",
  ACESSO_DISPONIBILIDADE: "DIRETO",
  ACESSO_PRAZO_PARA_CONSULTA: "DIRETO",
  ACESSO_LOCAL_DE_ATENDIMENTO: "DIRETO",
  CONTINUIDADE_RETORNOS: "DIRETO",
  CONTINUIDADE_POS_PROCEDIMENTO: "INDIRETO",
  CONTINUIDADE_EQUIPE_DE_APOIO: "DIRETO",
  CONTINUIDADE_COORDENACAO: "DIRETO",
  CONTINUIDADE_CANAIS: "DIRETO",
  MODELO_COMUNICACAO: "DIRETO",
  MODELO_DECISAO_COMPARTILHADA: "INDIRETO",
  MODELO_ALTERNATIVAS: "DIRETO",
  MODELO_PARTICIPACAO_FAMILIAR: "DIRETO",
  MODELO_PREFERENCIAS_E_RESTRICOES: "NUNCA",
  FORMACAO_GRADUACAO: "INDIRETO",
  FORMACAO_RESIDENCIA: "INDIRETO",
  FORMACAO_ESPECIALIZACAO: "INDIRETO",
  FORMACAO_FELLOWSHIP: "INDIRETO",
  FORMACAO_COMPLEMENTAR: "INDIRETO",
  EXPERIENCIA_TEMPO_DE_PRATICA: "INDIRETO",
  EXPERIENCIA_NO_TIPO_DE_CASO: "INDIRETO",
  EXPERIENCIA_VOLUME_DE_ATUACAO: "INDIRETO",
  PRATICA_LIMITES_DE_ATUACAO: "INDIRETO",
  HISTORICO_TRAJETORIA_INSTITUCIONAL: "INDIRETO",
  HISTORICO_ATIVIDADE_ACADEMICA: "INDIRETO",
  HISTORICO_AREAS_DE_ATUACAO: "INDIRETO",
  VIABILIDADE_COBERTURA_E_CONVENIO: "NUNCA",
  VIABILIDADE_CUSTO_E_PAGAMENTO: "NUNCA",
};

/**
 * evidence_source do banco → fonte mínima da Política de Fontes.
 * "entrevista" É fonte institucional: SOURCE_TIER_EXAMPLES lista a
 * entrevista estruturada entre as fontes institucionais do profissional.
 */
const EVIDENCE_SOURCE_TIER: Record<string, SourceTier> = {
  oficial_primaria: "OFICIAL_PRIMARIA",
  institucional: "INSTITUCIONAL",
  entrevista: "INSTITUCIONAL",
  publica_secundaria: "PUBLICA_SECUNDARIA",
};

function campoParaRecord(campo: CatalogoCampo | undefined): Record<string, string> {
  const record: Record<string, string> = {};
  for (const opcao of campo?.options ?? []) {
    if (opcao.active) record[opcao.value] = opcao.label;
  }
  return record;
}

function conceptFromCatalogo(entry: CatalogoConceito): PracticeConcept {
  const motor = MOTOR_PARTICIPATION[entry.code];
  if (!motor) {
    // Guarda de construção: conceito ativo sem decisão de Motor é catálogo e
    // Matriz de Cobertura divergindo — erro de código, nunca de dado.
    throw new Error(`Conceito sem participação declarada no Motor: ${entry.code}`);
  }
  const minimumTier = EVIDENCE_SOURCE_TIER[entry.evidenceSource ?? ""];
  if (!minimumTier) {
    throw new Error(
      `Conceito ${entry.code} com evidence_source fora da Política de Fontes: "${entry.evidenceSource}".`,
    );
  }
  if (!entry.axis || !(EVIDENCE_AXES as readonly string[]).includes(entry.axis)) {
    throw new Error(`Conceito ativo sem eixo vigente: ${entry.code} (${entry.axis}).`);
  }

  const principal = entry.profissional.find((campo) => campo.field === "principal");
  const complementares = entry.profissional.filter((campo) => campo.field !== "principal");

  // Condição estruturada obrigatória NO CAMPO PRINCIPAL: as duas declarações
  // do banco convergem aqui — requires_detail da opção (com detail_kind
  // condicao_estruturada) e require_detail das conditional_rules. Um
  // require_detail cujo detail_kind é OUTRO (lista_operadoras,
  // numero_parcelas) é satisfeito pelo detalhe próprio, não por conditionNote.
  const requireCondition = new Set<string>();
  for (const opcao of principal?.options ?? []) {
    if (opcao.active && opcao.requiresDetail && opcao.detailKind === "condicao_estruturada") {
      requireCondition.add(opcao.value);
    }
  }

  const kind: ConceptKind = entry.responseType === "estruturado" ? "FATO_ESTRUTURADO" : "CONDUTA";

  return {
    code: entry.code,
    name: entry.name,
    axis: entry.axis as EvidenceAxis,
    group: entry.group,
    kind,
    motor,
    multi: entry.responseType === "multipla_escolha",
    options: campoParaRecord(principal),
    fields: complementares.map((campo) => ({ field: campo.field, options: campoParaRecord(campo) })),
    conditionalRules: entry.conditionalRules,
    requireCondition: [...requireCondition],
    requireDetails: kind === "FATO_ESTRUTURADO",
    minimumTier,
    evidenceSource: entry.evidenceSource!,
    reviewAfterMonths: entry.reviewMonths ?? 12,
    responseType: entry.responseType!,
    displayOrder: entry.displayOrder,
    catalogVersion: entry.catalogVersion,
  };
}

// ---------------------------------------------------------------------------
// O Catálogo 1.0.0 executável — os 28 ativos, na ordem canônica do gerado
// ---------------------------------------------------------------------------

export const PRACTICE_CATALOG: readonly PracticeConcept[] = CATALOGO_GERADO.filter(
  (entry) => entry.active,
).map(conceptFromCatalogo);

export const PRACTICE_CONCEPTS_BY_CODE: ReadonlyMap<string, PracticeConcept> = new Map(
  PRACTICE_CATALOG.map((entry) => [entry.code, entry]),
);

/** Códigos do legado 0.9.0 (inativos): legíveis, nunca graváveis de novo. */
export const LEGACY_CONCEPT_CODES: ReadonlySet<string> = new Set(
  CATALOGO_GERADO.filter((entry) => !entry.active).map((entry) => entry.code),
);

export function isPracticeConceptCode(code: string): boolean {
  return PRACTICE_CONCEPTS_BY_CODE.has(code);
}

/**
 * Opções (lado do profissional) cujo requires_detail do banco exige um dado
 * PRÓPRIO além da condição estruturada — operadoras, número de parcelas.
 * Derivado do gerado; consumido pela validação e pelo formulário.
 */
export const DETAIL_REQUIREMENTS: ReadonlyMap<
  string,
  readonly { value: string; detailKind: string }[]
> = new Map(
  CATALOGO_GERADO.filter((entry) => entry.active).map((entry) => [
    entry.code,
    entry.profissional
      .flatMap((campo) => campo.options)
      .filter(
        (opcao) =>
          opcao.active &&
          opcao.requiresDetail &&
          opcao.detailKind !== null &&
          opcao.detailKind !== "condicao_estruturada",
      )
      .map((opcao) => ({ value: opcao.value, detailKind: opcao.detailKind! })),
  ]),
);

/**
 * Valores (em QUALQUER campo do lado profissional) que só valem acompanhados
 * de condição estruturada (detail_kind condicao_estruturada do banco) — ex.:
 * DEPENDE_DA_EVOLUCAO em frequencia_habitual, SUJEITO_A_CONFIRMACAO em faixa.
 */
export const CONDITION_REQUIREMENTS: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  CATALOGO_GERADO.filter((entry) => entry.active).map((entry) => [
    entry.code,
    new Set(
      entry.profissional
        .flatMap((campo) => campo.options)
        .filter(
          (opcao) => opcao.active && opcao.requiresDetail && opcao.detailKind === "condicao_estruturada",
        )
        .map((opcao) => opcao.value),
    ),
  ]),
);

// ---------------------------------------------------------------------------
// Validação de uma resposta — a porta única do domínio
// ---------------------------------------------------------------------------

const TIER_RANK: Record<SourceTier, number> = {
  INADEQUADA: 0,
  PUBLICA_SECUNDARIA: 1,
  INSTITUCIONAL: 2,
  OFICIAL_PRIMARIA: 3,
};

/**
 * Campos que aceitam UM valor só, por decisão do catálogo aprovado: o custo
 * da primeira consulta tem UMA faixa — duas faixas simultâneas eram o estado
 * impossível que o achatamento antigo gravava (AUDITORIA_01 D6).
 */
const SINGLE_VALUE_FIELDS: Record<string, readonly string[]> = {
  VIABILIDADE_CUSTO_E_PAGAMENTO: ["faixa"],
};

export type PracticeEvidenceInput = {
  subcriterionCode: string;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  observation: string | null;
  sourceTier: SourceTier;
  source: string;
};

/** Seleções de um campo: `principal` vem de options[], os demais de details. */
function selectedValues(input: PracticeEvidenceInput, field: string): string[] {
  if (field === "principal") return input.options;
  const bruto = input.details[field];
  if (typeof bruto === "string") return [bruto];
  if (Array.isArray(bruto)) return bruto.filter((valor): valor is string => typeof valor === "string");
  return [];
}

/** A condição de uma regra do banco vale para esta resposta? */
function conditionHolds(input: PracticeEvidenceInput, rule: ConceptConditionalRule): boolean {
  const selecionados = selectedValues(input, rule.when.field);
  if (rule.when.value !== undefined) return selecionados.includes(rule.when.value);
  if (rule.when.value_not !== undefined) {
    return selecionados.some((valor) => valor !== rule.when.value_not);
  }
  return false;
}

/** Devolve a lista de recusas — vazia significa aceita. */
export function validatePracticeEvidence(input: PracticeEvidenceInput): string[] {
  const erros: string[] = [];
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(input.subcriterionCode);

  if (!conceito) {
    if (LEGACY_CONCEPT_CODES.has(input.subcriterionCode)) {
      return [
        `"${input.subcriterionCode}" saiu de circulação no Catálogo ${PRACTICE_CATALOG_VERSION} — o histórico permanece legível, mas gravação nova é só de conceito vigente.`,
      ];
    }
    return [`"${input.subcriterionCode}" não é um conceito do Catálogo Canônico ${PRACTICE_CATALOG_VERSION}.`];
  }

  if (conceito.kind === "CONDUTA") {
    if (input.options.length === 0) {
      erros.push(`${conceito.code}: nenhuma opção selecionada — ausência de resposta não é resposta.`);
    }
    for (const opcao of input.options) {
      if (!(opcao in conceito.options)) {
        erros.push(`${conceito.code}: "${opcao}" não é opção canônica deste conceito.`);
      }
    }
    if (!conceito.multi && input.options.length > 1) {
      erros.push(`${conceito.code}: escolha única — ${input.options.length} opções recebidas.`);
    }
  } else {
    if (input.options.length > 0) {
      erros.push(`${conceito.code}: fato estruturado não usa opções — a resposta vive nos campos estruturados.`);
    }
  }

  if (conceito.requireDetails && Object.keys(input.details).length === 0) {
    erros.push(`${conceito.code}: exige campos estruturados (details) — resposta vazia não entra.`);
  }

  // Campos complementares fechados: o valor gravado é o código vigente do
  // banco, nunca rótulo, nunca código de cópia antiga.
  for (const campo of conceito.fields) {
    const bruto = input.details[campo.field];
    if (bruto === undefined || bruto === null) continue;
    if (typeof bruto !== "string" && !Array.isArray(bruto)) {
      erros.push(`${conceito.code}: o campo ${campo.field} recebe código canônico (ou lista) — recebeu ${typeof bruto}.`);
      continue;
    }
    const valores = selectedValues(input, campo.field);
    for (const valor of valores) {
      if (!(valor in campo.options)) {
        erros.push(`${conceito.code}: "${valor}" não é opção canônica do campo ${campo.field}.`);
      }
    }
    const unico = SINGLE_VALUE_FIELDS[conceito.code]?.includes(campo.field) ?? false;
    if (unico && valores.length > 1) {
      erros.push(
        `${conceito.code}: o campo ${campo.field} aceita UMA escolha — ${valores.length} recebidas (${valores.join(", ")}). Duas faixas simultâneas são estado impossível do catálogo aprovado.`,
      );
    }
  }

  // Condição estruturada: qualquer valor selecionado (principal ou campo
  // complementar) marcado como condicao_estruturada no banco exige a condição.
  const valoresComCondicao = CONDITION_REQUIREMENTS.get(conceito.code) ?? new Set<string>();
  const exigemCondicao = new Set<string>();
  for (const valor of input.options) {
    if (valoresComCondicao.has(valor)) exigemCondicao.add(valor);
  }
  for (const campo of conceito.fields) {
    for (const valor of selectedValues(input, campo.field)) {
      if (valoresComCondicao.has(valor)) exigemCondicao.add(valor);
    }
  }

  // As conditional_rules DO BANCO — a única representação executável.
  for (const regra of conceito.conditionalRules) {
    const vale = conditionHolds(input, regra);
    // require_detail: quando o detalhe exigido é a condição estruturada, a
    // exigência entra aqui; quando é detalhe próprio (lista_operadoras,
    // numero_parcelas), o bloco de DETAIL_REQUIREMENTS abaixo a cobra.
    if (regra.require_detail && vale && regra.when.value && valoresComCondicao.has(regra.when.value)) {
      exigemCondicao.add(regra.when.value);
    }
    // Regra da resposta-mãe: um campo mostrado por condição só existe
    // enquanto a condição existir. Se a resposta-mãe mudou e o campo veio
    // junto, a resposta é recusada — nunca aceita com resto órfão.
    if (regra.show && !vale && selectedValues(input, regra.show).length > 0) {
      erros.push(
        `${conceito.code}: o campo ${regra.show} só acompanha ${regra.when.field} = ${regra.when.value ?? `≠ ${regra.when.value_not}`} — a resposta-mãe não o sustenta; redeclare sem o campo.`,
      );
    }
    if (regra.hide && vale && selectedValues(input, regra.hide).length > 0) {
      erros.push(
        `${conceito.code}: com ${regra.when.field} = ${regra.when.value}, o campo ${regra.hide} não se aplica e não pode vir preenchido.`,
      );
    }
  }
  if (exigemCondicao.size > 0 && (!input.conditionNote || input.conditionNote.trim() === "")) {
    erros.push(
      `${conceito.code}: ${[...exigemCondicao].join(", ")} exige condição estruturada — "depende" sem dizer de quê não é informação.`,
    );
  }

  // Detalhes exigidos por opção (requires_detail com detail_kind próprio).
  for (const opcao of DETAIL_REQUIREMENTS.get(conceito.code) ?? []) {
    const selecionada =
      input.options.includes(opcao.value) ||
      conceito.fields.some((campo) => selectedValues(input, campo.field).includes(opcao.value));
    if (!selecionada) continue;
    if (opcao.detailKind === "lista_operadoras") {
      const operadoras = input.details["operadoras"];
      if (!Array.isArray(operadoras) || operadoras.length === 0) {
        erros.push(
          `${conceito.code}: ${opcao.value} exige a lista de operadoras — "aceita convênio" sem dizer qual é a aparência de informação, não informação.`,
        );
      }
    } else if (opcao.detailKind === "numero_parcelas") {
      const parcelas = input.details["numero_parcelas"];
      if (parcelas === undefined || parcelas === null || parcelas === "") {
        erros.push(`${conceito.code}: ${opcao.value} exige o número de parcelas.`);
      }
    }
  }

  // Na COLETA, só a fonte inadequada é recusada: uma autodeclaração entra
  // como declarada, e é exatamente isso que ela é. A fonte mínima do conceito
  // é exigida na VERIFICAÇÃO — "encontrar uma informação não é o mesmo que
  // verificá-la" (Política de Fontes).
  if (!SOURCE_TIERS.includes(input.sourceTier)) {
    erros.push(`Fonte de nível desconhecido: ${input.sourceTier}.`);
  } else if (input.sourceTier === "INADEQUADA") {
    erros.push(`${conceito.code}: fonte inadequada não entra nem como declaração.`);
  }

  if (input.source.trim() === "") erros.push("Fonte da coleta é obrigatória.");
  if (input.observation && input.observation.trim().length > 280) {
    erros.push("Observação passa de 280 caracteres — é apoio à leitura, não laudo.");
  }

  return erros;
}

// ---------------------------------------------------------------------------
// Estado da informação e validade
// ---------------------------------------------------------------------------

/** Os estados persistidos são os do enum vigente da Política de Fontes. */
export const EVIDENCE_STATUS_LABELS: Record<string, string> = {
  nao_verificado: "Declarado, ainda não verificado",
  verificado: "Verificado",
  divergente: "Divergente",
  nao_localizado: "Não localizado",
  desatualizado: "Desatualizado",
};

/**
 * A fonte da VERIFICAÇÃO precisa sustentar o conceito — é aqui que o mínimo
 * da Política de Fontes vale. Devolve a recusa, ou null quando sustenta.
 */
export function verificationTierRejection(
  subcriterionCode: string,
  tier: SourceTier,
): string | null {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito) return `Conceito desconhecido: ${subcriterionCode}.`;
  if (TIER_RANK[tier] < TIER_RANK[conceito.minimumTier]) {
    return `${conceito.code}: fonte ${tier} não sustenta verificação — mínimo ${conceito.minimumTier}.`;
  }
  return null;
}

/**
 * "Revisão pendente" não é estado gravado — é derivação: evidência verificada
 * cuja verificação venceu pela política de volatilidade do conceito.
 */
export function evidenceReviewIsDue(
  subcriterionCode: string,
  referenceIso: string | null,
  nowIso: string,
): boolean {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito || !referenceIso) return false;
  const referencia = new Date(referenceIso);
  const limite = new Date(referencia);
  limite.setMonth(limite.getMonth() + conceito.reviewAfterMonths);
  return new Date(nowIso) >= limite;
}

// ---------------------------------------------------------------------------
// Validade — derivada da política do conceito, nunca gravada como verdade
// ---------------------------------------------------------------------------

export const EVIDENCE_VALIDITIES = [
  "VALIDO",
  "PROXIMO_DO_VENCIMENTO",
  "VENCIDO",
  "SEM_DATA",
] as const;
export type EvidenceValidity = (typeof EVIDENCE_VALIDITIES)[number];

export const EVIDENCE_VALIDITY_LABELS: Record<EvidenceValidity, string> = {
  VALIDO: "Verificação dentro da validade",
  PROXIMO_DO_VENCIMENTO: "Verificação próxima do vencimento",
  VENCIDO: "Verificação vencida",
  SEM_DATA: "Sem data suficiente para avaliar",
};

/**
 * Classifica a validade da VERIFICAÇÃO — não do fato. Evidência não
 * verificada não tem validade a vencer: fica `SEM_DATA`, que é a verdade.
 * "Próximo do vencimento" = últimos 20% da janela do conceito. Tudo derivado;
 * nada disso é gravado (Etapa 8 — vencido calculável não vira coluna).
 */
export function classifyEvidenceValidity(
  subcriterionCode: string,
  status: string,
  verifiedAtIso: string | null,
  nowIso: string,
): EvidenceValidity {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito || status !== "verificado" || !verifiedAtIso) return "SEM_DATA";

  const verificada = new Date(verifiedAtIso).getTime();
  const vencimento = new Date(verifiedAtIso);
  vencimento.setMonth(vencimento.getMonth() + conceito.reviewAfterMonths);

  const agora = new Date(nowIso).getTime();
  if (agora >= vencimento.getTime()) return "VENCIDO";

  const janela = vencimento.getTime() - verificada;
  return agora >= verificada + janela * 0.8 ? "PROXIMO_DO_VENCIMENTO" : "VALIDO";
}

/**
 * A frase OPERACIONAL — descreve o estado da informação, jamais a qualidade
 * do profissional (Etapa 11). Determinística, uma por estado, e a de
 * "vencida" só existe porque a validade derivada o disse.
 */
export function operationalPhrase(evidence: {
  subcriterionCode: string;
  status: string;
  verifiedAt: string | null;
}, nowIso: string): string {
  if (evidence.status === "divergente") {
    return "A informação declarada diverge da fonte consultada. A análise permanece pendente.";
  }
  if (evidence.status === "desatualizado") {
    return "Esta informação foi marcada como desatualizada pela operação e aguarda atualização.";
  }
  if (evidence.status === "nao_localizado") {
    return "A informação não foi localizada na fonte consultada.";
  }
  if (evidence.status === "verificado") {
    const validade = classifyEvidenceValidity(
      evidence.subcriterionCode,
      evidence.status,
      evidence.verifiedAt,
      nowIso,
    );
    if (validade === "VENCIDO") {
      return "A última verificação desta informação está vencida e precisa ser atualizada.";
    }
    return `Informação verificada em ${evidence.verifiedAt!.slice(0, 10)}, com base em fonte registrada pela operação.`;
  }
  return "Informação declarada pelo profissional, ainda não verificada pela operação.";
}

// ---------------------------------------------------------------------------
// Verbalização — repetir o que foi selecionado, nada além
// ---------------------------------------------------------------------------

export type EvidenceProvenanceRef = {
  sourceType: "evidencia_de_pratica";
  subcriterion: string;
  status: string;
  verifiedAt: string | null;
};

export type EvidenceForVerbalization = {
  subcriterionCode: string;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  status: string;
  verifiedAt: string | null;
};

function stateSuffix(evidence: EvidenceForVerbalization): string {
  if (evidence.status === "verificado" && evidence.verifiedAt) {
    return ` (verificado em ${evidence.verifiedAt.slice(0, 10)})`;
  }
  const label = EVIDENCE_STATUS_LABELS[evidence.status];
  return label && evidence.status !== "verificado" ? ` (${label.toLowerCase()})` : "";
}

/**
 * A frase é verbalização fiel: rótulos canônicos unidos por conectores fixos.
 * Nenhum adjetivo, nenhuma contagem, nenhuma comparação, nenhuma inferência.
 * Frase que não consegue rastrear um termo a uma opção não é gerada (null).
 */
export function verbalizePracticeEvidence(
  evidence: EvidenceForVerbalization,
): { text: string; ref: EvidenceProvenanceRef } | null {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(evidence.subcriterionCode);
  if (!conceito) return null;

  // Contrato da Matriz de Cobertura: MODELO_PREFERENCIAS_E_RESTRICOES não tem
  // frase; viabilidade só fala com validação do Curador — aqui, nunca.
  if (conceito.code === "MODELO_PREFERENCIAS_E_RESTRICOES") return null;
  if (conceito.axis === "VIABILIDADE_DE_ACESSO") return null;

  const rotuloDeCampo = new Map(conceito.fields.map((campo) => [campo.field, campo.options]));

  let corpo: string;
  if (conceito.kind === "CONDUTA") {
    const rotulos = evidence.options
      .map((opcao) => conceito.options[opcao])
      .filter((rotulo): rotulo is string => Boolean(rotulo));
    if (rotulos.length === 0 || rotulos.length !== evidence.options.length) return null;
    corpo = rotulos.join(" · ");
  } else {
    const pares = Object.entries(evidence.details)
      .filter(([, valor]) => typeof valor === "string" || typeof valor === "number")
      .map(([campo, valor]) => {
        const canonico = rotuloDeCampo.get(campo)?.[String(valor)];
        return `${campo}: ${canonico ?? valor}`;
      });
    if (pares.length === 0) return null;
    corpo = pares.join("; ");
  }

  const condicao = evidence.conditionNote ? ` — condição: ${evidence.conditionNote}` : "";

  return {
    text: `${conceito.name} — prática registrada: ${corpo}${condicao}${stateSuffix(evidence)}.`,
    ref: {
      sourceType: "evidencia_de_pratica",
      subcriterion: conceito.code,
      status: evidence.status,
      verifiedAt: evidence.verifiedAt,
    },
  };
}
