import { describe, expect, it, vi } from "vitest";

/**
 * ITEM 1.10B-P2 · ETAPA 1 — o LEITOR da cadeia (A4).
 *
 * O montador puro já tinha teste; quem não tinha era o caminho de leitura — e
 * é ele que decide o que a superfície viva vai receber. Aqui as três fontes são
 * substituídas por duplas, para que o teste prove a TRADUÇÃO de fonte para
 * cadeia, sem depender de banco.
 */

const loadCaseNeeds = vi.hoisted(() => vi.fn());
const loadCasePriorityMap = vi.hoisted(() => vi.fn());
const loadProfessionalMap = vi.hoisted(() => vi.fn());

vi.mock("@/modules/curadoria/protocolos-repository", () => ({ loadCaseNeeds }));
vi.mock("@/modules/curadoria/mapa-prioridades-repository", () => ({ loadCasePriorityMap }));
vi.mock("@/modules/curadoria/mapa-profissional-repository", () => ({ loadProfessionalMap }));

const { loadCadeiaDeProveniencia } = await import(
  "@/modules/curadoria/cadeia-de-proveniencia-repository"
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = {} as any;
const PARAMS = {
  caseId: "case-1",
  professionalProfileId: "prof-1",
  subcriterionCode: "ACESSO_MODALIDADE",
};

function prepararFontes(opcoes: {
  need?: boolean;
  importancia?: boolean;
  estado?: boolean;
}) {
  loadCaseNeeds.mockResolvedValue(
    opcoes.need
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            degree: "ESSENCIAL",
            options: ["telemedicina"],
            declaredBy: "perfil-paciente",
            declaredAt: "2026-08-01T10:00:00Z",
          },
        ]
      : [],
  );
  loadCasePriorityMap.mockResolvedValue({
    items: opcoes.importancia
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            declaredBy: "perfil-curador",
            registradoEm: "2026-08-02T09:00:00Z",
          },
        ]
      : [],
  });
  loadProfessionalMap.mockResolvedValue({
    items: opcoes.estado
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            status: "CONFIRMADO",
            note: null,
            declaredBy: "perfil-admin",
            registradoEm: "2026-07-31T08:00:00Z",
          },
        ]
      : [],
  });
}

describe("loadCadeiaDeProveniencia — a tradução de fonte para cadeia", () => {
  it("leva grau, opções, autor e data da declaração dela para o elo de origem", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const cadeia = await loadCadeiaDeProveniencia(supabase, PARAMS);
    const origem = cadeia.ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    expect(origem.presente).toBe(true);
    expect(origem.detalhe).toBe("ESSENCIAL · telemedicina");
    expect(origem.autor).toBe("perfil-paciente");
    expect(origem.em).toBe("2026-08-01T10:00:00Z");
  });

  it("leva a importância e a data de gravação para o elo da confirmação", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const confirmacao = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.detalhe).toBe("MUITO_IMPORTANTE");
    expect(confirmacao.autor).toBe("perfil-curador");
    expect(confirmacao.em).toBe("2026-08-02T09:00:00Z");
  });

  it("leva o estado e a data para o elo do profissional", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const confirmacao = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.detalhe).toBe("CONFIRMADO");
    expect(confirmacao.autor).toBe("perfil-admin");
    expect(confirmacao.em).toBe("2026-07-31T08:00:00Z");
  });

  it("conceito que nenhuma fonte conhece produz cadeia inteira de lacunas, sem erro", async () => {
    prepararFontes({});

    const cadeia = await loadCadeiaDeProveniencia(supabase, PARAMS);

    expect(cadeia.subcriterionCode).toBe("ACESSO_MODALIDADE");
    expect(cadeia.completa).toBe(false);
    for (const ramo of cadeia.ramos) {
      for (const entrada of ramo.elos) {
        expect(entrada.presente, `${ramo.lado}/${entrada.id}`).toBe(false);
        expect(entrada.detalhe).toBeNull();
      }
    }
  });

  it("o leitor não busca a Base de Evidências — e a cadeia declara essa ausência", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const origem = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    expect(origem.presente).toBe(false);
    expect(origem.lacuna).toContain("ainda não lê a Base de Evidências");
  });

  it("lê as três fontes uma vez cada, com os identificadores recebidos", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });
    loadCaseNeeds.mockClear();
    loadCasePriorityMap.mockClear();
    loadProfessionalMap.mockClear();

    await loadCadeiaDeProveniencia(supabase, PARAMS);

    expect(loadCaseNeeds).toHaveBeenCalledWith(supabase, "case-1");
    expect(loadCasePriorityMap).toHaveBeenCalledWith(supabase, "case-1");
    expect(loadProfessionalMap).toHaveBeenCalledWith(supabase, "prof-1");
  });
});
