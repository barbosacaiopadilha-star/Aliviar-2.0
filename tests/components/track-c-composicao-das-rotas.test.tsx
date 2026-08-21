import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T-C-5 e T-C-6 · AS SETE INSERÇÕES, PELA COMPOSIÇÃO REAL DAS ROTAS.
 *
 * **Este arquivo é proibido de importar `ConciergeLink`.** Importá-lo seria
 * repetir o falso positivo que deixou `CuradoriaDecisionPanel` órfão: render
 * do componente prova que ele funciona, nunca que alguém o alcança. Quem prova
 * que a paciente vê é o render da ROTA, e é o que está aqui.
 *
 * As páginas são Server Components assíncronos: invocamos a função da rota e
 * renderizamos o JSX que ela devolve, com as fontes de dados controladas.
 */

const NUMERO_OFICIAL = "5511979037133";

const listCaseIds = vi.fn();
const loadCuradoriaRecord = vi.fn();
const loadPatientCuradoriaMock = vi.fn();
const carregarCentralDeDocumentosMock = vi.fn();
const carregarEstadoDeGovernancaMock = vi.fn();
const listarPedidosDoTitularMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/auth/guard", () => ({
  requireRole: vi.fn().mockResolvedValue({
    user: { id: "paciente-1" },
    profile: { displayName: "Paciente E2E" },
    roles: ["paciente"],
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
}));

// ---- Curadoria (C1 e C2) ---------------------------------------------------
vi.mock("@/modules/curadoria/patient-curadoria", () => ({
  loadPatientCuradoria: () => loadPatientCuradoriaMock(),
}));
vi.mock("@/modules/connection", () => ({
  SupabaseConnectionRepository: class {
    findByCaseId = async () => null;
  },
}));
vi.mock("@/modules/relationship", () => ({
  SupabaseRelationshipRepository: class {
    findByCaseId = async () => null;
  },
}));
vi.mock("@/modules/curadoria/actions", () => ({ registerDecisionAction: vi.fn() }));
vi.mock("@/modules/connection/actions", () => ({
  createConnectionAction: vi.fn(),
  correctChoiceAction: vi.fn(),
  setContactModeAction: vi.fn(),
  defineContactModeAction: vi.fn(),
  registerContactIntentAction: vi.fn(),
  confirmFirstAppointmentAction: vi.fn(),
  closeWithoutRelationshipAction: vi.fn(),
}));

// ---- Home e Jornada (C3 e C4) ---------------------------------------------
vi.mock("@/modules/curadoria/cos/repository", () => ({
  listCaseIds: () => listCaseIds(),
  loadCuradoriaRecord: () => loadCuradoriaRecord(),
}));
vi.mock("@/modules/story/repository", () => ({
  listStoriesForProfile: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/modules/cases", () => ({
  getPatientCaseOverview: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/modules/profiles/patient-document-repository", () => ({
  listPatientDocuments: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/modules/paciente/fatos-do-caso", () => ({
  lerFatosDoCaso: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/foundation/contrato-de-estado", () => ({
  lerEstado: () => ({ rotuloPaciente: "Sua jornada começou.", tom: "neutro", macro: "INICIO" }),
}));
vi.mock("@/modules/paciente/next-action", () => ({
  derivePatientPending: () => ({ kind: "nothing", whatHappensNext: "Nada por enquanto." }),
}));
vi.mock("@/modules/paciente/nome-do-curador", () => ({
  nomeDoCuradorDoCaso: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/modules/paciente/experiencia-loader", () => ({
  loadPatientPerfil: vi.fn().mockResolvedValue(null),
  loadComoQuerSerCuidada: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/modules/paciente/reconhecimento-model", () => ({
  loadModeloDoReconhecimento: vi.fn().mockResolvedValue(null),
}));

// ---- Documentos, Perfil, Consentimentos (C5, C6, C7) -----------------------
vi.mock("@/modules/paciente/central-de-documentos-loader", () => ({
  carregarCentralDeDocumentos: () => carregarCentralDeDocumentosMock(),
}));
vi.mock("@/modules/profiles", () => ({
  getPatientProfile: vi.fn().mockResolvedValue(null),
  getCommunicationPreferences: vi.fn().mockResolvedValue({
    preferredChannel: "whatsapp",
    acceptsReminders: true,
  }),
  listPatientNotifications: vi.fn().mockResolvedValue([]),
  listPatientDocuments: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/modules/governanca/repository", () => ({
  carregarEstadoDeGovernanca: () => carregarEstadoDeGovernancaMock(),
  listarPedidosDoTitular: () => listarPedidosDoTitularMock(),
}));

// Importadas DEPOIS dos mocks, e são as próprias rotas.
const { default: RotaCuradoria } = await import("@/app/paciente/curadoria/page");
const { default: RotaHome } = await import("@/app/paciente/page");
const { default: RotaJornada } = await import("@/app/paciente/linha-do-tempo/page");
const { default: RotaDocumentos } = await import("@/app/paciente/documentos/page");
const { default: RotaPerfil } = await import("@/app/paciente/perfil/page");
const { default: RotaConsentimentos } = await import(
  "@/app/paciente/documentos-e-consentimentos/page"
);

const OPCOES = [
  { id: "op-a", professionalName: "Dra. Helena Monteiro" },
  { id: "op-b", professionalName: "Dr. Rafael Nogueira" },
  { id: "op-c", professionalName: "Dra. Marina Azevedo" },
];

function curadoriaEntregue() {
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
    decision: null,
  };
}

