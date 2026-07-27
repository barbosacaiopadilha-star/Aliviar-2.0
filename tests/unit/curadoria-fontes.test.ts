import { describe, expect, it } from "vitest";

import {
  assessSource,
  canVerify,
  currentState,
  isStale,
  mayMarkVerified,
  publicationBlockers,
  SOURCE_MATRIX,
  sourceCanSustain,
  type SourceEvidence,
} from "@/modules/curadoria/fontes";

function evidence(overrides: Partial<SourceEvidence> = {}): SourceEvidence {
  return {
    kind: "RESIDENCIA",
    tier: "OFICIAL_PRIMARIA",
    reference: "Certidão da instituição, consultada em 27/07/2026",
    foundValue: "Residência em Ortopedia e Traumatologia",
    declaredValue: "Residência em Ortopedia e Traumatologia",
    ...overrides,
  };
}

describe("Encontrar não é verificar", () => {
  it("a melhor evidência possível ainda não conclui — só habilita alguém a concluir", () => {
    const assessment = assessSource(evidence());
    expect(assessment.eligibleState).toBe("nao_verificado");
    expect(assessment.allowsVerification).toBe(true);
  });

  it("nenhuma evidência, de nenhum nível, devolve 'verificado' sozinha", () => {
    const combinacoes = (["OFICIAL_PRIMARIA", "INSTITUCIONAL", "PUBLICA_SECUNDARIA", "INADEQUADA"] as const).map(
      (tier) => assessSource(evidence({ tier })),
    );
    expect(combinacoes.every((a) => a.eligibleState !== "verificado")).toBe(true);
  });

  it("fonte inadequada é pista, nunca prova", () => {
    const assessment = assessSource(evidence({ tier: "INADEQUADA" }));
    expect(assessment.allowsVerification).toBe(false);
    expect(assessment.reason).toContain("pista");
  });

  it("sem registrar onde se olhou, não há verificação", () => {
    expect(assessSource(evidence({ reference: null })).allowsVerification).toBe(false);
    expect(assessSource(evidence({ reference: "   " })).allowsVerification).toBe(false);
  });
});

describe("Matriz fonte × informação", () => {
  it("registro profissional exige o conselho — clínica não basta", () => {
    expect(sourceCanSustain("REGISTRO_PROFISSIONAL", "OFICIAL_PRIMARIA")).toBe(true);
    expect(sourceCanSustain("REGISTRO_PROFISSIONAL", "INSTITUCIONAL")).toBe(false);
    expect(sourceCanSustain("REGISTRO_PROFISSIONAL", "PUBLICA_SECUNDARIA")).toBe(false);
  });

  it("área de atuação vem de quem atende, não do conselho", () => {
    // A especialidade registrada não responde qual é a atuação de hoje.
    expect(sourceCanSustain("AREA_DE_ATUACAO", "INSTITUCIONAL")).toBe(true);
    expect(sourceCanSustain("AREA_DE_ATUACAO", "PUBLICA_SECUNDARIA")).toBe(false);
  });

  it("diretório profissional não sustenta cuidado contínuo nem regularidade", () => {
    expect(sourceCanSustain("CUIDADO_CONTINUO", "PUBLICA_SECUNDARIA")).toBe(false);
    expect(sourceCanSustain("SITUACAO_DO_REGISTRO", "PUBLICA_SECUNDARIA")).toBe(false);
  });

  it("fonte aquém do mínimo explica o que falta, em vez de só recusar", () => {
    const assessment = assessSource(evidence({ kind: "FELLOWSHIP", tier: "PUBLICA_SECUNDARIA" }));
    expect(assessment.allowsVerification).toBe(false);
    expect(assessment.reason).toContain("oficial primária");
  });

  it("nenhuma informação da matriz é verificável sem gente", () => {
    // Se algum dia alguém acrescentar um campo "automatizável", este teste
    // não pega — mas a matriz não tem essa coluna justamente por isso.
    for (const kind of Object.keys(SOURCE_MATRIX) as (keyof typeof SOURCE_MATRIX)[]) {
      const assessment = assessSource(evidence({ kind, tier: "OFICIAL_PRIMARIA" }));
      expect(assessment.eligibleState).not.toBe("verificado");
    }
  });
});

