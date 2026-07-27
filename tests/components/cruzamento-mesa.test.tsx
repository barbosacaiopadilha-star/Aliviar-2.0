import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CruzamentoMesa } from "@/components/curadoria/cruzamento-mesa";
import { buildComparison, classifyProfessional } from "@/modules/curadoria/mesa-cruzamento-view";
import type { MesaCruzamentoView, MesaProfessional } from "@/modules/curadoria/mesa-cruzamento";
import type { CriterionEvaluation, CriterionWeight } from "@/modules/curadoria/cruzamento";

const declareArea = vi.hoisted(() => vi.fn(async () => ({ success: true as const })));
const saveWeights = vi.hoisted(() => vi.fn(async () => ({ success: true as const })));
vi.mock("@/modules/curadoria/cruzamento-actions", () => ({
  declareAreaAction: declareArea,
  saveCruzamentoWeightsAction: saveWeights,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  declareArea.mockClear();
  saveWeights.mockClear();
});

const CASE_ID = "11111111-1111-1111-1111-111111111111";
const FILTROS = [
  { label: "Atendimento em SP", requirement: "SP", professionalValue: "SP", passes: true as const },
  { label: "Cuidado contínuo", requirement: "obrigatório", professionalValue: "oferece", passes: true as const },
];

function professional(id: string, name: string, overrides: Partial<MesaProfessional> = {}): MesaProfessional {
  return {
    professionalProfileId: id,
    displayName: name,
    cityUf: "São Paulo/SP",
    areaRawText: "Ortopedia de coluna, tratamento clínico e cirúrgico.",
    areaTags: ["ortopedia-de-coluna"],
    areaSource: "https://fixture.example.test/area",
    areaVerificationStatus: "verificado",
    areaVerifiedAt: "2026-07-27T12:00:00.000Z",
    eligibility: classifyProfessional(id, null, FILTROS),
    declaration: null,
    ...overrides,
  };
}

const WEIGHTS_FULL = {
  FORMACAO: 15,
  EXPERIENCIA: 25,
  TRAJETORIA: 10,
  ACESSO: 15,
  FORMA_DE_CUIDADO: 25,
  COMPATIBILIDADE_PESSOAL: 10,
} as const;

const WEIGHT_LIST: CriterionWeight[] = Object.entries(WEIGHTS_FULL).map(([criterion, weight]) => ({
  criterion: criterion as CriterionWeight["criterion"],
  weight,
}));

function evals(map: Record<string, CriterionEvaluation["assessment"]>): CriterionEvaluation[] {
  return Object.entries(map).map(([criterion, assessment]) => ({
    criterion: criterion as CriterionEvaluation["criterion"],
    assessment,
    evidence: `Frase de evidência para ${criterion}.`,
  }));
}

function view(overrides: Partial<MesaCruzamentoView> = {}): MesaCruzamentoView {
  const professionals = overrides.professionals ?? [professional("a", "Dra. Helena Monteiro — Fixture A")];
  const counts = {
    found: professionals.length,
    awaiting: professionals.filter((p) => p.eligibility.state === "AGUARDANDO_DECLARACAO").length,
    eligible: professionals.filter((p) => p.eligibility.state === "ELEGIVEL").length,
    eliminated: professionals.filter((p) => p.eligibility.state === "ELIMINADO").length,
    pending: professionals.filter((p) => p.eligibility.state === "PENDENTE_DE_INFORMACAO").length,
    selected: 0,
  };
  return {
    caseId: CASE_ID,
    isCertification: true,
    areaRequirement: "Ortopedia de coluna",
    profileValidated: true,
    weights: {},
    budgets: {
      technical: { block: "TECNICO", used: 0, remaining: 50, limit: 50, complete: false, sentence: "0 de 50 distribuídos. Restam 50 pontos." },
      patient: { block: "PRIORIDADES", used: 0, remaining: 50, limit: 50, complete: false, sentence: "0 de 50 distribuídos. Restam 50 pontos." },
    },
    professionals,
    counts,
    nextStep: "Sua vez: distribuir os pontos dos dois blocos.",
    comparison: [],
    awaitingDeclaration: {},
    ...overrides,
  };
}

describe("CruzamentoMesa — cabeçalho e estados", () => {
  it("perfil não validado bloqueia a Mesa com a frase certa", () => {
    render(<CruzamentoMesa view={view({ profileValidated: false })} patientFirstName="Maria" necessidade={null} />);
    expect(screen.getByText("O Perfil de Prioridades ainda precisa ser validado pela pessoa.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Orçamento de pontos")).not.toBeInTheDocument();
  });

  it("o cabeçalho mostra os indicadores compactos", () => {
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade="Ortopedia de coluna" />);
    expect(screen.getByText("Curadoria de Maria")).toBeInTheDocument();
    expect(screen.getByText("1 encontrado")).toBeInTheDocument();
    expect(screen.getByText("1 aguardando declaração")).toBeInTheDocument();
    expect(screen.getByText("0 selecionados de 3")).toBeInTheDocument();
  });

  it("rede vazia mostra mensagem, nunca tela vazia", () => {
    render(<CruzamentoMesa view={view({ professionals: [] })} patientFirstName="Maria" necessidade={null} />);
    expect(
      screen.getByText("A Rede ainda não possui profissionais disponíveis para este caso."),
    ).toBeInTheDocument();
  });
});

