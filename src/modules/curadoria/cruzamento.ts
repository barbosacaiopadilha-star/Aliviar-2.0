/**
 * MOTOR DE CRUZAMENTO — dois perfis, peso igual.
 *
 * O modelo anterior distribuía 100 pontos entre seis critérios misturados:
 * "Experiência" e "Localização" disputavam o mesmo bolo, como se fossem a
 * mesma natureza de coisa. Não são. Uma pergunta se o profissional é
 * tecnicamente legítimo para este caso; a outra, se ele serve à vida desta
 * pessoa. Misturá-las deixava a Curadoria decidir sozinha qual das duas
 * importava mais — e essa é uma decisão que ninguém tinha tomado
 * explicitamente.
 *
 * Agora são dois perfis de 50 pontos cada:
 *
 *   Perfil Técnico do Profissional  × dados do profissional  → 0–50
 *   Perfil de Prioridades do Paciente × modelo de atendimento → 0–50
 *
 * Peso igual, por decisão de Método: a escolha nunca é exclusivamente técnica
 * nem exclusivamente pessoal. Um profissional impecável que ela não consegue
 * acessar não é uma opção; um profissional conveniente que não dá conta do
 * caso, muito menos.
 *
 * O nome do primeiro bloco é "Perfil Técnico do Profissional", e não "do
 * Caso": o Curador distribui pontos entre formação, experiência e trajetória
 * — aspectos do profissional —, calibrando-os para este caso. Chamar de "do
 * Caso" sugeriria que o objeto avaliado é o caso, e o objeto é sempre o
 * profissional.
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

export const BLOCK_POINTS = 50;
export const TOTAL_POINTS = BLOCK_POINTS * 2;

export const TECHNICAL_CRITERIA = ["FORMACAO", "EXPERIENCIA", "TRAJETORIA"] as const;
export type TechnicalCriterion = (typeof TECHNICAL_CRITERIA)[number];

export const PATIENT_CRITERIA = ["ACESSO", "FORMA_DE_CUIDADO", "COMPATIBILIDADE_PESSOAL"] as const;
export type PatientCriterion = (typeof PATIENT_CRITERIA)[number];

export type CruzamentoCriterion = TechnicalCriterion | PatientCriterion;

export const CRITERION_LABELS: Record<CruzamentoCriterion, string> = {
  FORMACAO: "Formação Profissional",
  EXPERIENCIA: "Experiência Profissional",
  TRAJETORIA: "Trajetória Profissional",
  ACESSO: "Acesso",
  FORMA_DE_CUIDADO: "Forma de Cuidado",
  COMPATIBILIDADE_PESSOAL: "Compatibilidade Pessoal",
};

/**
 * A pergunta que o Curador responde ao distribuir os pontos.
 *
 * As três primeiras são sobre o caso ("responde a este caso?"); as três
 * últimas, sobre a pessoa ("quanto pesa para ela?"). A diferença gramatical
 * é proposital — é o que impede que o bloco de prioridades vire uma segunda
 * avaliação técnica disfarçada.
 */
export const CRITERION_QUESTIONS: Record<CruzamentoCriterion, string> = {
  FORMACAO: "Quanto a formação deste profissional responde às necessidades técnicas deste caso?",
  EXPERIENCIA: "Quanto a experiência deste profissional responde ao caso?",
  TRAJETORIA: "A trajetória profissional transmite confiança para este caso?",
  ACESSO: "Quanto pesa para esta pessoa conseguir acessar esse profissional?",
  FORMA_DE_CUIDADO: "Quanto pesa a forma como o profissional acompanha o paciente?",
  COMPATIBILIDADE_PESSOAL: "Quanto pesa a forma como esta pessoa deseja ser cuidada?",
};

/** O que cada critério olha — para a tela explicar sem inventar. */
export const CRITERION_SCOPE: Record<CruzamentoCriterion, readonly string[]> = {
  FORMACAO: ["graduação", "residência", "especializações", "fellowships", "pós-graduação", "cursos relevantes"],
  EXPERIENCIA: ["tempo de atuação", "recorrência em casos semelhantes", "experiência recente", "complexidade dos casos"],
  TRAJETORIA: ["vínculos institucionais", "estabilidade", "regularidade", "histórico verificável", "coerência da carreira"],
  ACESSO: ["localização", "deslocamento", "presencial ou online", "disponibilidade", "tempo até o atendimento"],
  FORMA_DE_CUIDADO: ["acompanhamento contínuo", "continuidade assistencial", "disponibilidade entre consultas", "coordenação do cuidado"],
  COMPATIBILIDADE_PESSOAL: ["estilo de comunicação", "participação na decisão", "clareza", "acolhimento", "necessidades individuais"],
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
 * Cada bloco fecha em 50, separadamente. O saldo é devolvido para a tela
 * mostrar quanto falta — o Curador nunca deve somar de cabeça.
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
  /** 0 a 50. Normalizado sobre o que pôde ser avaliado. */
  score: number;
  /** Dos 50 pontos do bloco, quantos tinham dado para avaliar. */
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

  // Normaliza sobre o coberto, não sobre os 50 cheios: quem tem cadastro
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
  technical: BlockOutcome;
  patient: BlockOutcome;
  /** 0 a 100 — a soma dos dois blocos, nunca apresentada como colocação. */
  total: number;
  /** Sobre quantos dos 100 pontos esta análise foi construída. */
  coverage: number;
  /** Uma frase por critério, para o Relatório nunca depender de um número. */
  narrative: string[];
};

export function cruzar(input: CruzamentoInput): CruzamentoResult {
  const technical = evaluateBlock(input.technicalWeights, input.evaluations);
  const patient = evaluateBlock(input.patientWeights, input.evaluations);

  return {
    professionalProfileId: input.professionalProfileId,
    technical,
    patient,
    total: round2(technical.score + patient.score),
    coverage: technical.coveredWeight + patient.coveredWeight,
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
 * "Avaliação construída sobre 86 dos 100 pontos possíveis."
 *
 * Existe para ser lida em voz alta na Mesa. Cobertura baixa com nota alta não
 * é excelência — é incerteza, e o Curador precisa saber a diferença antes de
 * escolher.
 */
export function coverageSentence(result: CruzamentoResult): string {
  return `Avaliação construída sobre ${result.coverage} dos ${TOTAL_POINTS} pontos possíveis.`;
}

// ---------------------------------------------------------------------------
// Organização para leitura
// ---------------------------------------------------------------------------

/**
 * Ordena para o Curador ler, e só. Não corta, não seleciona, não devolve "os
 * três". Empate mantém a ordem de entrada — um desempate arbitrário pareceria
 * uma decisão, e decisão aqui é dele.
 */
export function organizeForCurator<T extends { total: number }>(results: T[]): T[] {
  return [...results]
    .map((result, index) => ({ result, index }))
    .sort((a, b) => b.result.total - a.result.total || a.index - b.index)
    .map((entry) => entry.result);
}
