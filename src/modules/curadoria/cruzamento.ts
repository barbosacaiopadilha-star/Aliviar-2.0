/**
 * VOCABULÁRIO DO CRUZAMENTO — critérios, escala de avaliação e gate de área.
 *
 * Implementa o Modelo da Curadoria v1.0 (docs/curadoria/MODELO_CURADORIA_V1.md,
 * §3 a §7). Alterações conceituais exigem ADR que referencie aquele documento.
 *
 * M5 (ADR-042): este módulo já foi o motor dos dois cruzamentos de 100 pontos.
 * A ADR-042 substituiu essa representação pelo Mapa de Prioridades cruzado com
 * o Mapa do Profissional (`motor-compatibilidade.ts`), e o cálculo antigo ficou
 * sem chamador — foi removido aqui. Permanecem os conceitos que o Método
 * vigente continua exercendo:
 *
 *   - a compatibilidade de ÁREA, filtro eliminatório declarado pelo Curador;
 *   - os SEIS CRITÉRIOS, hoje os grupos do catálogo canônico de subcritérios;
 *   - a escala de AVALIAÇÃO em quatro estados, com informação insuficiente
 *     como estado próprio — nunca como zero.
 *
 * O que este módulo NÃO faz: escolher, pontuar, somar ou ordenar. A seleção dos
 * três caminhos é do Curador (ADR-035).
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
// Os seis critérios do Modelo v1.0
// ---------------------------------------------------------------------------
//
// M5 (ADR-042): o orçamento de 100 pontos por bloco, o cálculo dos dois
// cruzamentos 0–100 e a frase de cobertura saíram daqui — ficaram sem chamador
// nas ondas M1 a M4. O que permanece é o vocabulário do Método: os seis
// critérios (hoje grupos do catálogo de subcritérios), a escala de quatro
// estados da avaliação e o gate de área.

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
 * A pergunta de cada critério (Modelo v1.0 §4 e §6, palavra por palavra).
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
  MODELO_DE_ATENDIMENTO: ["decisão compartilhada", "participação familiar", "tempo da primeira consulta"],
};

export function isTechnicalCriterion(criterion: CruzamentoCriterion): criterion is TechnicalCriterion {
  return (TECHNICAL_CRITERIA as readonly string[]).includes(criterion);
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

export type CriterionEvaluation = {
  criterion: CruzamentoCriterion;
  assessment: Assessment;
  /** O que sustenta esta avaliação. Sem isso, o Relatório não tem o que dizer. */
  evidence: string;
};
