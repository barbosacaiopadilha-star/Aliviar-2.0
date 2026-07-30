import { describe, expect, it } from "vitest";

import {
  adaptToEvaluations,
  assessReadiness,
  buildTechnicalBriefing,
  type CareModel,
  type CareerEntry,
  type Communication,
  type EducationEntry,
  type ExperienceSummary,
  type PatientPriorityDeclaration,
  type PracticeArea,
  type ProfessionalDossier,
  type Provenance,
  type Registration,
} from "@/modules/curadoria/dossie";

const VERIFICADO: Provenance = {
  source: "Documento enviado pelo profissional",
  verificationStatus: "verificado",
  verifiedAt: "2026-07-27T12:00:00.000Z",
  verifiedBy: "curador-1",
};

const NAO_VERIFICADO: Provenance = {
  source: "Autodeclarado",
  verificationStatus: "nao_verificado",
  verifiedAt: null,
  verifiedBy: null,
};

const AREA: PracticeArea = {
  ...VERIFICADO,
  rawText: "Ortopedia com foco em joelho",
  tags: ["ortopedia", "joelho"],
};

const FORMACAO: EducationEntry = {
  ...VERIFICADO,
  title: "Residência em Ortopedia e Traumatologia",
  kind: "residencia",
  institution: "Hospital das Clínicas",
  periodStart: 2012,
  periodEnd: 2015,
  notes: null,
};

const EXPERIENCIA: ExperienceSummary = {
  ...VERIFICADO,
  yearsOfPractice: 11,
  mainAreas: ["joelho", "medicina esportiva"],
  predominantCases: "Lesões ligamentares em adultos jovens",
  currentPractice: "Consultório próprio e hospital de referência",
  notes: null,
};

const HISTORICO: CareerEntry = {
  ...VERIFICADO,
  institution: "Hospital de Referência",
  role: "Médico assistente",
  bond: "Corpo clínico",
  periodStart: 2016,
  periodEnd: null,
  notes: null,
};

const MODELO: CareModel = {
  ...VERIFICADO,
  servesInPerson: true,
  servesOnline: true,
  cities: ["São Paulo"],
  states: ["SP"],
  offersContinuousCare: true,
  offersReturnVisits: true,
  multidisciplinaryTeam: true,
  availabilityWindow: "Manhãs de segunda a quinta",
  avgDaysToFirstAppointment: 7,
};

const COMUNICACAO: Communication = {
  ...VERIFICADO,
  sharedDecision: true,
  familyCare: true,
  languages: ["Português", "Inglês"],
  accessibility: ["Libras"],
  resources: ["Material impresso"],
};

const REGISTRO: Registration = {
  crm: "123456",
  crmUf: "SP",
  status: "regular",
  source: "Consulta ao CRM-SP",
  verifiedAt: "2026-07-27T12:00:00.000Z",
  verifiedBy: "curador-1",
};

function dossier(overrides: Partial<ProfessionalDossier> = {}): ProfessionalDossier {
  return {
    professionalProfileId: "prof-1",
    displayName: "Dra. Exemplo",
    isDemo: false,
    registration: REGISTRO,
    practiceArea: AREA,
    education: [FORMACAO],
    experience: EXPERIENCIA,
    career: [HISTORICO],
    careModel: MODELO,
    communication: COMUNICACAO,
    ...overrides,
  };
}

function declaration(overrides: Partial<PatientPriorityDeclaration> = {}): PatientPriorityDeclaration {
  return {
    caseId: "case-1",
    desiredLocation: "SP",
    commuteLimit: null,
    preferredModality: "Presencial",
    urgency: null,
    availability: null,
    expectedFollowUp: "Quer ser acompanhada ao longo do tratamento",
    continuityExpectation: "Continuidade com o mesmo profissional",
    teamParticipation: null,
    desiredFrequency: null,
    sharedDecision: true,
    familyParticipation: true,
    language: "Português",
    accessibilityNeeds: [],
    communicationNeeds: null,
    otherNeeds: null,
    declaredAt: "2026-07-27T10:00:00.000Z",
    ...overrides,
  };
}

