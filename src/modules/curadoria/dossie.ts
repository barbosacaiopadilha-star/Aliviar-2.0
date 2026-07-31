/**
 * DOSSIÊ — a camada entre o cadastro e o motor.
 *
 * O motor (`cruzamento.ts`) não lê banco. Ele recebe avaliações prontas, e
 * quem as produz é este módulo. A separação não é preciosismo de camadas: o
 * motor precisa ser testável com dados inventados, e o cadastro precisa poder
 * mudar de forma sem que a regra de cruzamento mude junto.
 *
 * Duas naturezas de avaliação, e a diferença entre elas é a decisão mais
 * importante deste arquivo:
 *
 * PRIORIDADES DO PACIENTE — derivável.
 *   "Ela quer atendimento online; ele atende online." São duas declarações
 *   comparadas. Comparar declaração com declaração não é inferir nada — é
 *   ler. O sistema pode e deve fazer isso, e explicar como chegou lá.
 *
 * PERFIL TÉCNICO — humano.
 *   "Quanto a formação deste profissional responde às necessidades técnicas
 *   deste caso?" Nenhum dado do cadastro responde isso sozinho. Uma residência
 *   em ortopedia é excelente para um caso e irrelevante para outro; quem sabe
 *   a diferença é quem entendeu o caso. Deduzir isso de contagem de diplomas
 *   seria transformar volume em mérito.
 *
 *   Então este módulo NÃO julga o bloco técnico. Ele monta o dossiê — formação,
 *   experiência, trajetória, com proveniência — e o Curador declara. Enquanto
 *   ele não declarar, o critério vale INFORMACAO_INSUFICIENTE, que é a verdade:
 *   ainda não se sabe.
 *
 * É a mesma linha da área de atuação (ADR-035): o sistema organiza e mostra;
 * quem decide sobre a Curadoria é o Curador.
 */

import {
  type Assessment,
  type CriterionEvaluation,
  type PatientCriterion,
  type TechnicalCriterion,
} from "./cruzamento";
import { isStale, type InformationKind, type VerificationState } from "./fontes";

// ---------------------------------------------------------------------------
// Proveniência
// ---------------------------------------------------------------------------

export { VERIFICATION_STATES as VERIFICATION_STATUSES } from "./fontes";
export type VerificationStatus = VerificationState;

