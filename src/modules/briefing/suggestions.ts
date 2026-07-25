import {
  ORIGIN_LABELS,
  PATIENT_OPTION_LABELS,
  PROFESSIONAL_OPTION_LABELS,
  type BriefingSuggestion,
  type CuratorObservation,
  type Evidence,
  type PatientAlignmentAnswer,
  type ProfessionalAlignmentAnswer,
} from "./types";

/**
 * MOTOR DE SUGESTÕES DO BRIEFING — determinístico, puro, sem IA.
 *
 * @metodo ACE_PRINCIPLES P1 — supervisão humana é constitutiva
 * @metodo ACE_PRINCIPLES P2 — compatibilidade não é medida
 * @metodo ACE_PRINCIPLES P6 — explicabilidade legível por gente
 *
 * Por que existe: o Curador precisa responder "como devo apresentar esta
 * Curadoria para esta pessoa?" sem reler a Consulta Inicial inteira.
 *
 * O que NUNCA faz: escolher profissional, ordenar opções, pontuar, inferir
 * traço de personalidade, decidir. Cada regra abaixo é uma frase escrita por
 * gente, disparada por uma combinação explícita de respostas declaradas — e
 * toda saída carrega as pontas que a produziram. Não há modelo, não há peso,
 * não há aprendizado: se alguém perguntar "por que isto apareceu?", a
 * resposta está no campo `because`.
 *
 * REGRA DE OURO: alinhamento e atenção exigem DUAS pontas (o que o paciente
 * disse × o que o médico declarou). Uma ponta só não é encontro — é ruído.
 */

function patientEvidence(answer: PatientAlignmentAnswer, text: string): Evidence {
  return {
    origin: "PACIENTE",
    dataClass: "PREFERENCIA",
    // A fala preservada tem precedência sobre o rótulo da opção (P4).
    statement: answer.verbatim?.trim() || text,
    at: answer.answeredAt,
  };
}

function professionalEvidence(answer: ProfessionalAlignmentAnswer, text: string): Evidence {
  return {
    origin: "MEDICO",
    dataClass: "FATO",
    statement: answer.declaredText?.trim() || text,
    at: answer.declaredAt,
  };
}

type Inputs = {
  patientAnswers: PatientAlignmentAnswer[];
  /** Respostas de UM profissional em avaliação. */
  professionalAnswers: ProfessionalAlignmentAnswer[];
  professionalName: string;
  observations: CuratorObservation[];
};

function findPatient(answers: PatientAlignmentAnswer[], id: string) {
  return answers.find((a) => a.questionId === id && a.option !== "PREFIRO_NAO_DIZER");
}

function findProfessional(answers: ProfessionalAlignmentAnswer[], id: string) {
  return answers.find((a) => a.questionId === id);
}

/**
 * Constrói as sugestões para UM profissional. Chamado uma vez por opção em
 * avaliação — nunca produz comparação entre elas.
 */
