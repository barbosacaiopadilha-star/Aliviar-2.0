/**
 * MOTOR DE CRUZAMENTO — dois cruzamentos independentes.
 *
 * Implementa o Modelo da Curadoria v1.0 (docs/curadoria/MODELO_CURADORIA_V1.md,
 * §7). Alterações conceituais exigem ADR que referencie aquele documento.
 *
 * Dois cruzamentos, cada um com orçamento próprio de 100 pontos:
 *
 *   Necessidade técnica do caso × Perfil Técnico do Profissional
 *     → Avaliação Técnica (0–100)
 *
 *   Perfil Assistencial do Profissional × Perfil de Prioridades do Paciente
 *     → Compatibilidade Assistencial (0–100)
 *
 * Os dois resultados permanecem SEPARADOS. Nunca existe um número de 200 —
 * somá-los faria técnica comprar deficiência assistencial, e vice-versa. Um
 * profissional impecável que ela não consegue acessar não é uma opção; um
 * profissional conveniente que não dá conta do caso, muito menos. As duas
 * perguntas são respondidas lado a lado, nunca uma pela outra.
 *
 * O que este módulo NÃO faz: escolher. Ele organiza, compara e explica. A
 * seleção dos três caminhos é do Curador (ADR-035), e o resultado nunca é
 * apresentado como ranking.
 */

// ---------------------------------------------------------------------------
// Área de atuação — filtro eliminatório, não critério ponderável
// ---------------------------------------------------------------------------

/**
 * Área de atuação saiu da pontuação e virou porta de entrada.
 *
 * Antes ela valia pontos: um ortopedista de joelho e um clínico geral
 * disputavam o mesmo caso, e o segundo compensava a área errada com
 * disponibilidade melhor. Isso é somar coisas que não se somam — área
 * incompatível não é uma desvantagem a ser compensada, é o fim da conversa.
 *
 * Agora: quem não é compatível não participa. Quem não atende plenamente
 * participa apenas se o Curador confirmar, caso a caso.
 */
export const AREA_COMPATIBILITIES = [
  "COMPATIVEL",
  "PARCIALMENTE_COMPATIVEL",
  "INCOMPATIVEL",
  "INFORMACAO_INSUFICIENTE",
] as const;

export type AreaCompatibility = (typeof AREA_COMPATIBILITIES)[number];

export const AREA_COMPATIBILITY_LABELS: Record<AreaCompatibility, string> = {
  COMPATIVEL: "Compatível",
  PARCIALMENTE_COMPATIVEL: "Parcialmente compatível",
  INCOMPATIVEL: "Incompatível",
  INFORMACAO_INSUFICIENTE: "Informação insuficiente",
};

/**
 * Quem declara a compatibilidade de área é o **Curador**, profissional a
 * profissional, com os dois textos à vista.
 *
 * A tentação era deixar o sistema comparar "Cirurgia do joelho com
 * experiência em lesões ligamentares" contra "Cirurgia do joelho,
 * artroscopia, lesões esportivas" e decidir sozinho. Duas razões para não:
 *
 * 1. Comparar texto livre com texto livre é inferência semântica. Errar aqui
 *    não produz um erro visível — produz um profissional silenciosamente
 *    excluído, ou incluído, sem que ninguém perceba.
 * 2. Decidir quem participa da Curadoria é exercer autoridade sobre ela. A
 *    ADR-035 tirou essa autoridade de qualquer motor automático e a devolveu
 *    ao Curador. Reintroduzi-la aqui, pela porta dos fundos, seria desfazer
 *    a decisão sem discuti-la.
 *
 * O sistema pode sugerir; a declaração é humana e fica registrada com autor.
 */
export type AreaAssessment = {
  professionalProfileId: string;
  compatibility: AreaCompatibility;
  /** Por que o Curador classificou assim. Obrigatório em tudo que não é COMPATIVEL. */
  rationale: string | null;
  /** Só o Curador libera um "parcialmente compatível" a participar. */
  confirmedByCurator: boolean;
};

export type AreaGateOutcome = {
  participates: boolean;
  /** Em linguagem humana: por que este profissional não entrou na comparação. */
  reason: string | null;
  /** Verdadeiro quando falta dado — nunca confundir com "não serve". */
  pendingVerification: boolean;
};

