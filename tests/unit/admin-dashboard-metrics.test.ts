import { describe, expect, it } from "vitest";

import {
  buildFunnel,
  buildTimeSeries,
  casesByRole,
  computeIndicators,
  isEmpty,
  leadsBySource,
  periodStart,
  type CaseRow,
  type DashboardSource,
  type LeadRow,
} from "@/modules/admin/dashboard-metrics";

const NOW = new Date("2026-07-24T12:00:00Z");

function iso(daysAgo: number): string {
  return new Date(NOW.getTime() - daysAgo * 24 * 36e5).toISOString();
}

function leadRow(o: Partial<LeadRow> = {}): LeadRow {
  return {
    id: crypto.randomUUID(),
    source: "site",
    createdAt: iso(3),
    qualifiedAt: null,
    convertedAt: null,
    patientProfileId: null,
    archivedAt: null,
    ...o,
  };
}

function caseRow(o: Partial<CaseRow> = {}): CaseRow {
  return {
    id: crypto.randomUUID(),
    status: "IN_CURATION",
    responsibleRole: "curador_medico",
    responsibleId: "u1",
    createdAt: iso(3),
    startedAt: iso(3),
    closedAt: null,
    handedToConciergeAt: null,
    ...o,
  };
}

const VAZIO: DashboardSource = {
  leads: null,
  cases: null,
  tasks: null,
  appointments: null,
  patients: null,
  team: null,
  stories: null,
  pendingDocuments: null,
};

describe("fonte indisponível nunca vira zero", () => {
  // Zero é uma afirmação sobre o mundo ("não há Cases atrasados"). Null é uma
  // afirmação sobre nós ("não conseguimos ler"). Confundir os dois é como um
  // painel executivo mente sem querer.
  it("todos os indicadores viram null quando não há fonte", () => {
    const i = computeIndicators(VAZIO, "30d", NOW);
    for (const [chave, valor] of Object.entries(i)) {
      expect(valor, `${chave} deveria ser null`).toBeNull();
    }
  });

  it("gráficos também: null, não array vazio", () => {
    expect(buildFunnel(VAZIO, "30d", NOW)).toBeNull();
    expect(casesByRole(VAZIO)).toBeNull();
    expect(leadsBySource(VAZIO, "30d", NOW)).toBeNull();
    expect(buildTimeSeries(VAZIO, "30d", NOW)).toBeNull();
  });

  it("isEmpty distingue 'nada aconteceu' de 'sem fonte'", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty([{ value: 0 }, { value: 0 }])).toBe(true);
    expect(isEmpty([{ value: 0 }, { value: 3 }])).toBe(false);
  });
});

describe("taxa de conversão", () => {
  it("é null sem lead nenhum — não é 0%", () => {
    const i = computeIndicators({ ...VAZIO, leads: [] }, "30d", NOW);
    expect(i.taxaConversaoLead).toBeNull();
  });

  it("calcula sobre os leads do período", () => {
    const source = {
      ...VAZIO,
      leads: [
        leadRow({ convertedAt: iso(2), patientProfileId: "p1" }),
        leadRow({ convertedAt: iso(1), patientProfileId: "p2" }),
        leadRow(),
        leadRow(),
      ],
    };
    expect(computeIndicators(source, "30d", NOW).taxaConversaoLead).toBe(50);
  });

  it("ignora lead arquivado", () => {
    const source = {
      ...VAZIO,
      leads: [leadRow({ convertedAt: iso(1), patientProfileId: "p1" }), leadRow({ archivedAt: iso(1) })],
    };
    expect(computeIndicators(source, "30d", NOW).taxaConversaoLead).toBe(100);
  });
});

describe("filtro de período", () => {
  it("'tudo' não corta nada", () => {
    expect(periodStart("tudo", NOW)).toBeNull();
  });

  it("7 dias exclui o que é mais antigo", () => {
    const source = { ...VAZIO, leads: [leadRow({ createdAt: iso(2) }), leadRow({ createdAt: iso(40) })] };
    expect(computeIndicators(source, "7d", NOW).leadsNovos).toBe(1);
    expect(computeIndicators(source, "90d", NOW).leadsNovos).toBe(2);
  });

  it("o funil respeita o mesmo período", () => {
    const source = {
      ...VAZIO,
      leads: [leadRow({ createdAt: iso(2) }), leadRow({ createdAt: iso(40) })],
      cases: [] as CaseRow[],
    };
    expect(buildFunnel(source, "7d", NOW)?.[0].value).toBe(1);
    expect(buildFunnel(source, "90d", NOW)?.[0].value).toBe(2);
  });
});

describe("funil operacional", () => {
  it("reflete o fluxo real e só encolhe", () => {
    const source: DashboardSource = {
      ...VAZIO,
      leads: [
        leadRow({ qualifiedAt: iso(2), convertedAt: iso(2), patientProfileId: "p1" }),
        leadRow({ qualifiedAt: iso(2) }),
        leadRow(),
      ],
      cases: [caseRow({ responsibleRole: "curador_medico" }), caseRow({ responsibleRole: "concierge" })],
    };

    const funil = buildFunnel(source, "30d", NOW)!;
    expect(funil.map((s) => s.label)).toEqual([
      "Lead",
      "Qualificado",
      "Paciente criado",
      "Case aberto",
      "Em Curadoria",
      "Em acompanhamento",
      "Concluído",
    ]);
    expect(funil[0].value).toBe(3);
    expect(funil[1].value).toBe(2);
    expect(funil[2].value).toBe(1);

    // Do lead até o paciente o funil não pode crescer.
    expect(funil[1].value).toBeLessThanOrEqual(funil[0].value);
    expect(funil[2].value).toBeLessThanOrEqual(funil[1].value);
  });
});