describe("CruzamentoMesa — orçamento de pontos", () => {
  it("o saldo é visível, reage aos controles e nunca ultrapassa 50", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    const bloco = screen.getByRole("group", { name: "Avaliação Técnica do Profissional" });
    const aumentar = within(bloco).getByRole("button", { name: "Aumentar Formação Profissional" });

    for (let i = 0; i < 12; i += 1) await user.click(aumentar); // 12 × 5 = 60, mas trava em 50
    expect(within(bloco).getByText("50 de 50 — distribuição concluída")).toBeInTheDocument();

    const campo = within(bloco).getByLabelText("Formação Profissional") as HTMLInputElement;
    expect(Number(campo.value)).toBe(50);
  });

  it("salvar fica bloqueado até o bloco fechar em 50", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    const bloco = screen.getByRole("group", { name: "Avaliação Técnica do Profissional" });
    expect(within(bloco).getByRole("button", { name: /Distribua os 50 pontos restantes/ })).toBeDisabled();

    const formacao = within(bloco).getByLabelText("Formação Profissional");
    const experiencia = within(bloco).getByLabelText("Experiência Profissional");
    const trajetoria = within(bloco).getByLabelText("Trajetória Profissional");
    await user.clear(formacao);
    await user.type(formacao, "15");
    await user.clear(experiencia);
    await user.type(experiencia, "25");
    await user.clear(trajetoria);
    await user.type(trajetoria, "10");

    const salvar = within(bloco).getByRole("button", { name: "Salvar bloco" });
    expect(salvar).toBeEnabled();
    await user.click(salvar);

    expect(saveWeights).toHaveBeenCalledWith({
      caseId: CASE_ID,
      block: "TECNICO",
      weights: { FORMACAO: 15, EXPERIENCIA: 25, TRAJETORIA: 10 },
    });
  });

  it("valor negativo nunca sobrevive — o clamp segura em zero", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);
    const campo = screen.getByLabelText("Acesso") as HTMLInputElement;
    await user.clear(campo);
    await user.type(campo, "-9");
    // O sinal é descartado pelo clamp; o valor final jamais é negativo.
    expect(Number(campo.value)).toBeGreaterThanOrEqual(0);

    const diminuir = screen.getByRole("button", { name: "Diminuir Acesso" });
    for (let i = 0; i < 5; i += 1) {
      if ((diminuir as HTMLButtonElement).disabled) break;
      await user.click(diminuir);
    }
    expect(Number(campo.value)).toBe(0);
    expect(diminuir).toBeDisabled();
  });
});

describe("CruzamentoMesa — declaração de área", () => {
  it("mostra o caso e o profissional lado a lado, com fonte e verificação", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    expect(screen.getByText("O caso exige")).toBeInTheDocument();
    expect(screen.getByText("O profissional declara")).toBeInTheDocument();
    expect(screen.getByText(/https:\/\/fixture.example.test\/area/)).toBeInTheDocument();
  });

  it("incompatível exige justificativa antes de gravar", async () => {
    const user = userEvent.setup();
    declareArea.mockResolvedValueOnce({ success: false, error: "Eliminar exige justificativa — escreva por que a área não responde ao caso." } as never);
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.click(screen.getByRole("button", { name: "Registrar declaração" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("exige justificativa");
  });

  it("parcialmente compatível oferece a confirmação explícita", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    await user.click(screen.getByRole("button", { name: "Parcialmente compatível" }));

    expect(
      screen.getByLabelText(/Confirmo que este profissional participa mesmo com compatibilidade parcial/),
    ).toBeInTheDocument();
  });

  it("a declaração enviada carrega os textos que estavam visíveis", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={view()} patientFirstName="Maria" necessidade={null} />);

    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    await user.click(screen.getByRole("button", { name: "Compatível" }));
    await user.click(screen.getByRole("button", { name: "Registrar declaração" }));

    expect(declareArea).toHaveBeenCalledWith(
      expect.objectContaining({
        compatibility: "COMPATIVEL",
        areaTextReviewed: "Ortopedia de coluna, tratamento clínico e cirúrgico.",
        caseRequirementReviewed: "Ortopedia de coluna",
      }),
    );
  });
});

