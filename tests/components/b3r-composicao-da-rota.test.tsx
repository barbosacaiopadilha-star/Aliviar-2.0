import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T-B3-R1..R5 · A COMPOSIÇÃO REAL DE `/paciente/curadoria`.
 *
 * **Este arquivo é proibido de importar `CuradoriaDecisionPanel`.** Importá-lo
 * é repetir o falso positivo que deixou a superfície órfã: renderizar o
 * componente prova que ele funciona, nunca que alguém o alcança.
 *
 * A guarda por grafo de imports (`alcancabilidade-de-superficie`) também não
 * bastava — ela passou com o painel **importado e não renderizado**. Import é
 * condição necessária e não suficiente; quem prova que a paciente vê é o
 * render da rota, e é o que está aqui.
 *
 * A página é um Server Component assíncrono: invocamos a função da rota e
 * renderizamos o JSX que ela devolve, com as fontes de dados controladas.
 */

const registerDecisionActionMock = vi.fn().mockResolvedValue({ success: true });
const findByCaseIdConnection = vi.fn();
const findByCaseIdRelationship = vi.fn();
const loadPatientCuradoriaMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/auth/guard", () => ({
  requireRole: vi.fn().mockResolvedValue({ user: { id: "paciente-1" } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/modules/curadoria/patient-curadoria", () => ({
  loadPatientCuradoria: () => loadPatientCuradoriaMock(),
}));
vi.mock("@/modules/connection", () => ({
  SupabaseConnectionRepository: class {
    findByCaseId = findByCaseIdConnection;
  },
}));
vi.mock("@/modules/relationship", () => ({
  SupabaseRelationshipRepository: class {
    findByCaseId = findByCaseIdRelationship;
  },
}));
vi.mock("@/modules/curadoria/actions", () => ({
  registerDecisionAction: (input: unknown) => registerDecisionActionMock(input),
}));
// O caminho legado (H4) alcança painéis que o canônico nunca renderiza —
// progresso da conexão e modo de contato —, e cada um importa as suas actions.
vi.mock("@/modules/connection/actions", () => ({
  createConnectionAction: vi.fn(),
  correctChoiceAction: vi.fn(),
  setContactModeAction: vi.fn(),
  defineContactModeAction: vi.fn(),
  registerContactIntentAction: vi.fn(),
  confirmFirstAppointmentAction: vi.fn(),
  closeWithoutRelationshipAction: vi.fn(),
}));

// Importada DEPOIS dos mocks, e é a própria rota — não um componente solto.
const { default: PatientCuradoriaPage } = await import("@/app/paciente/curadoria/page");

const OPCOES = [
  { id: "op-a", professionalName: "Dra. Helena Monteiro" },
  { id: "op-b", professionalName: "Dr. Rafael Nogueira" },
  { id: "op-c", professionalName: "Dra. Marina Azevedo" },
];

function curadoria(decision: unknown = null) {
  return {
    curatedSelectionId: "sel-1",
    caseId: "case-1",
    curatorName: "Curadora do Case",
    deliveredAt: "2026-08-10T12:00:00.000Z",
    compositionRationale: "Os três cobrem a área por caminhos diferentes.",
    options: OPCOES.map((o) => ({
      ...o,
      professionalProfileId: `prof-${o.id}`,
      justification: `Entrou porque responde ao seu caso — ${o.professionalName}.`,
      relationToWeights: "Cobre continuidade.",
      relationalReading: null,
      favorablePoints: ["Formação específica."],
      attentionPoints: ["Agenda concorrida."],
      suggestedQuestions: ["Como funciona o acompanhamento?"],
      dimensions: [],
    })),
    decision,
  };
}

async function renderizarRota() {
  render(await PatientCuradoriaPage());
}

