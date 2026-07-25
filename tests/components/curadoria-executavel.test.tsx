import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompatibilityRunner } from "@/components/curadoria/compatibility-runner";
import { DevolutivaWorkspace } from "@/components/curadoria/devolutiva-workspace";
import { ReportEditor } from "@/components/curadoria/report-editor";
import { CuradoriaDecisionPanel } from "@/components/patient/curadoria-decision-panel";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const computeCompatibilityAction = vi.fn(async () => ({ success: true as const }));
const saveReportAction = vi.fn(async () => ({ success: true as const }));
const emitReportAction = vi.fn(async () => ({ success: true as const }));
const deliverSelectionAction = vi.fn(async () => ({ success: true as const }));
const registerDevolutivaAction = vi.fn(async () => ({ success: true as const }));
const registerDecisionAction = vi.fn(async () => ({ success: true as const }));

vi.mock("@/modules/curadoria/actions", () => ({
  computeCompatibilityAction: (...args: unknown[]) => computeCompatibilityAction(...(args as [])),
  saveReportAction: (...args: unknown[]) => saveReportAction(...(args as [])),
  emitReportAction: (...args: unknown[]) => emitReportAction(...(args as [])),
  deliverSelectionAction: (...args: unknown[]) => deliverSelectionAction(...(args as [])),
  registerDevolutivaAction: (...args: unknown[]) => registerDevolutivaAction(...(args as [])),
  registerDecisionAction: (...args: unknown[]) => registerDecisionAction(...(args as [])),
}));

afterEach(cleanup);

const PROFILE = "11111111-1111-1111-1111-111111111111";
const SELECTION = "22222222-2222-2222-2222-222222222222";

function opcao(nome: string, id: string) {
  return {
    professionalProfileId: id,
    professionalName: nome,
    justification: "Responde ao critério dela.",
    relationToWeights: "Cobre experiência.",
    attentionPoints: "Agenda concorrida.",
    suggestedQuestions: "",
    curatorObservations: "",
  };
}

describe("comparar com a rede — o chamador que faltava", () => {
  it("oferece a ação quando a comparação nunca rodou", () => {
    render(
      <CompatibilityRunner
        priorityProfileId={PROFILE}
        patientFirstName="Ana"
        hasRun={false}
        eligibleCount={0}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Comparar com a rede aprovada/ }),
    ).toBeInTheDocument();
  });

  it("nunca roda sozinha — a ação é do Curador", () => {
    render(
      <CompatibilityRunner
        priorityProfileId={PROFILE}
        patientFirstName="Ana"
        hasRun={false}
        eligibleCount={0}
      />,
    );
    expect(computeCompatibilityAction).not.toHaveBeenCalled();
  });

  it("já tendo rodado, oferece recalcular sem ameaçar o que foi selecionado", () => {
    render(
      <CompatibilityRunner
        priorityProfileId={PROFILE}
        patientFirstName="Ana"
        hasRun
        eligibleCount={7}
      />,
    );
    expect(screen.getByRole("button", { name: /Recalcular comparação/ })).toBeInTheDocument();
    expect(screen.getByText(/a seleção que você já fez não é apagada/)).toBeInTheDocument();
  });

  it("não mostra score nem vocabulário de ranking", () => {
    const { container } = render(
      <CompatibilityRunner priorityProfileId={PROFILE} patientFirstName="Ana" hasRun eligibleCount={7} />,
    );
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["score", "ranking", "melhor", "vencedor", "%"]) {
      expect(texto).not.toContain(proibido);
    }
  });
});