describe("CruzamentoMesa — comparação", () => {
  function comparisonView() {
    const a = professional("a", "Fixture A", {
      eligibility: classifyProfessional("a", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS),
    });
    const b = professional("b", "Fixture B", {
      eligibility: classifyProfessional("b", { compatibility: "COMPATIVEL", confirmedByCurator: false, rationale: null }, FILTROS),
    });
    const comparison = buildComparison(
      ["a", "b"],
      WEIGHT_LIST,
      new Map([
        [
          "a",
          evals({
            FORMACAO: "ATENDE_PLENAMENTE",
            EXPERIENCIA: "ATENDE_PLENAMENTE",
            TRAJETORIA: "ATENDE_PARCIALMENTE",
            ACESSO: "ATENDE_PLENAMENTE",
            FORMA_DE_CUIDADO: "ATENDE_PLENAMENTE",
            COMPATIBILIDADE_PESSOAL: "ATENDE_PLENAMENTE",
          }),
        ],
        [
          "b",
          evals({
            FORMACAO: "ATENDE_PLENAMENTE",
            EXPERIENCIA: "ATENDE_PLENAMENTE",
            TRAJETORIA: "ATENDE_PLENAMENTE",
            ACESSO: "ATENDE_PARCIALMENTE",
            FORMA_DE_CUIDADO: "ATENDE_PLENAMENTE",
            COMPATIBILIDADE_PESSOAL: "INFORMACAO_INSUFICIENTE",
          }),
        ],
      ]),
    );
    return view({
      professionals: [a, b],
      weights: { ...WEIGHTS_FULL },
      budgets: {
        technical: { block: "TECNICO", used: 50, remaining: 0, limit: 50, complete: true, sentence: "50 de 50 — distribuição concluída" },
        patient: { block: "PRIORIDADES", used: 50, remaining: 0, limit: 50, complete: true, sentence: "50 de 50 — distribuição concluída" },
      },
      comparison,
    });
  }

  it("a matriz mostra estados e pontos, e a cobertura de quem tem lacuna", () => {
    render(<CruzamentoMesa view={comparisonView()} patientFirstName="Maria" necessidade={null} />);

    const tabela = screen.getByRole("table");
    expect(within(tabela).getAllByText(/25\/25/).length).toBeGreaterThan(0);
    expect(within(tabela).getByText(/não avaliável/)).toBeInTheDocument();
    expect(within(tabela).getByText("Avaliação construída sobre 90 dos 100 pontos possíveis.")).toBeInTheDocument();
  });

  it("as evidências abrem no lugar, sem nova rota", async () => {
    const user = userEvent.setup();
    render(<CruzamentoMesa view={comparisonView()} patientFirstName="Maria" necessidade={null} />);

    const celula = screen.getAllByRole("button", { expanded: false })[0]!;
    await user.click(celula);
    expect(screen.getByText(/Frase de evidência para/)).toBeInTheDocument();
  });

  it("com menos de três elegíveis, a Mesa diz que a seleção exige três", () => {
    render(<CruzamentoMesa view={comparisonView()} patientFirstName="Maria" necessidade={null} />);
    expect(screen.getByText(/Há apenas 2 profissionais elegíveis/)).toBeInTheDocument();
  });

  it("nenhum vocabulário de pódio aparece na tela", () => {
    const { container } = render(
      <CruzamentoMesa view={comparisonView()} patientFirstName="Maria" necessidade={null} />,
    );
    const texto = container.textContent!.toLowerCase();
    for (const proibido of ["melhor", "vencedor", "primeiro colocado", "mais recomendado", "ranking", "score"]) {
      expect(texto, `vocabulário proibido: ${proibido}`).not.toContain(proibido);
    }
    expect(screen.getByText(/Ordenação interna para facilitar a leitura/)).toBeInTheDocument();
  });
});