/** O link oficial, achado pelo NOME ACESSÍVEL — nunca pelo componente. */
function porta(container: HTMLElement = document.body) {
  return within(container).getAllByRole("link", { name: /Falar com a Aliviar/ });
}

/** A mensagem que o `href` carrega, decodificada. */
function assuntoDe(link: HTMLElement): string {
  return decodeURIComponent(link.getAttribute("href") ?? "");
}

beforeEach(() => {
  vi.clearAllMocks();
  listCaseIds.mockResolvedValue([]);
  loadCuradoriaRecord.mockResolvedValue(null);
  loadPatientCuradoriaMock.mockResolvedValue(null);
  carregarCentralDeDocumentosMock.mockResolvedValue([]);
  carregarEstadoDeGovernancaMock.mockResolvedValue({
    documentos: [],
    versoesPorDocumento: {},
    aceites: [],
    pendencias: [],
  });
  listarPedidosDoTitularMock.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("T-C-5 · as sete inserções, provadas pela rota", () => {
  it("C1 · /paciente/curadoria com Curadoria entregue — tópico `curadoria`", async () => {
    loadPatientCuradoriaMock.mockResolvedValue(curadoriaEntregue());

    render(await RotaCuradoria());

    const links = porta();
    expect(links.length, "a Mesa precisa oferecer a porta").toBeGreaterThanOrEqual(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de conversar sobre a minha Curadoria.");
    expect(assuntoDe(links[0]!)).toContain(`wa.me/${NUMERO_OFICIAL}`);
  });

  it("C2 · /paciente/curadoria vazia — a porta vive na `action` do estado vazio", async () => {
    // Sem Curadoria e sem entrega legada: é o estado de espera.
    render(await RotaCuradoria());

    expect(screen.getByText("Ainda não há relatórios aqui.")).toBeInTheDocument();
    const links = porta();
    expect(links, "esperar não pode ser esperar sozinha").toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de conversar sobre a minha Curadoria.");
    expect(screen.getByText("Sem pressa — responderemos.")).toBeInTheDocument();
  });

  it("C3 · /paciente — tópico `jornada`", async () => {
    render(await RotaHome());

    const links = porta();
    expect(links).toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de ajuda com a minha jornada na Aliviar.");
  });

  it("C4 · /paciente/linha-do-tempo — tópico `jornada`", async () => {
    render(await RotaJornada());

    const links = porta();
    expect(links).toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de ajuda com a minha jornada na Aliviar.");
  });

  it("C5 · /paciente/documentos — tópico `documento`", async () => {
    render(await RotaDocumentos());

    const links = porta();
    expect(links).toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Quero enviar um documento para a minha Curadoria.");
  });

  it("C6 · /paciente/perfil — tópico `jornada`", async () => {
    render(await RotaPerfil());

    const links = porta();
    expect(links).toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de ajuda com a minha jornada na Aliviar.");
  });

  it("C7 · /paciente/documentos-e-consentimentos — tópico `jornada`", async () => {
    render(await RotaConsentimentos());

    const links = porta();
    expect(links).toHaveLength(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de ajuda com a minha jornada na Aliviar.");
  });
});

describe("T-C-5 · o que a porta NUNCA carrega", () => {
  it("nenhuma rota escreve o número fora da fonte única, e nenhuma promete prazo", async () => {
    const rotas = [
      ["curadoria", RotaCuradoria],
      ["home", RotaHome],
      ["jornada", RotaJornada],
      ["documentos", RotaDocumentos],
      ["perfil", RotaPerfil],
      ["consentimentos", RotaConsentimentos],
    ] as const;

    for (const [nome, montar] of rotas) {
      const { container } = render(await montar());

      for (const link of porta(container)) {
        // O número vem de `ALIVIAR_WHATSAPP`; se alguém escrever outro na
        // página, o href deixa de bater com o oficial.
        expect(link.getAttribute("href"), `${nome}: número fora da fonte única`).toContain(
          `wa.me/${NUMERO_OFICIAL}`,
        );
        // A mensagem diz o ASSUNTO — nunca conteúdo, identificador ou nome.
        const assunto = assuntoDe(link);
        for (const termo of ["case-1", "sel-1", "paciente-1", "Helena", "Rafael", "Marina"]) {
          expect(assunto, `${nome}: a mensagem carrega dado da paciente (${termo})`).not.toContain(
            termo,
          );
        }
      }

      const texto = container.textContent ?? "";
      for (const promessa of ["horário de atendimento", "responderemos em", "24h", "48h"]) {
        expect(texto.toLowerCase(), `${nome}: promessa de prazo`).not.toContain(
          promessa.toLowerCase(),
        );
      }

      cleanup();
    }
  });
});

describe("T-C-6 · a porta da Mesa fica ACIMA da decisão", () => {
  it("na ordem do documento, o contato precede a superfície de decisão", async () => {
    loadPatientCuradoriaMock.mockResolvedValue(curadoriaEntregue());

    const { container } = render(await RotaCuradoria());

    const link = porta(container)[0]!;
    const decisao = within(container).getByText("A decisão");

    // `compareDocumentPosition`: 4 = o argumento vem DEPOIS do nó de origem.
    // Abaixo da escolha há vazio deliberado (CaminhosPanel) — preencher ali é
    // empurrar. O lugar certo é a faixa de material de consulta.
    expect(
      link.compareDocumentPosition(decisao) & Node.DOCUMENT_POSITION_FOLLOWING,
      "o contato precisa vir antes da decisão na ordem do documento",
    ).toBeTruthy();
  });
});