describe("Cases por responsável", () => {
  it("separa os três níveis e nunca usa 'CRM' como responsável", () => {
    const source = {
      ...VAZIO,
      cases: [
        caseRow({ responsibleRole: "atendente" }),
        caseRow({ responsibleRole: "curador_medico" }),
        caseRow({ responsibleRole: "curador_medico" }),
        caseRow({ responsibleRole: "concierge" }),
      ],
    };
    const fatias = casesByRole(source)!;
    expect(fatias.map((f) => f.label)).toEqual(["Supervisor", "Curador", "Concierge", "Sem responsável"]);
    expect(fatias.find((f) => f.label === "Curador")!.value).toBe(2);
    expect(fatias.some((f) => /crm/i.test(f.label))).toBe(false);
  });

  // Este número precisa aparecer mesmo em zero: é o que precisa doer quando cresce.
  it("mostra 'Sem responsável' sempre, inclusive em zero", () => {
    const fatias = casesByRole({ ...VAZIO, cases: [caseRow()] })!;
    expect(fatias.find((f) => f.label === "Sem responsável")).toEqual({ label: "Sem responsável", value: 0 });
  });

  it("conta os Cases órfãos", () => {
    const source = { ...VAZIO, cases: [caseRow({ responsibleRole: null, responsibleId: null })] };
    expect(computeIndicators(source, "30d", NOW).casesSemResponsavel).toBe(1);
    expect(casesByRole(source)!.find((f) => f.label === "Sem responsável")!.value).toBe(1);
  });

  it("não conta Case encerrado como aberto", () => {
    const source = { ...VAZIO, cases: [caseRow({ status: "CLOSED", responsibleId: null, responsibleRole: null })] };
    expect(computeIndicators(source, "30d", NOW).casesSemResponsavel).toBe(0);
  });
});

describe("tempo médio", () => {
  it("mede da abertura da Curadoria até a passagem ao Concierge", () => {
    const source = {
      ...VAZIO,
      cases: [caseRow({ startedAt: iso(3), handedToConciergeAt: iso(1) })],
    };
    expect(computeIndicators(source, "30d", NOW).tempoMedioCuradoriaHoras).toBe(48);
  });

  it("é null quando nenhum Case chegou ao Concierge — não é zero", () => {
    const source = { ...VAZIO, cases: [caseRow({ handedToConciergeAt: null })] };
    expect(computeIndicators(source, "30d", NOW).tempoMedioCuradoriaHoras).toBeNull();
  });
});

describe("origem dos leads", () => {
  it("agrupa por canal e joga o desconhecido em 'outro'", () => {
    const source = {
      ...VAZIO,
      leads: [
        leadRow({ source: "site" }),
        leadRow({ source: "site" }),
        leadRow({ source: "whatsapp" }),
        leadRow({ source: "tiktok" }),
      ],
    };
    const fatias = leadsBySource(source, "30d", NOW)!;
    expect(fatias[0]).toEqual({ label: "site", value: 2 });
    expect(fatias.find((f) => f.label === "outro")!.value).toBe(1);
  });
});

describe("série temporal", () => {
  it("tem um ponto por dia do período e soma no dia certo", () => {
    const source = {
      ...VAZIO,
      leads: [leadRow({ createdAt: iso(1) }), leadRow({ createdAt: iso(1) })],
      cases: [] as CaseRow[],
    };
    const serie = buildTimeSeries(source, "7d", NOW)!;
    expect(serie).toHaveLength(7);
    expect(serie[serie.length - 2].leads).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Histórias aguardando Case — a espera invisível
// ---------------------------------------------------------------------------

describe("histórias aguardando Case", () => {
  // Medido em 2026-08-19: 26 histórias enviadas, 14 sem Case algum. Nenhum
  // indicador do painel as alcançava — não são lead (já têm conta) nem Case.
  it("conta apenas as histórias que ainda não viraram Case", () => {
    const indicadores = computeIndicators(
      {
        ...VAZIO,
        stories: [
          { id: "s1", submittedAt: iso(2), hasCase: false },
          { id: "s2", submittedAt: iso(1), hasCase: true },
          { id: "s3", submittedAt: iso(5), hasCase: false },
        ],
      },
      "30d",
      new Date(),
    );

    expect(indicadores.historiasAguardandoCase).toBe(2);
  });

  it("não encolhe com o período — a espera não deixa de existir por ser antiga", () => {
    const antiga = { id: "s1", submittedAt: iso(400), hasCase: false };

    expect(
      computeIndicators({ ...VAZIO, stories: [antiga] }, "7d", new Date()).historiasAguardandoCase,
    ).toBe(1);
  });

  it("fonte indisponível continua null, nunca zero", () => {
    expect(computeIndicators(VAZIO, "30d", new Date()).historiasAguardandoCase).toBeNull();
  });
});