export function applyAreaGate(assessment: AreaAssessment): AreaGateOutcome {
  switch (assessment.compatibility) {
    case "COMPATIVEL":
      return { participates: true, reason: null, pendingVerification: false };

    case "PARCIALMENTE_COMPATIVEL":
      return assessment.confirmedByCurator
        ? { participates: true, reason: null, pendingVerification: false }
        : {
            participates: false,
            reason: "Área parcialmente compatível — aguarda confirmação do Curador.",
            pendingVerification: false,
          };

    case "INCOMPATIVEL":
      return {
        participates: false,
        reason: "Área de atuação incompatível com o que este caso exige.",
        pendingVerification: false,
      };

    case "INFORMACAO_INSUFICIENTE":
      // Não participa, mas por motivo diferente de "não serve": o cadastro é
      // que está incompleto. A distinção importa porque a ação corretiva é
      // outra — verificar, não descartar.
      return {
        participates: false,
        reason: "Área de atuação não registrada com detalhe suficiente para verificar.",
        pendingVerification: true,
      };
  }
}

// ---------------------------------------------------------------------------
// Os dois blocos
// ---------------------------------------------------------------------------

/** Cada cruzamento tem orçamento próprio de 100 pontos (Modelo v1.0 §4 e §6). */
export const BLOCK_POINTS = 100;

export const TECHNICAL_CRITERIA = ["FORMACAO", "EXPERIENCIA", "HISTORICO"] as const;
export type TechnicalCriterion = (typeof TECHNICAL_CRITERIA)[number];

// Os três critérios do paciente usam exatamente os eixos do Perfil
// Assistencial (Modelo v1.0 §5-§6) — é o que torna o cruzamento assistencial
// uma comparação entre duas declarações, e não uma inferência.
export const PATIENT_CRITERIA = ["ACESSO", "CONTINUIDADE_DO_CUIDADO", "MODELO_DE_ATENDIMENTO"] as const;
export type PatientCriterion = (typeof PATIENT_CRITERIA)[number];

export type CruzamentoCriterion = TechnicalCriterion | PatientCriterion;

export const CRITERION_LABELS: Record<CruzamentoCriterion, string> = {
  FORMACAO: "Formação Profissional",
  EXPERIENCIA: "Experiência Profissional",
  HISTORICO: "Histórico Profissional",
  ACESSO: "Acesso",
  CONTINUIDADE_DO_CUIDADO: "Continuidade do Cuidado",
  MODELO_DE_ATENDIMENTO: "Modelo de Atendimento",
};

/**
 * A pergunta que o Curador responde ao distribuir os pontos (Modelo v1.0
 * §4 e §6, palavra por palavra).
 *
 * As três primeiras são sobre o caso ("responde a este caso?"); as três
 * últimas, sobre a pessoa ("quanto pesa para ela?"). A diferença gramatical
 * é proposital — é o que impede que o Perfil de Prioridades vire uma segunda
 * avaliação técnica disfarçada.
 */
export const CRITERION_QUESTIONS: Record<CruzamentoCriterion, string> = {
  FORMACAO: "Quanto a formação deste profissional responde ao caso?",
  EXPERIENCIA: "Quanto a experiência deste profissional responde ao caso?",
  HISTORICO: "A trajetória profissional transmite segurança para este caso?",
  ACESSO: "Quanto pesa conseguir acessar este profissional?",
  CONTINUIDADE_DO_CUIDADO: "Quanto pesa que este profissional acompanhe toda a sua jornada?",
  MODELO_DE_ATENDIMENTO: "Quanto pesa a forma como você deseja ser cuidada?",
};

/** As evidências que cada critério olha — para a tela explicar sem inventar. */
export const CRITERION_SCOPE: Record<CruzamentoCriterion, readonly string[]> = {
  FORMACAO: ["graduação", "residência", "especializações", "fellowships", "pós-graduação", "atualização", "instituições"],
  EXPERIENCIA: ["tempo de atuação", "casos semelhantes", "atuação atual", "complexidade", "frequência"],
  HISTORICO: ["instituições", "vínculos", "regularidade", "histórico verificável", "produção científica e docência quando relevantes", "divergências"],
  ACESSO: ["estado e cidade", "presencial ou online", "disponibilidade", "tempo médio para consulta", "deslocamento"],
  CONTINUIDADE_DO_CUIDADO: ["acompanhamento contínuo", "retornos", "pós-operatório", "coordenação do tratamento", "equipe multidisciplinar"],
  MODELO_DE_ATENDIMENTO: ["decisão compartilhada", "participação familiar", "idiomas", "acessibilidade", "tempo da primeira consulta"],
};

export function isTechnicalCriterion(criterion: CruzamentoCriterion): criterion is TechnicalCriterion {
  return (TECHNICAL_CRITERIA as readonly string[]).includes(criterion);
}