describe("Não localizado não é falso", () => {
  it("busca adequada sem resultado devolve 'nao_localizado', não 'divergente' nem negativa", () => {
    const assessment = assessSource(evidence({ foundValue: null }));
    expect(assessment.eligibleState).toBe("nao_localizado");
    expect(assessment.reason).toContain("não significa que seja falso");
  });

  it("não localizado nunca habilita verificação — nem para negar", () => {
    expect(assessSource(evidence({ foundValue: null })).allowsVerification).toBe(false);
  });
});

describe("Divergência", () => {
  it("fonte e cadastro discordando vira divergência, com as duas versões na frase", () => {
    const assessment = assessSource(
      evidence({
        declaredValue: "Fellowship em Cirurgia da Coluna",
        foundValue: "Curso de aperfeiçoamento em Cirurgia da Coluna",
      }),
    );

    expect(assessment.eligibleState).toBe("divergente");
    expect(assessment.reason).toContain("Fellowship em Cirurgia da Coluna");
    expect(assessment.reason).toContain("Curso de aperfeiçoamento");
    expect(assessment.allowsVerification).toBe(false);
  });

  it("acento e espaço não criam divergência falsa", () => {
    const assessment = assessSource(
      evidence({ declaredValue: "Residência em  Ortopedia", foundValue: "Residencia em Ortopedia" }),
    );
    expect(assessment.eligibleState).not.toBe("divergente");
  });

  it("na dúvida é divergência — títulos parecidos não são normalizados como iguais", () => {
    const assessment = assessSource(
      evidence({ declaredValue: "Especialização em Coluna", foundValue: "Especialização em Coluna Vertebral" }),
    );
    expect(assessment.eligibleState).toBe("divergente");
  });
});

describe("Autoridade — verificar é ato administrativo", () => {
  it("só o Administrador assina", () => {
    expect(canVerify(["administrador"])).toBe(true);
    expect(canVerify(["curador_medico"])).toBe(false);
    expect(canVerify(["atendente"])).toBe(false);
    expect(canVerify(["concierge"])).toBe(false);
    expect(canVerify(["profissional"])).toBe(false);
  });

  it("o Curador avalia o dossiê mas não atesta que o diploma existe", () => {
    const refusal = mayMarkVerified({
      roles: ["curador_medico"],
      source: "Certidão da instituição",
      verifiedBy: "curador-1",
      verifiedAt: "2026-07-27T12:00:00.000Z",
      assessment: assessSource(evidence()),
    });

    expect(refusal.allowed).toBe(false);
    expect(refusal.allowed === false && refusal.reason).toContain("Administrador");
  });

  it("o profissional declara o próprio dado sem que isso o torne verificado", () => {
    const refusal = mayMarkVerified({
      roles: ["profissional"],
      source: "Declaração do próprio profissional",
      verifiedBy: "prof-1",
      verifiedAt: "2026-07-27T12:00:00.000Z",
      assessment: assessSource(evidence()),
    });
    expect(refusal.allowed).toBe(false);
  });

  it("administrador com evidência boa e proveniência completa pode assinar", () => {
    const approval = mayMarkVerified({
      roles: ["administrador"],
      source: "Certidão da instituição",
      verifiedBy: "admin-1",
      verifiedAt: "2026-07-27T12:00:00.000Z",
      assessment: assessSource(evidence()),
    });
    expect(approval.allowed).toBe(true);
  });

  it("administrador sem fonte, sem autor ou sem data não passa", () => {
    const base = {
      roles: ["administrador"],
      source: "Certidão da instituição",
      verifiedBy: "admin-1",
      verifiedAt: "2026-07-27T12:00:00.000Z",
      assessment: assessSource(evidence()),
    };

    expect(mayMarkVerified({ ...base, source: null }).allowed).toBe(false);
    expect(mayMarkVerified({ ...base, verifiedBy: null }).allowed).toBe(false);
    expect(mayMarkVerified({ ...base, verifiedAt: null }).allowed).toBe(false);
  });

  it("administrador não consegue assinar sobre evidência que não sustenta", () => {
    const refusal = mayMarkVerified({
      roles: ["administrador"],
      source: "Perfil em rede social",
      verifiedBy: "admin-1",
      verifiedAt: "2026-07-27T12:00:00.000Z",
      assessment: assessSource(evidence({ tier: "INADEQUADA" })),
    });
    expect(refusal.allowed).toBe(false);
  });
});