beforeEach(() => {
  vi.clearAllMocks();
  findByCaseIdConnection.mockResolvedValue(null);
  findByCaseIdRelationship.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("T-B3-R1..R5 · a rota real compõe a decisão canônica", () => {
  it("T-B3-R1 · entregue e sem decisão → o formulário canônico está NA ROTA", async () => {
    loadPatientCuradoriaMock.mockResolvedValue(curadoria(null));

    await renderizarRota();

    // O formulário canônico é o único que oferece "nenhuma destas".
    expect(screen.getByRole("button", { name: /Registrar minha decisão/ })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Nenhuma destas serviu para mim" }),
    ).toBeInTheDocument();
  });

  it("T-B3-R5 · os três caminhos continuam na composição", async () => {
    loadPatientCuradoriaMock.mockResolvedValue(curadoria(null));

    await renderizarRota();

    expect(screen.getByRole("heading", { name: "Seus três caminhos" })).toBeInTheDocument();
    for (const opcao of OPCOES) {
      expect(screen.getByRole("article", { name: opcao.professionalName })).toBeInTheDocument();
    }
  });

  it("T-B3-R3/R4 · decisão projetada → estado decidido, e o formulário some", async () => {
    loadPatientCuradoriaMock.mockResolvedValue(
      curadoria({
        outcome: "CHOSEN",
        chosenName: "Dra. Helena Monteiro",
        decidedAt: "2026-08-11T12:00:00.000Z",
      }),
    );

    await renderizarRota();

    expect(screen.getByText("Sua decisão está registrada.")).toBeInTheDocument();
    expect(
      screen.getByText(/a próxima etapa passa a ser acompanhada pela Equipe Aliviar/),
    ).toBeInTheDocument();

    // Append-only: nenhuma capacidade de decidir de novo.
    expect(screen.queryByRole("button", { name: /Registrar minha decisão/ })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Nenhuma destas serviu para mim" })).toBeNull();

    // E os três caminhos seguem consultáveis depois de decidir (R5).
    expect(screen.getByRole("heading", { name: "Seus três caminhos" })).toBeInTheDocument();
  });

  describe("H2/H3 · a conexão deixa de perguntar 'com quem'", () => {
    it("H3 · sem decisão e sem conexão, nenhuma superfície de conexão aparece", async () => {
      loadPatientCuradoriaMock.mockResolvedValue(curadoria(null));

      await renderizarRota();

      expect(screen.queryByText(/Com quem você gostaria de seguir/i)).toBeNull();
    });

    it("H3 · recusa legítima não recebe 'com quem seguir?'", async () => {
      loadPatientCuradoriaMock.mockResolvedValue(
        curadoria({ outcome: "NONE_OF_THEM", chosenName: null, decidedAt: "2026-08-11T12:00:00.000Z" }),
      );

      await renderizarRota();

      expect(screen.getByText(/nenhuma das três serviu/i)).toBeInTheDocument();
      // Nenhuma superfície de conexão — nem a pergunta legada, nem o convite
      // canônico a começar. Quem disse que nenhuma serviu não tem com quem.
      expect(screen.queryByText(/Com quem você gostaria de seguir/i)).toBeNull();
      expect(screen.queryByRole("heading", { name: "Começar seu acompanhamento" })).toBeNull();
      expect(screen.queryByText(/Caminho escolhido:/)).toBeNull();
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
    });
  });

  describe("B3-COPY · a rota DIZ o modo, e os dois modos falam línguas diferentes", () => {
    // `modo` é prop, e prop não é observável de fora sem trocar o componente
    // real por um dublê — o que destruiria justamente o que este arquivo
    // existe para provar (composição, não render isolado). O que se prova
    // aqui é o EFEITO do modo, que é a única coisa que a paciente vê.

    it("T-B3-R4 · canônico: começar, com a pessoa já decidida como informação fixa", async () => {
      loadPatientCuradoriaMock.mockResolvedValue(
        curadoria({
          outcome: "CHOSEN",
          chosenName: "Dra. Helena Monteiro",
          decidedAt: "2026-08-11T12:00:00.000Z",
        }),
      );

      await renderizarRota();

      expect(
        screen.getByRole("heading", { name: "Começar seu acompanhamento" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Caminho escolhido: Dra. Helena Monteiro")).toBeInTheDocument();

      // Não há o que marcar, não há o que trocar, e nenhuma frase do legado
      // sobrevive na rota canônica.
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.queryByRole("button", { name: "Alterar minha escolha" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Com quem você gostaria de seguir?" }),
      ).toBeNull();
      expect(screen.queryByText(/Os profissionais foram apresentados/)).toBeNull();

      // E os três caminhos continuam consultáveis depois de decidir (R5).
      expect(screen.getByRole("heading", { name: "Seus três caminhos" })).toBeInTheDocument();
      for (const opcao of OPCOES) {
        expect(screen.getByRole("article", { name: opcao.professionalName })).toBeInTheDocument();
      }
    });

  });
});