// ---------------------------------------------------------------------------
// Distribuição de pontos
// ---------------------------------------------------------------------------

export type CriterionWeight = { criterion: CruzamentoCriterion; weight: number };

export type BlockBalance = {
  total: number;
  remaining: number;
  valid: boolean;
  errors: string[];
};

/**
 * Cada cruzamento fecha em 100, separadamente. O saldo é devolvido para a
 * tela mostrar quanto falta — o Curador nunca deve somar de cabeça.
 */
export function balanceOfBlock(
  weights: CriterionWeight[],
  block: "TECNICO" | "PRIORIDADES",
): BlockBalance {
  const universe: readonly CruzamentoCriterion[] = block === "TECNICO" ? TECHNICAL_CRITERIA : PATIENT_CRITERIA;
  const errors: string[] = [];
  const seen = new Set<CruzamentoCriterion>();
  let total = 0;

  for (const entry of weights) {
    if (!universe.includes(entry.criterion)) {
      errors.push(`"${CRITERION_LABELS[entry.criterion]}" não pertence a este bloco.`);
      continue;
    }
    if (seen.has(entry.criterion)) {
      errors.push(`"${CRITERION_LABELS[entry.criterion]}" aparece mais de uma vez.`);
      continue;
    }
    if (!Number.isInteger(entry.weight) || entry.weight < 0 || entry.weight > BLOCK_POINTS) {
      errors.push(`O peso de "${CRITERION_LABELS[entry.criterion]}" precisa ser um número inteiro entre 0 e ${BLOCK_POINTS}.`);
      continue;
    }
    seen.add(entry.criterion);
    total += entry.weight;
  }

  for (const criterion of universe) {
    if (!seen.has(criterion)) {
      errors.push(`Falta distribuir "${CRITERION_LABELS[criterion]}".`);
    }
  }

  if (errors.length === 0 && total !== BLOCK_POINTS) {
    errors.push(`Este bloco precisa somar exatamente ${BLOCK_POINTS} pontos — hoje soma ${total}.`);
  }

  return { total, remaining: BLOCK_POINTS - total, valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Avaliação por critério — quatro estados, nunca dois
// ---------------------------------------------------------------------------

export const ASSESSMENTS = [
  "ATENDE_PLENAMENTE",
  "ATENDE_PARCIALMENTE",
  "NAO_ATENDE",
  "INFORMACAO_INSUFICIENTE",
] as const;

export type Assessment = (typeof ASSESSMENTS)[number];

export const ASSESSMENT_LABELS: Record<Assessment, string> = {
  ATENDE_PLENAMENTE: "Atende plenamente",
  ATENDE_PARCIALMENTE: "Atende parcialmente",
  NAO_ATENDE: "Não atende",
  INFORMACAO_INSUFICIENTE: "Informação insuficiente",
};

/**
 * Escala fechada e documentada. Três valores e um vazio — não uma régua
 * contínua que dá a impressão de precisão que ninguém tem.
 *
 * `INFORMACAO_INSUFICIENTE` devolve `null`, e null nunca vira zero: um
 * cadastro incompleto não é um profissional ruim. O peso desse critério sai
 * do cálculo inteiro e reaparece como cobertura, para o Curador ver sobre
 * quanto a análise foi realmente construída.
 */
export function alignmentOf(assessment: Assessment): number | null {
  switch (assessment) {
    case "ATENDE_PLENAMENTE":
      return 100;
    case "ATENDE_PARCIALMENTE":
      return 50;
    case "NAO_ATENDE":
      return 0;
    case "INFORMACAO_INSUFICIENTE":
      return null;
  }
}

export type CriterionEvaluation = {
  criterion: CruzamentoCriterion;
  assessment: Assessment;
  /** O que sustenta esta avaliação. Sem isso, o Relatório não tem o que dizer. */
  evidence: string;
};

export type CriterionOutcome = {
  criterion: CruzamentoCriterion;
  weight: number;
  assessment: Assessment;
  alignment: number | null;
  contribution: number;
  evidence: string;
};

export type BlockOutcome = {
  /** 0 a 100. Normalizado sobre o que pôde ser avaliado. */
  score: number;
  /** Dos 100 pontos deste cruzamento, quantos tinham dado para avaliar. */
  coveredWeight: number;
  criteriaWithoutData: number;
  criteria: CriterionOutcome[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function evaluateBlock(weights: CriterionWeight[], evaluations: CriterionEvaluation[]): BlockOutcome {
  const byCriterion = new Map(evaluations.map((entry) => [entry.criterion, entry]));
  const criteria: CriterionOutcome[] = [];
  let weightedSum = 0;
  let coveredWeight = 0;
  let criteriaWithoutData = 0;

  for (const { criterion, weight } of weights) {
    const evaluation = byCriterion.get(criterion);
    const assessment: Assessment = evaluation?.assessment ?? "INFORMACAO_INSUFICIENTE";
    const evidence =
      evaluation?.evidence ??
      `O cadastro deste profissional não traz o que é preciso para avaliar ${CRITERION_LABELS[criterion].toLowerCase()} — nada foi presumido.`;
    const alignment = alignmentOf(assessment);

    if (alignment === null) {
      criteriaWithoutData += 1;
      criteria.push({ criterion, weight, assessment, alignment: null, contribution: 0, evidence });
      continue;
    }

    const contribution = round2((weight * alignment) / 100);
    weightedSum += contribution;
    coveredWeight += weight;
    criteria.push({ criterion, weight, assessment, alignment, contribution, evidence });
  }

  // Normaliza sobre o coberto, não sobre os 100 cheios: quem tem cadastro
  // incompleto não é punido com nota baixa, é sinalizado com cobertura baixa.
  // Punir seria transformar ausência de informação em julgamento.
  const score = coveredWeight === 0 ? 0 : round2((weightedSum / coveredWeight) * BLOCK_POINTS);

  return { score, coveredWeight, criteriaWithoutData, criteria };
}

// ---------------------------------------------------------------------------
// O cruzamento
// ---------------------------------------------------------------------------

export type CruzamentoInput = {
  professionalProfileId: string;
  technicalWeights: CriterionWeight[];
  patientWeights: CriterionWeight[];
  evaluations: CriterionEvaluation[];
};

export type CruzamentoResult = {
  professionalProfileId: string;
  /** Avaliação Técnica — 0 a 100, com cobertura própria. */
  technical: BlockOutcome;
  /** Compatibilidade Assistencial — 0 a 100, com cobertura própria. */
  patient: BlockOutcome;
  /** Uma frase por critério, para o Relatório nunca depender de um número. */
  narrative: string[];
};

/**
 * Os dois resultados saem lado a lado e assim permanecem. Não existe campo
 * de total combinado, e não deve voltar a existir: somá-los criaria o número
 * de 200 que o Modelo v1.0 §7 proíbe — técnica comprando deficiência
 * assistencial, e vice-versa.
 */
export function cruzar(input: CruzamentoInput): CruzamentoResult {
  const technical = evaluateBlock(input.technicalWeights, input.evaluations);
  const patient = evaluateBlock(input.patientWeights, input.evaluations);

  return {
    professionalProfileId: input.professionalProfileId,
    technical,
    patient,
    narrative: buildNarrative(technical, patient),
  };
}

/**
 * O resultado precisa se explicar sozinho. Um número sem frase é um veredito
 * sem argumento — e o Relatório exige argumento, não veredito.
 *
 * A ordem é por peso: o que a pessoa (ou o caso) considerou mais importante
 * aparece primeiro, porque é sobre isso que ela vai querer conversar.
 */
function buildNarrative(technical: BlockOutcome, patient: BlockOutcome): string[] {
  return [...technical.criteria, ...patient.criteria]
    .filter((outcome) => outcome.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map(
      (outcome) =>
        `${CRITERION_LABELS[outcome.criterion]} (${outcome.weight} pts): ${ASSESSMENT_LABELS[outcome.assessment]}. ${outcome.evidence}`,
    );
}

/**
 * "Avaliação construída sobre 80 dos 100 pontos possíveis."
 *
 * Por cruzamento — cada um tem a própria cobertura, porque cada um tem o
 * próprio orçamento. Existe para ser lida em voz alta na Mesa: cobertura
 * baixa com avaliação alta não é excelência, é incerteza, e o Curador
 * precisa saber a diferença antes de escolher.
 */
export function coverageSentence(block: BlockOutcome): string {
  return `Avaliação construída sobre ${block.coveredWeight} dos ${BLOCK_POINTS} pontos possíveis.`;
}

// A função `organizeForCurator` deste módulo foi removida no alinhamento ao
// Modelo v1.0: ela ordenava pelo total combinado, que deixou de existir.
// Definir uma nova chave de ordenação de leitura (técnica? assistencial?) é
// uma decisão de domínio que exige ADR — até lá, a comparação apresenta os
// profissionais na ordem em que a Rede os devolve. O motor legado tem a sua
// própria versão em method.ts, intocada.
