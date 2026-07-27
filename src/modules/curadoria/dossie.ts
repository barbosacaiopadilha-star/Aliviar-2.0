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

// ---------------------------------------------------------------------------
// Proveniência
// ---------------------------------------------------------------------------

export const VERIFICATION_STATUSES = ["nao_verificado", "verificado", "divergente"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type Provenance = {
  source: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
};

/** Um dado só conta como verificado quando alguém olhou a fonte e confirmou. */
export function isVerified(provenance: Provenance | null | undefined): boolean {
  return provenance?.verificationStatus === "verificado";
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

export type Communication = {
  sharedDecision: boolean | null;
  familyCare: boolean | null;
  languages: string[];
  accessibility: string[];
  resources: string[];
} & Provenance;

export type ProfessionalDossier = {
  professionalProfileId: string;
  displayName: string;
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
  language: string | null;
  accessibilityNeeds: string[];
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
};

/**
 * Indicador interno, nunca visível ao paciente.
 *
 * Mede **quantidade de informação verificada**, e só. Não olha qualidade do
 * currículo, não pontua, não ordena: um profissional excelente com cadastro
 * pela metade é "parcialmente pronto", e isso é sobre o nosso trabalho de
 * verificação, não sobre ele.
 *
 * Sem área de atuação verificada, o cadastro é insuficiente independentemente
 * do resto — é ela que decide se o profissional sequer participa.
 */
export function assessReadiness(dossier: ProfessionalDossier): ReadinessReport {
  const blocks: { label: string; verified: boolean }[] = [
    { label: "Área de atuação", verified: isVerified(dossier.practiceArea) },
    { label: "Formação", verified: dossier.education.some(isVerified) },
    { label: "Experiência", verified: isVerified(dossier.experience) },
    { label: "Trajetória", verified: dossier.career.some(isVerified) },
    { label: "Modelo de atendimento", verified: isVerified(dossier.careModel) },
    { label: "Comunicação", verified: isVerified(dossier.communication) },
  ];

  const verifiedBlocks = blocks.filter((block) => block.verified).length;
  const missing = blocks.filter((block) => !block.verified).map((block) => block.label);
  const hasArea = isVerified(dossier.practiceArea);

  const readiness: Readiness = !hasArea
    ? "INSUFICIENTE"
    : verifiedBlocks === blocks.length
      ? "PRONTO"
      : "PARCIALMENTE_PRONTO";

  return { readiness, verifiedBlocks, totalBlocks: blocks.length, missing };
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

  if (patient.language) {
    const fala = communication.languages.length === 0
      ? null
      : communication.languages.some((lang) => lang.toLowerCase() === patient.language!.toLowerCase());
    checks.push(
      fala === null
        ? UNKNOWN("Os idiomas deste profissional não estão registrados")
        : fala
          ? { assessment: "ATENDE_PLENAMENTE", evidence: `Atende em ${patient.language}.` }
          : { assessment: "NAO_ATENDE", evidence: `Não atende em ${patient.language}.` },
    );
  }

  if (patient.accessibilityNeeds.length > 0) {
    const atendidas = patient.accessibilityNeeds.filter((need) =>
      communication.accessibility.some((offered) => offered.toLowerCase() === need.toLowerCase()),
    );
    checks.push(
      communication.accessibility.length === 0
        ? UNKNOWN("Os recursos de acessibilidade deste profissional não estão registrados")
        : atendidas.length === patient.accessibilityNeeds.length
          ? { assessment: "ATENDE_PLENAMENTE", evidence: "Oferece os recursos de acessibilidade que ela precisa." }
          : atendidas.length === 0
            ? { assessment: "NAO_ATENDE", evidence: "Não oferece os recursos de acessibilidade que ela precisa." }
            : { assessment: "ATENDE_PARCIALMENTE", evidence: "Oferece parte dos recursos de acessibilidade que ela precisa." },
    );
  }

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

  return { FORMACAO: formacao, EXPERIENCIA: experiencia, TRAJETORIA: trajetoria };
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
  FORMA_DE_CUIDADO: (declaration, dossier) => deriveFormaDeCuidado(declaration, dossier.careModel),
  COMPATIBILIDADE_PESSOAL: (declaration, dossier) => deriveCompatibilidadePessoal(declaration, dossier.communication),
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

  for (const criterion of ["FORMACAO", "EXPERIENCIA", "TRAJETORIA"] as const) {
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

  for (const criterion of ["ACESSO", "FORMA_DE_CUIDADO", "COMPATIBILIDADE_PESSOAL"] as const) {
    const derived = input.declaration
      ? PATIENT_DERIVERS[criterion](input.declaration, input.dossier)
      : UNKNOWN("Esta pessoa ainda não declarou suas prioridades na Consulta Inicial");
    evaluations.push({ criterion, assessment: derived.assessment, evidence: derived.evidence });
  }

  return { evaluations, briefing: buildTechnicalBriefing(input.dossier), awaitingCurator };
}