describe("Validade no tempo", () => {
  const ONTEM = "2026-07-26T12:00:00.000Z";
  const HOJE = "2026-07-27T12:00:00.000Z";
  const HA_UM_ANO = "2025-07-27T12:00:00.000Z";

  it("diploma não vence", () => {
    expect(isStale("GRADUACAO", HA_UM_ANO, HOJE)).toBe(false);
    expect(isStale("RESIDENCIA", "2012-01-01T00:00:00.000Z", HOJE)).toBe(false);
  });

  it("onde a pessoa atende vence", () => {
    expect(isStale("LOCAL_DE_ATENDIMENTO", HA_UM_ANO, HOJE)).toBe(true);
    expect(isStale("DISPONIBILIDADE", HA_UM_ANO, HOJE)).toBe(true);
    expect(isStale("SITUACAO_DO_REGISTRO", HA_UM_ANO, HOJE)).toBe(true);
  });

  it("verificado recente continua valendo", () => {
    expect(isStale("CUIDADO_CONTINUO", ONTEM, HOJE)).toBe(false);
  });

  it("verificado vencido é lido como desatualizado, sem que ninguém apague o que foi assinado", () => {
    expect(currentState("LOCAL_DE_ATENDIMENTO", "verificado", HA_UM_ANO, HOJE)).toBe("desatualizado");
    expect(currentState("LOCAL_DE_ATENDIMENTO", "verificado", ONTEM, HOJE)).toBe("verificado");
  });

  it("o relógio não mexe em quem nunca foi verificado", () => {
    expect(currentState("LOCAL_DE_ATENDIMENTO", "nao_localizado", HA_UM_ANO, HOJE)).toBe("nao_localizado");
    expect(currentState("LOCAL_DE_ATENDIMENTO", "divergente", HA_UM_ANO, HOJE)).toBe("divergente");
  });
});

describe("Publicação — porta com condições, não aprovação técnica", () => {
  const pronto = {
    isDemo: false,
    crm: "123456",
    crmUf: "SP",
    registrationStatus: "regular" as const,
    practiceAreaVerified: true,
    openCriticalDivergences: 0,
  };

  it("cadastro completo e verificado pode publicar", () => {
    expect(publicationBlockers(pronto)).toEqual([]);
  });

  it("CRM digitado sem consulta ao conselho não publica", () => {
    const blockers = publicationBlockers({ ...pronto, registrationStatus: null });
    expect(blockers.join(" ")).toContain("ainda não foi consultado");
  });

  it("área declarada e não verificada não publica", () => {
    expect(publicationBlockers({ ...pronto, practiceAreaVerified: false }).join(" ")).toContain("área de atuação");
  });

  it("divergência crítica em aberto barra a publicação", () => {
    expect(publicationBlockers({ ...pronto, openCriticalDivergences: 2 }).join(" ")).toContain("2 divergência");
  });

  it("demonstração não publica, ainda que o resto esteja perfeito", () => {
    expect(publicationBlockers({ ...pronto, isDemo: true }).join(" ")).toContain("demonstração");
  });

  it("registro irregular ou não localizado não publica", () => {
    expect(publicationBlockers({ ...pronto, registrationStatus: "irregular" }).length).toBe(1);
    expect(publicationBlockers({ ...pronto, registrationStatus: "nao_localizado" }).length).toBe(1);
  });
});