function assessmentOf(output: ReturnType<typeof adaptToEvaluations>, criterion: string) {
  return output.evaluations.find((evaluation) => evaluation.criterion === criterion)!;
}

describe("Prontidão do cadastro — quantidade verificada, nunca mérito", () => {
  it("cadastro completo e verificado fica pronto para Curadoria", () => {
    const report = assessReadiness(dossier());
    expect(report.readiness).toBe("PRONTO");
    expect(report.verifiedBlocks).toBe(report.totalBlocks);
    expect(report.missing).toEqual([]);
  });

  it("cadastro pela metade fica parcialmente pronto e diz o que falta", () => {
    const report = assessReadiness(dossier({ career: [], communication: null }));
    expect(report.readiness).toBe("PARCIALMENTE_PRONTO");
    expect(report.missing).toContain("Trajetória");
    expect(report.missing).toContain("Comunicação");
  });

  it("sem área de atuação verificada o cadastro é insuficiente, por mais completo que esteja o resto", () => {
    expect(assessReadiness(dossier({ practiceArea: null })).readiness).toBe("INSUFICIENTE");
    // Autodeclarada e não conferida também não basta: é ela que decide quem participa.
    expect(assessReadiness(dossier({ practiceArea: { ...AREA, ...NAO_VERIFICADO } })).readiness).toBe(
      "INSUFICIENTE",
    );
  });

  it("sem registro verificado no conselho o cadastro é insuficiente", () => {
    expect(assessReadiness(dossier({ registration: null })).readiness).toBe("INSUFICIENTE");

    // CRM digitado não é CRM conferido.
    const semConsulta = assessReadiness(
      dossier({ registration: { ...REGISTRO, status: null, verifiedAt: null, verifiedBy: null } }),
    );
    expect(semConsulta.readiness).toBe("INSUFICIENTE");
    expect(semConsulta.blockedBy).toContain("Registro profissional");
  });

  it("registro irregular ou não localizado não passa", () => {
    expect(assessReadiness(dossier({ registration: { ...REGISTRO, status: "irregular" } })).readiness).toBe(
      "INSUFICIENTE",
    );
    expect(assessReadiness(dossier({ registration: { ...REGISTRO, status: "nao_localizado" } })).readiness).toBe(
      "INSUFICIENTE",
    );
  });

  it("perfil de demonstração nunca fica pronto, ainda que o cadastro esteja completo e verificado", () => {
    const completo = assessReadiness(dossier());
    expect(completo.readiness).toBe("PRONTO");

    const demo = assessReadiness(dossier({ isDemo: true }));
    // Mesmos dados, mesma contagem de blocos verificados — e mesmo assim não.
    expect(demo.verifiedBlocks).toBe(completo.verifiedBlocks);
    expect(demo.readiness).toBe("INSUFICIENTE");
    expect(demo.blockedBy).toContain("demonstração");
  });

  it("dado registrado mas não verificado não conta como pronto", () => {
    const report = assessReadiness(dossier({ education: [{ ...FORMACAO, ...NAO_VERIFICADO }] }));
    expect(report.readiness).toBe("PARCIALMENTE_PRONTO");
    expect(report.missing).toContain("Formação");
  });

  it("a prontidão não olha volume de currículo — três diplomas ou um dão o mesmo estado", () => {
    const um = assessReadiness(dossier());
    const tres = assessReadiness(dossier({ education: [FORMACAO, FORMACAO, FORMACAO] }));
    expect(tres.readiness).toBe(um.readiness);
    expect(tres.verifiedBlocks).toBe(um.verifiedBlocks);
  });
});