export type Provenance = {
  source: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

/**
 * Um dado só conta como verificado quando alguém olhou a fonte e confirmou —
 * e quando essa confirmação ainda vale.
 *
 * `nao_localizado` não é verificado e também não é negativo: procurou-se e não
 * se achou. `desatualizado` já foi verificado e venceu; volta a não contar,
 * porque um "verificado" antigo sobre onde alguém atende tem a aparência de
 * conferido sem ser.
 */
export function isVerified(
  provenance: Provenance | null | undefined,
  options?: { kind?: InformationKind; now?: string },
): boolean {
  if (provenance?.verificationStatus !== "verificado") return false;
  if (!options?.kind || !options.now) return true;
  return !isStale(options.kind, provenance.verifiedAt, options.now);
}

// ---------------------------------------------------------------------------
// O dossiê do profissional
// ---------------------------------------------------------------------------

export type PracticeArea = { rawText: string; tags: string[] } & Provenance;

export type EducationEntry = {
  title: string;
  kind: "graduacao" | "residencia" | "especializacao" | "fellowship" | "pos_graduacao" | "curso";
  institution: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  notes: string | null;
} & Provenance;

export type ExperienceSummary = {
  yearsOfPractice: number | null;
  mainAreas: string[];
  predominantCases: string | null;
  currentPractice: string | null;
  notes: string | null;
} & Provenance;

export type CareerEntry = {
  institution: string;
  role: string | null;
  bond: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  notes: string | null;
} & Provenance;

export type CareModel = {
  servesInPerson: boolean | null;
  servesOnline: boolean | null;
  cities: string[];
  states: string[];
  offersContinuousCare: boolean | null;
  offersReturnVisits: boolean | null;
  multidisciplinaryTeam: boolean | null;
  availabilityWindow: string | null;
  avgDaysToFirstAppointment: number | null;
} & Provenance;

// `languages` e `accessibility` saíram deste tipo em 2026-07-31: idiomas e
// acessibilidade não são conceitos do Catálogo Canônico congelado, e campo de
// domínio sem conceito correspondente é referência órfã.
export type Communication = {
  sharedDecision: boolean | null;
  familyCare: boolean | null;
  resources: string[];
} & Provenance;

/**
 * Identidade e regularidade profissional.
 *
 * `crm` digitado e `crm` conferido no conselho são a mesma string e coisas
 * inteiramente diferentes. `status` null significa que ninguém consultou —
 * jamais "regular".
 */
export type Registration = {
  crm: string | null;
  crmUf: string | null;
  status: "regular" | "irregular" | "nao_localizado" | null;
  source: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

export function isRegistrationVerified(registration: Registration | null | undefined): boolean {
  return registration?.status === "regular" && registration.verifiedAt !== null;
}

export type ProfessionalDossier = {
  professionalProfileId: string;
  displayName: string;
  /** Perfil de demonstração nunca fica pronto para Curadoria real. */
  isDemo: boolean;
  registration: Registration | null;
  practiceArea: PracticeArea | null;
  education: EducationEntry[];
  experience: ExperienceSummary | null;
  career: CareerEntry[];
  careModel: CareModel | null;
  communication: Communication | null;
};

// ---------------------------------------------------------------------------
// O que a pessoa declarou
// ---------------------------------------------------------------------------

export type PatientPriorityDeclaration = {
  caseId: string;
  desiredLocation: string | null;
  commuteLimit: string | null;
  preferredModality: string | null;
  urgency: string | null;
  availability: string | null;
  expectedFollowUp: string | null;
  continuityExpectation: string | null;
  teamParticipation: string | null;
  desiredFrequency: string | null;
  sharedDecision: boolean | null;
  familyParticipation: boolean | null;
  communicationNeeds: string | null;
  otherNeeds: string | null;
  declaredAt: string | null;
};

// ---------------------------------------------------------------------------
// Prontidão do cadastro — quantidade de informação verificada, nada mais
// ---------------------------------------------------------------------------

export const READINESS_STATES = ["PRONTO", "PARCIALMENTE_PRONTO", "INSUFICIENTE"] as const;
export type Readiness = (typeof READINESS_STATES)[number];

export const READINESS_LABELS: Record<Readiness, string> = {
  PRONTO: "Pronto para Curadoria",
  PARCIALMENTE_PRONTO: "Parcialmente pronto",
  INSUFICIENTE: "Cadastro insuficiente",
};

export type ReadinessReport = {
  readiness: Readiness;
  verifiedBlocks: number;
  totalBlocks: number;
  missing: string[];
  /** Por que o cadastro é insuficiente, quando for. */
  blockedBy: string | null;
};

/**
 * Indicador interno, nunca visível ao paciente.
 *
 * Mede **quantidade de informação verificada**, e só. Não olha qualidade do
 * currículo, não pontua, não ordena: um profissional excelente com cadastro
 * pela metade é "parcialmente pronto", e isso é sobre o nosso trabalho de
 * verificação, não sobre ele.
 *
 * Três condições eliminatórias, e nenhuma tem a ver com mérito:
 *
 * - **Demonstração** — existe para exercitar o fluxo. Nenhum grau de cadastro
 *   completo torna real quem não é.
 * - **Registro não verificado** — sem consulta ao conselho não se sabe se a
 *   pessoa exerce legalmente. Oferecer alguém nessa condição é apostar a
 *   segurança do paciente num campo digitado.
 * - **Área não verificada** — é ela que decide se o profissional participa.
 *
 * Fora isso, a conta é de quantidade: tudo verificado é pronto, parte
 * verificada é parcial.
 */
export function assessReadiness(dossier: ProfessionalDossier, now?: string): ReadinessReport {
  // Sem `now`, o tempo não entra na conta e um `verificado` vale pelo que
  // está gravado. Com `now`, verificação vencida deixa de contar.
  const at = (kind: InformationKind) => (now ? { kind, now } : undefined);

  const registrationCurrent =
    isRegistrationVerified(dossier.registration) &&
    (!now || !isStale("SITUACAO_DO_REGISTRO", dossier.registration?.verifiedAt ?? null, now));
  const areaCurrent = isVerified(dossier.practiceArea, at("AREA_DE_ATUACAO"));

  const blocks: { label: string; verified: boolean }[] = [
    { label: "Registro profissional", verified: registrationCurrent },
    { label: "Área de atuação", verified: areaCurrent },
    { label: "Formação", verified: dossier.education.some((entry) => isVerified(entry, at("GRADUACAO"))) },
    { label: "Experiência", verified: isVerified(dossier.experience, at("EXPERIENCIA_EM_TIPO_DE_CASO")) },
    { label: "Trajetória", verified: dossier.career.some((entry) => isVerified(entry, at("VINCULO_INSTITUCIONAL"))) },
    { label: "Modelo de atendimento", verified: isVerified(dossier.careModel, at("CUIDADO_CONTINUO")) },
    // A verificação de comunicação vencia pela política de IDIOMAS; com a
    // saída do conceito (2026-07-31), passa a vencer pela mesma política do
    // modelo de atendimento — a fonte é a mesma entrevista.
    { label: "Comunicação", verified: isVerified(dossier.communication, at("CUIDADO_CONTINUO")) },
  ];

  const verifiedBlocks = blocks.filter((block) => block.verified).length;
  const missing = blocks.filter((block) => !block.verified).map((block) => block.label);

  const blockedBy = dossier.isDemo
    ? "Perfil de demonstração — não participa de Curadoria real."
    : !registrationCurrent
      ? isRegistrationVerified(dossier.registration)
        ? "A verificação do registro profissional venceu — precisa ser consultada de novo."
        : "Registro profissional não verificado no conselho."
      : !areaCurrent
        ? isVerified(dossier.practiceArea)
          ? "A verificação da área de atuação venceu."
          : "Área de atuação não verificada — é ela que decide se o profissional participa."
        : null;

  const readiness: Readiness = blockedBy
    ? "INSUFICIENTE"
    : verifiedBlocks === blocks.length
      ? "PRONTO"
      : "PARCIALMENTE_PRONTO";

  return { readiness, verifiedBlocks, totalBlocks: blocks.length, missing, blockedBy };
}

// ---------------------------------------------------------------------------
// Prioridades do paciente → avaliações
// ---------------------------------------------------------------------------

type Derived = { assessment: Assessment; evidence: string };

const UNKNOWN = (what: string): Derived => ({
  assessment: "INFORMACAO_INSUFICIENTE",
  evidence: `${what} — nada foi presumido.`,
});

/**
 * Compara duas declarações e devolve um dos quatro estados.
 *
 * `null` de qualquer um dos lados é ausência, não negativa: se ela não disse o
 * que precisa, ou se o cadastro dele não diz o que oferece, a resposta honesta
 * é "não se sabe" — e o peso desse critério sai do cálculo em vez de virar
 * zero.
 */
function compareDeclared(
  patientWants: boolean | null,
  professionalOffers: boolean | null,
  labels: { unknownPatient: string; unknownProfessional: string; match: string; mismatch: string; irrelevant: string },
): Derived {
  if (patientWants === null) return UNKNOWN(labels.unknownPatient);
  // Ela não pediu: o critério não pesa contra ninguém.
  if (patientWants === false) return { assessment: "ATENDE_PLENAMENTE", evidence: labels.irrelevant };
  if (professionalOffers === null) return UNKNOWN(labels.unknownProfessional);
  return professionalOffers
    ? { assessment: "ATENDE_PLENAMENTE", evidence: labels.match }
    : { assessment: "NAO_ATENDE", evidence: labels.mismatch };
}

function deriveAcesso(patient: PatientPriorityDeclaration, care: CareModel | null): Derived {
  if (!care) return UNKNOWN("O modelo de atendimento deste profissional não está registrado");

  const checks: { ok: boolean | null; okText: string; failText: string; unknownText: string }[] = [];

  if (patient.preferredModality) {
    const wantsOnline = /online|remot|telemedicina/i.test(patient.preferredModality);
    const offers = wantsOnline ? care.servesOnline : care.servesInPerson;
    checks.push({
      ok: offers,
      okText: `Atende ${wantsOnline ? "online" : "presencialmente"}, como ela prefere.`,
      failText: `Não atende ${wantsOnline ? "online" : "presencialmente"}, que é a forma que ela prefere.`,
      unknownText: "A modalidade de atendimento não está registrada no cadastro dele",
    });
  }

  if (patient.desiredLocation) {
    const alvo = patient.desiredLocation.trim().toUpperCase();
    const cobre = care.states.length === 0 && care.cities.length === 0
      ? null
      : care.states.some((uf) => uf.toUpperCase() === alvo) ||
        care.cities.some((city) => city.toUpperCase().includes(alvo));
    checks.push({
      ok: cobre,
      okText: `Atende em ${patient.desiredLocation}, onde ela quer ser atendida.`,
      failText: `Não atende em ${patient.desiredLocation}.`,
      unknownText: "A abrangência de atendimento não está registrada",
    });
  }

  if (checks.length === 0) return UNKNOWN("Ela não declarou o que precisa em acesso");

  const unknowns = checks.filter((check) => check.ok === null);
  if (unknowns.length === checks.length) return UNKNOWN(unknowns[0]!.unknownText);

  const known = checks.filter((check) => check.ok !== null);
  const passed = known.filter((check) => check.ok);
  const evidence = [...passed.map((c) => c.okText), ...known.filter((c) => !c.ok).map((c) => c.failText)].join(" ");

  if (passed.length === known.length) return { assessment: "ATENDE_PLENAMENTE", evidence };
  if (passed.length === 0) return { assessment: "NAO_ATENDE", evidence };
  return { assessment: "ATENDE_PARCIALMENTE", evidence };
}

function deriveFormaDeCuidado(patient: PatientPriorityDeclaration, care: CareModel | null): Derived {
  if (!care) return UNKNOWN("O modelo de atendimento deste profissional não está registrado");
  if (!patient.expectedFollowUp && !patient.continuityExpectation) {
    return UNKNOWN("Ela não declarou o que espera do acompanhamento");
  }
  if (care.offersContinuousCare === null) {
    return UNKNOWN("Não está registrado se este profissional oferece acompanhamento contínuo");
  }

  if (care.offersContinuousCare) {
    const extras = [
      care.offersReturnVisits ? "com retornos previstos" : null,
      care.multidisciplinaryTeam ? "e equipe multidisciplinar" : null,
    ].filter(Boolean);
    return {
      assessment: "ATENDE_PLENAMENTE",
      evidence: `Oferece acompanhamento contínuo${extras.length ? ` ${extras.join(" ")}` : ""}, que é o que ela espera.`,
    };
  }

  // Atendimento pontual quando ela espera continuidade: atende em parte, não
  // zero — a consulta acontece, o acompanhamento é que não.
  return {
    assessment: "ATENDE_PARCIALMENTE",
    evidence: "Atende pontualmente, sem acompanhamento contínuo — e é continuidade o que ela espera.",
  };
}

function deriveCompatibilidadePessoal(
  patient: PatientPriorityDeclaration,
  communication: Communication | null,
): Derived {
  if (!communication) return UNKNOWN("As características de comunicação deste profissional não estão registradas");

  const checks: Derived[] = [];

  if (patient.sharedDecision !== null) {
    checks.push(
      compareDeclared(patient.sharedDecision, communication.sharedDecision, {
        unknownPatient: "Ela não declarou se quer decidir junto",
        unknownProfessional: "Não está registrado se este profissional pratica decisão compartilhada",
        match: "Pratica decisão compartilhada, como ela pediu.",
        mismatch: "Não pratica decisão compartilhada, e ela pediu participar da decisão.",
        irrelevant: "Ela não fez exigência quanto a decidir junto.",
      }),
    );
  }

  if (patient.familyParticipation !== null) {
    checks.push(
      compareDeclared(patient.familyParticipation, communication.familyCare, {
        unknownPatient: "Ela não declarou se quer a família presente",
        unknownProfessional: "Não está registrado se este profissional atende com a família",
        match: "Atende com participação da família, como ela pediu.",
        mismatch: "Não atende com a família presente, e ela pediu isso.",
        irrelevant: "Ela não fez exigência quanto à participação da família.",
      }),
    );
  }

  // Os cruzamentos de idioma e de recursos de acessibilidade saíram daqui em
  // 2026-07-31: os dois conceitos ficaram fora do Catálogo Canônico congelado,
  // e este módulo não compara o que o Método não representa.

  if (checks.length === 0) return UNKNOWN("Ela não declarou necessidades de compatibilidade pessoal");

  const conhecidos = checks.filter((check) => check.assessment !== "INFORMACAO_INSUFICIENTE");
  if (conhecidos.length === 0) return UNKNOWN(checks[0]!.evidence.replace(" — nada foi presumido.", ""));

  const evidence = conhecidos.map((check) => check.evidence).join(" ");
  if (conhecidos.every((check) => check.assessment === "ATENDE_PLENAMENTE")) {
    return { assessment: "ATENDE_PLENAMENTE", evidence };
  }
  if (conhecidos.every((check) => check.assessment === "NAO_ATENDE")) {
    return { assessment: "NAO_ATENDE", evidence };
  }
  return { assessment: "ATENDE_PARCIALMENTE", evidence };
}

// ---------------------------------------------------------------------------
// Perfil técnico — o dossiê que o Curador lê antes de declarar
// ---------------------------------------------------------------------------

export type TechnicalDeclaration = {
  criterion: TechnicalCriterion;
  assessment: Assessment;
  evidence: string;
};

/**
 * O que o Curador vê para julgar cada critério técnico. Fatos com
 * proveniência, na ordem em que ele precisa deles — nunca uma conclusão
 * pronta que ele só teria que assinar.
 */
export type TechnicalBriefing = Record<TechnicalCriterion, string[]>;

function describeProvenance(provenance: Provenance): string {
  if (provenance.verificationStatus === "divergente") return " (fonte diverge do registro)";
  if (provenance.verificationStatus === "verificado") return " (verificado)";
  return " (não verificado)";
}

export function buildTechnicalBriefing(dossier: ProfessionalDossier): TechnicalBriefing {
  const formacao = dossier.education.map((entry) => {
    const periodo = entry.periodStart ? ` ${entry.periodStart}–${entry.periodEnd ?? ""}`.trimEnd() : "";
    return `${entry.title}${entry.institution ? ` · ${entry.institution}` : ""}${periodo}${describeProvenance(entry)}`;
  });

  const experiencia: string[] = [];
  if (dossier.experience) {
    const exp = dossier.experience;
    if (exp.yearsOfPractice !== null) experiencia.push(`${exp.yearsOfPractice} anos de atuação${describeProvenance(exp)}`);
    if (exp.mainAreas.length > 0) experiencia.push(`Áreas principais: ${exp.mainAreas.join(", ")}`);
    if (exp.predominantCases) experiencia.push(`Casos predominantes: ${exp.predominantCases}`);
    if (exp.currentPractice) experiencia.push(`Atuação atual: ${exp.currentPractice}`);
  }

  const trajetoria = dossier.career.map((entry) => {
    const periodo = entry.periodStart ? ` ${entry.periodStart}–${entry.periodEnd ?? "atual"}` : "";
    return `${entry.institution}${entry.role ? ` · ${entry.role}` : ""}${entry.bond ? ` · ${entry.bond}` : ""}${periodo}${describeProvenance(entry)}`;
  });

  return { FORMACAO: formacao, EXPERIENCIA: experiencia, HISTORICO: trajetoria };
}

// ---------------------------------------------------------------------------
// Perfil Assistencial do Profissional — a camada 3 do Modelo v1.0, nomeada
// ---------------------------------------------------------------------------

/**
 * Como o profissional cuida, agrupado nos três eixos do Modelo v1.0 §5.
 *
 * Não recebe pontuação — é leitura. Os dados já viviam nas tabelas de modelo
 * de atendimento e comunicação; o que faltava era o nome e o agrupamento que
 * o Perfil de Prioridades do Paciente espelha, eixo a eixo. Só fatos
 * verificáveis, nunca opiniões.
 */
export type PerfilAssistencial = {
  acesso: {
    states: string[];
    cities: string[];
    servesInPerson: boolean | null;
    servesOnline: boolean | null;
    availabilityWindow: string | null;
    avgDaysToFirstAppointment: number | null;
  };
  continuidadeDoCuidado: {
    offersContinuousCare: boolean | null;
    offersReturnVisits: boolean | null;
    multidisciplinaryTeam: boolean | null;
  };
  modeloDeAtendimento: {
    sharedDecision: boolean | null;
    familyCare: boolean | null;
    resources: string[];
  };
};

export function assistencialProfile(dossier: ProfessionalDossier): PerfilAssistencial {
  const care = dossier.careModel;
  const communication = dossier.communication;

  return {
    acesso: {
      states: care?.states ?? [],
      cities: care?.cities ?? [],
      servesInPerson: care?.servesInPerson ?? null,
      servesOnline: care?.servesOnline ?? null,
      availabilityWindow: care?.availabilityWindow ?? null,
      avgDaysToFirstAppointment: care?.avgDaysToFirstAppointment ?? null,
    },
    continuidadeDoCuidado: {
      offersContinuousCare: care?.offersContinuousCare ?? null,
      offersReturnVisits: care?.offersReturnVisits ?? null,
      multidisciplinaryTeam: care?.multidisciplinaryTeam ?? null,
    },
    modeloDeAtendimento: {
      sharedDecision: communication?.sharedDecision ?? null,
      familyCare: communication?.familyCare ?? null,
      resources: communication?.resources ?? [],
    },
  };
}

// ---------------------------------------------------------------------------
// A adaptação
// ---------------------------------------------------------------------------

export type AdaptationInput = {
  dossier: ProfessionalDossier;
  declaration: PatientPriorityDeclaration | null;
  /** O que o Curador já declarou sobre o bloco técnico. Vazio no início. */
  technicalDeclarations?: TechnicalDeclaration[];
};

export type AdaptationOutput = {
  evaluations: CriterionEvaluation[];
  briefing: TechnicalBriefing;
  /** Critérios técnicos ainda sem declaração do Curador. */
  awaitingCurator: TechnicalCriterion[];
};

const PATIENT_DERIVERS: Record<
  PatientCriterion,
  (declaration: PatientPriorityDeclaration, dossier: ProfessionalDossier) => Derived
> = {
  ACESSO: (declaration, dossier) => deriveAcesso(declaration, dossier.careModel),
  CONTINUIDADE_DO_CUIDADO: (declaration, dossier) => deriveFormaDeCuidado(declaration, dossier.careModel),
  MODELO_DE_ATENDIMENTO: (declaration, dossier) => deriveCompatibilidadePessoal(declaration, dossier.communication),
};

/**
 * Cadastro + declaração da pessoa → avaliações que o motor consome.
 *
 * O bloco de prioridades é derivado aqui; o técnico só entra quando o Curador
 * declara. O que ele ainda não declarou volta em `awaitingCurator` — visível,
 * nunca silencioso, porque um critério esquecido vira informação insuficiente
 * e derruba a cobertura da análise sem dizer por quê.
 */
export function adaptToEvaluations(input: AdaptationInput): AdaptationOutput {
  const evaluations: CriterionEvaluation[] = [];
  const declaredByCriterion = new Map(
    (input.technicalDeclarations ?? []).map((declaration) => [declaration.criterion, declaration]),
  );
  const awaitingCurator: TechnicalCriterion[] = [];

  for (const criterion of ["FORMACAO", "EXPERIENCIA", "HISTORICO"] as const) {
    const declared = declaredByCriterion.get(criterion);
    if (declared) {
      evaluations.push({ criterion, assessment: declared.assessment, evidence: declared.evidence });
      continue;
    }
    awaitingCurator.push(criterion);
    evaluations.push({
      criterion,
      assessment: "INFORMACAO_INSUFICIENTE",
      evidence: "Aguarda a avaliação do Curador — só ele sabe o que este caso exige; nada foi presumido.",
    });
  }

  for (const criterion of ["ACESSO", "CONTINUIDADE_DO_CUIDADO", "MODELO_DE_ATENDIMENTO"] as const) {
    const derived = input.declaration
      ? PATIENT_DERIVERS[criterion](input.declaration, input.dossier)
      : UNKNOWN("Esta pessoa ainda não declarou suas prioridades na Consulta Inicial");
    evaluations.push({ criterion, assessment: derived.assessment, evidence: derived.evidence });
  }

  return { evaluations, briefing: buildTechnicalBriefing(input.dossier), awaitingCurator };
}
