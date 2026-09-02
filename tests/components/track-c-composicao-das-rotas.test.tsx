import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALIVIAR_WHATSAPP } from "@/components/curadoria/whatsapp-contact";

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

// O número vem da FONTE ÚNICA, nunca repetido aqui: até 01/09 cada spec
// carregava o literal, e trocá-lo (ADR-111) obrigaria a caçar todos.
const NUMERO_OFICIAL = ALIVIAR_WHATSAPP;

const listCaseIds = vi.fn();
const loadCuradoriaRecord = vi.fn();
const loadPatientCuradoriaMock = vi.fn();
const carregarCentralDeDocumentosMock = vi.fn();
const carregarEstadoDeGovernancaMock = vi.fn();
const listarPedidosDoTitularMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  // MERGE DE 23/08 · duas rotas viraram redirect (curadoria → início;
  // consentimentos → documentos). O mock lança como o Next real lança.
  redirect: (destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  },
}));
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
// MERGE DE 23/08 · o Início carrega a jornada antes da Mesa; para a C1 (home
// com Curadoria entregue) basta uma jornada mínima e estável.
vi.mock("@/modules/curadoria/jornada", () => ({
  buildJornada: () => ({
    currentStage: "DOSSIE",
    curatorName: "Curadora do Case",
    currentResponsible: { name: "Equipe Aliviar" },
  }),
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
  // `queryAll` (não `getAll`): desde 24/08 a porta da casa mora no shell, e
  // uma PÁGINA sem porta própria é estado legítimo — zero não é erro.
  return within(container).queryAllByRole("link", { name: /Falar com a Aliviar/ });
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
  /**
   * MERGE DE 23/08 · a Curadoria vive no Início. C1 é provada em `/paciente`:
   * com Curadoria entregue, a porta da Mesa (tópico `curadoria`) está lá — e
   * a porta genérica da jornada sai de cena, para não haver duas portas
   * idênticas na mesma página. Os mocks do Início (record + jornada) entram
   * porque a rota agora carrega o estado antes da Mesa.
   */
  it("C1 · /paciente com Curadoria entregue — tópico `curadoria`", async () => {
    listCaseIds.mockResolvedValue(["case-1"]);
    loadCuradoriaRecord.mockResolvedValue({ caseId: "case-1" });
    loadPatientCuradoriaMock.mockResolvedValue(curadoriaEntregue());

    render(await RotaHome());

    const links = porta();
    expect(links.length, "a Mesa precisa oferecer a porta").toBeGreaterThanOrEqual(1);
    expect(assuntoDe(links[0]!)).toContain("Oi! Gostaria de conversar sobre a minha Curadoria.");
    expect(assuntoDe(links[0]!)).toContain(`wa.me/${NUMERO_OFICIAL}`);
  });

  it("C2 · /paciente/curadoria redireciona — nenhuma tela morta", () => {
    expect(() => RotaCuradoria()).toThrow("NEXT_REDIRECT:/paciente");
  });

  /**
   * 2ª emenda de 24/08 ("não quero Concierge lá embaixo") · a porta da casa
   * mora no CABEÇALHO do PatientShell, presente em toda tela — o Início
   * deixou de carregar porta própria fora da Mesa. O que este oráculo
   * guarda: sem Curadoria, a página não inventa porta solta (a do shell é
   * provada em `track-c-alcancabilidade`).
   */
  it("C3 · /paciente sem Curadoria — nenhuma porta solta; a do shell cobre", async () => {
    render(await RotaHome());

    expect(
      within(document.body).queryAllByRole("link", { name: /Falar com a Aliviar/ }),
    ).toHaveLength(0);
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

  /**
   * MERGE DE 23/08 · os consentimentos vivem dentro da central de Documentos
   * (dobra "Seus consentimentos"), e a rota antiga redireciona — o direito
   * do titular não muda de natureza por mudar de endereço.
   */
  it("C7 · consentimentos em /paciente/documentos; a rota antiga redireciona", async () => {
    render(await RotaDocumentos());
    expect(screen.getByText("Seus consentimentos")).toBeInTheDocument();
    expect(screen.getByText("Seu histórico")).toBeInTheDocument();

    expect(() => RotaConsentimentos()).toThrow("NEXT_REDIRECT:/paciente/documentos");
  });
});

describe("T-C-5 · o que a porta NUNCA carrega", () => {
  it("nenhuma rota escreve o número fora da fonte única, e nenhuma promete prazo", async () => {
    // MERGE DE 23/08 · curadoria e consentimentos viraram redirects e saem
    // da varredura — o conteúdo delas é varrido nas rotas que o abrigam
    // (home e documentos).
    const rotas = [
      ["home", RotaHome],
      ["jornada", RotaJornada],
      ["documentos", RotaDocumentos],
      ["perfil", RotaPerfil],
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
    // MERGE DE 23/08 · a composição vive no Início.
    listCaseIds.mockResolvedValue(["case-1"]);
    loadCuradoriaRecord.mockResolvedValue({ caseId: "case-1" });
    loadPatientCuradoriaMock.mockResolvedValue(curadoriaEntregue());

    const { container } = render(await RotaHome());

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