describe("Bloco técnico — o sistema organiza, o Curador declara", () => {
  it("sem declaração do Curador os três critérios técnicos ficam insuficientes, não zerados", () => {
    const output = adaptToEvaluations({ dossier: dossier(), declaration: declaration() });

    expect(output.awaitingCurator).toEqual(["FORMACAO", "EXPERIENCIA", "HISTORICO"]);
    for (const criterion of ["FORMACAO", "EXPERIENCIA", "HISTORICO"]) {
      expect(assessmentOf(output, criterion).assessment).toBe("INFORMACAO_INSUFICIENTE");
    }
  });

  it("um cadastro impecável não vira nota sozinho — nenhum diploma sabe o que este caso exige", () => {
    const output = adaptToEvaluations({ dossier: dossier(), declaration: declaration() });
    expect(assessmentOf(output, "FORMACAO").assessment).not.toBe("ATENDE_PLENAMENTE");
    expect(assessmentOf(output, "FORMACAO").evidence).toContain("Curador");
  });

  it("o que o Curador declara passa intacto, com a evidência dele", () => {
    const output = adaptToEvaluations({
      dossier: dossier(),
      declaration: declaration(),
      technicalDeclarations: [
        { criterion: "FORMACAO", assessment: "ATENDE_PLENAMENTE", evidence: "Residência exatamente na lesão do caso." },
      ],
    });

    expect(assessmentOf(output, "FORMACAO").assessment).toBe("ATENDE_PLENAMENTE");
    expect(assessmentOf(output, "FORMACAO").evidence).toBe("Residência exatamente na lesão do caso.");
    expect(output.awaitingCurator).toEqual(["EXPERIENCIA", "HISTORICO"]);
  });

  it("o briefing entrega fatos com proveniência, não conclusões", () => {
    const briefing = buildTechnicalBriefing(dossier());
    expect(briefing.FORMACAO[0]).toContain("Residência em Ortopedia");
    expect(briefing.FORMACAO[0]).toContain("(verificado)");
    expect(briefing.EXPERIENCIA.join(" ")).toContain("11 anos");
    expect(briefing.HISTORICO[0]).toContain("Hospital de Referência");
  });

  it("divergência entre fonte e registro aparece no briefing em vez de sumir", () => {
    const briefing = buildTechnicalBriefing(
      dossier({ education: [{ ...FORMACAO, verificationStatus: "divergente" }] }),
    );
    expect(briefing.FORMACAO[0]).toContain("diverge");
  });

  it("sem trajetória o briefing vem vazio e o critério fica insuficiente — não penalizado", () => {
    const output = adaptToEvaluations({ dossier: dossier({ career: [] }), declaration: declaration() });
    expect(output.briefing.HISTORICO).toEqual([]);
    expect(assessmentOf(output, "HISTORICO").assessment).toBe("INFORMACAO_INSUFICIENTE");
  });
});