describe("Relatório — escrever, emitir e entregar são atos distintos", () => {
  const base = {
    priorityProfileId: PROFILE,
    curatedSelectionId: SELECTION,
    patientFirstName: "Ana",
    nextStepHref: "/finalizar",
    initialComposition: "As três cobrem o que ela pediu de formas diferentes.",
    initialOptions: [opcao("Dra. A", "a"), opcao("Dr. B", "b"), opcao("Dra. C", "c")],
  };

  it("com tudo escrito, emite — e só depois oferece entregar", () => {
    render(<ReportEditor {...base} emittedAt={null} deliveredAt={null} />);
    expect(screen.getByRole("button", { name: /Emitir o Relatório/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Entregar a Curadoria$/ })).not.toBeInTheDocument();
  });

  it("emitido, a entrega aparece — e pede confirmação antes", () => {
    render(<ReportEditor {...base} emittedAt="2026-07-20T10:00:00Z" deliveredAt={null} />);
    fireEvent.click(screen.getByRole("button", { name: /^Entregar a Curadoria$/ }));
    expect(screen.getByText(/Depois disso o documento não muda mais/)).toBeInTheDocument();
    expect(deliverSelectionAction).not.toHaveBeenCalled();
  });

  it("uma opção sem o que ela custa não pode ser emitida", () => {
    render(
      <ReportEditor
        {...base}
        emittedAt={null}
        deliveredAt={null}
        initialOptions={[
          { ...opcao("Dra. A", "a"), attentionPoints: "" },
          opcao("Dr. B", "b"),
          opcao("Dra. C", "c"),
        ]}
      />,
    );
    expect(screen.getByText(/Dra\. A: falta “o que esta opção custa”/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Emitir o Relatório/ })).not.toBeInTheDocument();
  });

  it("entregue, o documento fica somente leitura e conduz à próxima etapa", () => {
    render(<ReportEditor {...base} emittedAt="2026-07-20T10:00:00Z" deliveredAt="2026-07-21T10:00:00Z" />);
    expect(screen.getByText("Curadoria entregue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Registrar a apresentação/ })).toBeInTheDocument();
    for (const campo of screen.getAllByRole("textbox")) {
      expect(campo).toBeDisabled();
    }
  });
});

describe("Devolutiva — o Curador registra o encontro, nunca a decisão", () => {
  const props = {
    priorityProfileId: PROFILE,
    patientFirstName: "Ana",
    initial: { patientQuestions: [], observations: [], nextSteps: [] },
  };

  it("registra dúvidas, observações e o que ficou combinado", () => {
    render(<DevolutivaWorkspace {...props} presentedAt={null} />);
    expect(screen.getByLabelText(/Dúvidas que Ana trouxe/)).toBeInTheDocument();
    expect(screen.getByLabelText(/O que você observou/)).toBeInTheDocument();
    expect(screen.getByLabelText(/O que ficou combinado/)).toBeInTheDocument();
  });

  it("não oferece nenhum caminho para decidir em nome dela", () => {
    const { container } = render(<DevolutivaWorkspace {...props} presentedAt={null} />);
    const texto = (container.textContent ?? "").toLowerCase();
    expect(texto).not.toContain("escolheu");
    expect(texto).not.toContain("decisão dela:");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("nunca impõe prazo ao paciente", () => {
    const { container } = render(<DevolutivaWorkspace {...props} presentedAt={null} />);
    const texto = (container.textContent ?? "").toLowerCase();
    expect(texto).not.toContain("prazo de");
    expect(texto).toContain("sem prazo imposto");
  });
});

describe("a decisão é da paciente, e só dela", () => {
  const options = [
    { id: "o1", professionalName: "Dra. A" },
    { id: "o2", professionalName: "Dr. B" },
    { id: "o3", professionalName: "Dra. C" },
  ];

  it("as três opções e “nenhuma destas” têm o mesmo peso", () => {
    render(<CuradoriaDecisionPanel curatedSelectionId={SELECTION} options={options} decided={null} />);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByLabelText("Nenhuma destas serviu para mim")).toBeInTheDocument();
  });

  it("nenhuma vem marcada — a plataforma não escolhe por ela", () => {
    render(<CuradoriaDecisionPanel curatedSelectionId={SELECTION} options={options} decided={null} />);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
  });

  it("registra a escolha com a action do paciente", () => {
    render(<CuradoriaDecisionPanel curatedSelectionId={SELECTION} options={options} decided={null} />);
    fireEvent.click(screen.getByLabelText("Dr. B"));
    fireEvent.click(screen.getByRole("button", { name: /Registrar minha decisão/ }));
    expect(registerDecisionAction).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "CHOSEN", chosenOptionId: "o2" }),
    );
  });

  it("“nenhuma destas” não é tratada como falha dela", () => {
    render(
      <CuradoriaDecisionPanel
        curatedSelectionId={SELECTION}
        options={options}
        decided={{ outcome: "NONE_OF_THEM", chosenName: null, decidedAt: "2026-07-21T10:00:00Z" }}
      />,
    );
    expect(screen.getByText(/Isso não é uma falha sua/)).toBeInTheDocument();
  });

  it("não exibe prazo, urgência ou vocabulário interno", () => {
    const { container } = render(
      <CuradoriaDecisionPanel curatedSelectionId={SELECTION} options={options} decided={null} />,
    );
    const texto = (container.textContent ?? "").toLowerCase();
    expect(texto).toContain("não existe prazo");
    for (const proibido of ["score", "ranking", "recomendamos", "melhor opção"]) {
      expect(texto).not.toContain(proibido);
    }
  });
});