export function buildSuggestions(inputs: Inputs): BriefingSuggestion[] {
  const { patientAnswers, professionalAnswers, professionalName, observations } = inputs;
  const out: BriefingSuggestion[] = [];

  const pa1 = findPatient(patientAnswers, "PA1");
  const pa2 = findPatient(patientAnswers, "PA2");
  const pa3 = findPatient(patientAnswers, "PA3");
  const pa4 = findPatient(patientAnswers, "PA4");
  const pa5 = findPatient(patientAnswers, "PA5");

  const me1 = findProfessional(professionalAnswers, "ME1");
  const me2 = findProfessional(professionalAnswers, "ME2");
  const me4 = findProfessional(professionalAnswers, "ME4");
  const me5 = findProfessional(professionalAnswers, "ME5");

  // --- R1: material escrito × forma de explicar -----------------------------
  if (pa1 && me1) {
    const querEscrito = pa1.option === "LER_SOZINHO" || pa1.option === "AMBOS";
    const entregaEscrito = me1.option === "TAMBEM_POR_ESCRITO";

    if (querEscrito && entregaEscrito) {
      out.push({
        id: `R1-alinhamento-${professionalName}`,
        kind: "ALINHAMENTO",
        suggestion: `Vale mencionar que ${professionalName} costuma entregar a explicação também por escrito — é o formato que ajuda esta pessoa a decidir.`,
        because: "A pessoa disse que decide melhor lendo com calma, e este profissional declarou entregar a explicação por escrito.",
        evidence: [
          patientEvidence(pa1, PATIENT_OPTION_LABELS[pa1.option] ?? pa1.option),
          professionalEvidence(me1, PROFESSIONAL_OPTION_LABELS[me1.option ?? ""] ?? "Entrega por escrito"),
        ],
      });
    } else if (pa1.option === "LER_SOZINHO" && me1.option === "CONVERSO_E_RESPONDO") {
      out.push({
        id: `R1-atencao-${professionalName}`,
        kind: "ATENCAO",
        suggestion: `Combine antes como esta pessoa receberá o registro escrito: ela decide melhor lendo, e ${professionalName} declarou conduzir a explicação conversando.`,
        because: "A pessoa disse que decide melhor lendo sozinha; este profissional declarou explicar em conversa, sem material escrito.",
        evidence: [
          patientEvidence(pa1, PATIENT_OPTION_LABELS[pa1.option] ?? pa1.option),
          professionalEvidence(me1, PROFESSIONAL_OPTION_LABELS[me1.option ?? ""] ?? "Explica em conversa"),
        ],
      });
    }
  }

  // --- R2: quem decide × como o médico conduz a decisão ---------------------
  if (pa2 && (me1 || me5)) {
    const ponta = me5?.declaredText?.trim() ? me5 : me1;
    if (ponta) {
      const querDecidirJunto = pa2.option === "DECIDIR_JUNTO";
      out.push({
        id: `R2-${professionalName}`,
        kind: "ALINHAMENTO",
        suggestion: querDecidirJunto
          ? `Ao apresentar ${professionalName}, destaque o espaço de conversa: esta pessoa quer participar da decisão, não recebê-la pronta.`
          : `Esta pessoa prefere que o médico recomende um caminho. Vale dizer como ${professionalName} costuma conduzir esse momento.`,
        because: "A pessoa declarou como prefere decidir, e este profissional declarou como conduz a explicação.",
        evidence: [
          patientEvidence(pa2, PATIENT_OPTION_LABELS[pa2.option] ?? pa2.option),
          professionalEvidence(
            ponta,
            ponta === me5 ? "Declaração do profissional sobre o próprio jeito de atender" : PROFESSIONAL_OPTION_LABELS[ponta.option ?? ""] ?? "",
          ),
        ],
      });
    }
  }

  // --- R3: o que não quer repetir × acompanhamento declarado ----------------
  if (pa3 && pa3.option === "TEM_ALGO" && me2) {
    const semCanal = me2.option === "APENAS_CONSULTAS";
    out.push({
      id: `R3-${professionalName}`,
      kind: semCanal ? "ATENCAO" : "ALINHAMENTO",
      suggestion: semCanal
        ? `Explique como será o contato entre consultas com ${professionalName} antes da decisão — a pessoa relatou algo de um atendimento anterior que não quer repetir.`
        : `Vale contar como funciona o acompanhamento entre consultas com ${professionalName}, considerando o que a pessoa relatou de um atendimento anterior.`,
      because: "A pessoa relatou algo que não quer que se repita, e este profissional declarou como funciona o acompanhamento entre consultas.",
      evidence: [
        patientEvidence(pa3, "Relatou algo de um atendimento anterior"),
        professionalEvidence(me2, PROFESSIONAL_OPTION_LABELS[me2.option ?? ""] ?? "Acompanhamento declarado"),
      ],
    });
  }

  // --- R4: quem participa da decisão × condução com família -----------------
  if (pa4 && (pa4.option === "FAMILIA" || pa4.option === "RESPONSAVEL_LEGAL") && me4) {
    out.push({
      id: `R4-${professionalName}`,
      kind: "ALINHAMENTO",
      suggestion:
        me4.option === "RECEBO_JUNTOS"
          ? `Convide quem decide com a pessoa para a apresentação: ${professionalName} declarou receber todos juntos.`
          : `Combine com a pessoa como incluir quem decide com ela — ${professionalName} declarou conversar primeiro com o paciente.`,
      because: "A pessoa disse que a decisão é compartilhada, e este profissional declarou como conduz quando a família participa.",
      evidence: [
        patientEvidence(pa4, PATIENT_OPTION_LABELS[pa4.option] ?? pa4.option),
        professionalEvidence(me4, PROFESSIONAL_OPTION_LABELS[me4.option ?? ""] ?? ""),
      ],
    });
  }

  // --- R5: barreira prática (viabilidade, nunca afinidade) ------------------
  if (pa5 && pa5.option !== "NENHUMA") {
    out.push({
      id: `R5-${professionalName}`,
      kind: "ATENCAO",
      suggestion: `Confirme horário e formato do atendimento antes de fechar: a pessoa apontou uma dificuldade prática para ir às consultas.`,
      because: "A pessoa declarou uma dificuldade prática de comparecimento. Este ponto é de viabilidade, não de afinidade — nunca exclui um profissional.",
      evidence: [patientEvidence(pa5, PATIENT_OPTION_LABELS[pa5.option] ?? pa5.option)],
    });
  }

  // --- L1..L3: lacunas — ausência é ausência, nunca negativa (P9) -----------
  if (!pa1 && !pa2) {
    out.push({
      id: "L1",
      kind: "LACUNA",
      suggestion: "Vale perguntar, na Consulta Inicial, como esta pessoa prefere receber a Curadoria e decidir.",
      because: "Nenhuma resposta sobre forma de decidir foi registrada — isso é ausência de informação, não um traço da pessoa.",
      evidence: [{ origin: "SISTEMA", dataClass: "LACUNA", statement: "Sem respostas de alinhamento do paciente.", at: null }],
    });
  }

  if (professionalAnswers.length === 0) {
    out.push({
      id: `L2-${professionalName}`,
      kind: "LACUNA",
      suggestion: `${professionalName} ainda não declarou como conduz seus pacientes. Vale considerar o que dizer sobre isso na apresentação.`,
      because: "O profissional não preencheu as declarações de condução — ausência de informação, jamais sinal de qualidade menor.",
      evidence: [{ origin: "SISTEMA", dataClass: "LACUNA", statement: "Sem declarações de condução deste profissional.", at: null }],
    });
  }

  // --- CU3/CU4: o que o Curador já disse que precisa ser abordado -----------
  for (const obs of observations.filter((o) => o.kind === "CU3" || o.kind === "CU4")) {
    out.push({
      id: `OBS-${obs.id}`,
      kind: obs.kind === "CU4" ? "ATENCAO" : "LACUNA",
      suggestion:
        obs.kind === "CU4"
          ? `Você registrou uma discordância que deve prevalecer sobre a leitura do sistema.`
          : `Você registrou que isto precisa ser abordado antes da decisão.`,
      because: `${ORIGIN_LABELS.CURADOR} isto em ${new Date(obs.observedAt).toLocaleDateString("pt-BR")}. A leitura do Curador tem precedência sobre a do sistema.`,
      evidence: [{ origin: "CURADOR", dataClass: "INTERPRETACAO", statement: obs.note, at: obs.observedAt }],
    });
  }

  return out;
}

/**
 * Guard estrutural: toda sugestão de alinhamento ou atenção precisa das duas
 * pontas. Usado em teste e antes de exibir — uma sugestão órfã não aparece.
 */
export function hasBothSides(suggestion: BriefingSuggestion): boolean {
  if (suggestion.kind === "LACUNA") return suggestion.evidence.length >= 1;
  const origins = new Set(suggestion.evidence.map((e) => e.origin));
  // Curador sozinho vale (interpretação humana explícita); paciente+médico é o par.
  if (origins.has("CURADOR")) return true;
  return origins.has("PACIENTE") && origins.has("MEDICO");
}