describe("Bloco de prioridades — comparar declarações não é inferir", () => {
  it("cadastro completo contra prioridades declaradas resolve os três critérios", () => {
    const output = adaptToEvaluations({ dossier: dossier(), declaration: declaration() });

    expect(assessmentOf(output, "ACESSO").assessment).toBe("ATENDE_PLENAMENTE");
    expect(assessmentOf(output, "CONTINUIDADE_DO_CUIDADO").assessment).toBe("ATENDE_PLENAMENTE");
    expect(assessmentOf(output, "MODELO_DE_ATENDIMENTO").assessment).toBe("ATENDE_PLENAMENTE");
  });

  it("a evidência explica em palavras o que foi comparado", () => {
    const output = adaptToEvaluations({ dossier: dossier(), declaration: declaration() });
    expect(assessmentOf(output, "ACESSO").evidence).toContain("SP");
    expect(assessmentOf(output, "MODELO_DE_ATENDIMENTO").evidence).toContain("decisão compartilhada");
  });

  it("quem não atende onde ela quer nem na forma que ela quer não atende — e o texto diz por quê", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ careModel: { ...MODELO, servesInPerson: false, states: ["RJ"], cities: ["Rio de Janeiro"] } }),
      declaration: declaration(),
    });

    const acesso = assessmentOf(output, "ACESSO");
    expect(acesso.assessment).toBe("NAO_ATENDE");
    expect(acesso.evidence).toContain("presencialmente");
  });

  it("atende num ponto e falha noutro é parcial, não reprovação", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ careModel: { ...MODELO, states: ["RJ"], cities: ["Rio de Janeiro"] } }),
      declaration: declaration(),
    });
    expect(assessmentOf(output, "ACESSO").assessment).toBe("ATENDE_PARCIALMENTE");
  });

  it("atendimento pontual diante de expectativa de continuidade é parcial — a consulta acontece", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ careModel: { ...MODELO, offersContinuousCare: false } }),
      declaration: declaration(),
    });
    expect(assessmentOf(output, "CONTINUIDADE_DO_CUIDADO").assessment).toBe("ATENDE_PARCIALMENTE");
  });

  it("sem modelo de atendimento registrado, acesso e forma de cuidado ficam insuficientes — nunca 'não atende'", () => {
    const output = adaptToEvaluations({ dossier: dossier({ careModel: null }), declaration: declaration() });

    expect(assessmentOf(output, "ACESSO").assessment).toBe("INFORMACAO_INSUFICIENTE");
    expect(assessmentOf(output, "CONTINUIDADE_DO_CUIDADO").assessment).toBe("INFORMACAO_INSUFICIENTE");
    expect(assessmentOf(output, "ACESSO").evidence).toContain("não está registrado");
  });

  it("campo em branco no cadastro é ausência, não negativa", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ communication: { ...COMUNICACAO, sharedDecision: null, familyCare: null, languages: [] } }),
      declaration: declaration({ language: null }),
    });
    expect(assessmentOf(output, "MODELO_DE_ATENDIMENTO").assessment).toBe("INFORMACAO_INSUFICIENTE");
  });

  it("o que ela não pediu não pesa contra ninguém", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ communication: { ...COMUNICACAO, familyCare: false } }),
      declaration: declaration({ familyParticipation: false, sharedDecision: null, language: null }),
    });
    expect(assessmentOf(output, "MODELO_DE_ATENDIMENTO").assessment).toBe("ATENDE_PLENAMENTE");
  });

  it("necessidade de acessibilidade atendida pela metade é parcial", () => {
    const output = adaptToEvaluations({
      dossier: dossier({ communication: { ...COMUNICACAO, accessibility: ["Libras"] } }),
      declaration: declaration({ accessibilityNeeds: ["Libras", "Acesso para cadeirante"] }),
    });
    expect(assessmentOf(output, "MODELO_DE_ATENDIMENTO").assessment).toBe("ATENDE_PARCIALMENTE");
  });

  it("paciente sem prioridades declaradas deixa o bloco inteiro insuficiente", () => {
    const output = adaptToEvaluations({ dossier: dossier(), declaration: null });

    for (const criterion of ["ACESSO", "CONTINUIDADE_DO_CUIDADO", "MODELO_DE_ATENDIMENTO"]) {
      expect(assessmentOf(output, criterion).assessment).toBe("INFORMACAO_INSUFICIENTE");
      expect(assessmentOf(output, criterion).evidence).toContain("Consulta Inicial");
    }
  });

  it("ela declarou, mas não sobre acesso: continua insuficiente, sem presumir", () => {
    const output = adaptToEvaluations({
      dossier: dossier(),
      declaration: declaration({ desiredLocation: null, preferredModality: null }),
    });
    expect(assessmentOf(output, "ACESSO").assessment).toBe("INFORMACAO_INSUFICIENTE");
  });
});

describe("Nenhuma ausência vira zero — a regra que atravessa a camada inteira", () => {
  it("cadastro vazio e paciente sem declaração produzem seis insuficiências, nenhuma reprovação", () => {
    const output = adaptToEvaluations({
      dossier: {
        professionalProfileId: "prof-vazio",
        displayName: "Sem cadastro",
        isDemo: false,
        registration: null,
        practiceArea: null,
        education: [],
        experience: null,
        career: [],
        careModel: null,
        communication: null,
      },
      declaration: null,
    });

    expect(output.evaluations).toHaveLength(6);
    expect(output.evaluations.every((e) => e.assessment === "INFORMACAO_INSUFICIENTE")).toBe(true);
    expect(output.evaluations.some((e) => e.assessment === "NAO_ATENDE")).toBe(false);
  });

  it("toda evidência de ausência diz que nada foi presumido", () => {
    const output = adaptToEvaluations({ dossier: dossier({ careModel: null }), declaration: null });
    const ausentes = output.evaluations.filter((e) => e.assessment === "INFORMACAO_INSUFICIENTE");
    expect(ausentes.every((e) => e.evidence.includes("nada foi presumido"))).toBe(true);
  });
});
