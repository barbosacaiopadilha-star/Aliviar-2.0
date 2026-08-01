import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionProgressPanel } from "@/components/patient/connection-progress-panel";
import { ContactModePanel } from "@/components/patient/contact-mode-panel";
import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { ConnectionRecord } from "@/modules/connection/types";
import type { RelationshipRecord } from "@/modules/relationship";

/**
 * Guardas da Continuidade (Onda 1): a varanda nunca celebra, nunca promete
 * prazo, nunca afirma que alguém foi avisado, nunca fala a língua do
 * workflow. Fatos e promessas ficam separados — se qualquer estado voltar a
 * dizer "avisamos", "em breve" ou "parabéns", um destes casos quebra.
 */

vi.mock("@/modules/connection/actions", () => ({
  closeWithoutRelationshipAction: vi.fn(),
  confirmFirstAppointmentAction: vi.fn(),
  registerContactIntentAction: vi.fn(),
  defineContactModeAction: vi.fn(),
  correctChoiceAction: vi.fn(),
  createConnectionAction: vi.fn(),
}));
vi.mock("@/modules/relationship/actions", () => ({
  declarePlannedRelationshipClosureAction: vi.fn(),
  declareRelationshipInterruptionAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(cleanup);

const PRESENTATIONS: ProviderPresentation[] = [
  {
    providerId: "prof-1",
    displayName: "Ana Profissional",
    professionalSummary: "",
    whyIncluded: "",
    strengthsForThisCase: [],
    relevantLimitations: [],
    practicalConsiderations: [],
  },
];

function buildConnection(overrides: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    id: "conn-1",
    caseId: "case-1",
    patientProfileId: "patient-1",
    professionalProfileId: "prof-1",
    curatedSelectionId: "sel-1",
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  } as ConnectionRecord;
}

const RELATIONSHIP: RelationshipRecord = {
  id: "rel-1",
  connectionId: "conn-1",
  caseId: "case-1",
  patientProfileId: "patient-1",
  professionalProfileId: "prof-1",
  status: "ATIVO",
  startedAt: "2026-07-15T10:00:00.000Z",
  createdAt: "2026-07-15T10:00:00.000Z",
  updatedAt: "2026-07-15T10:00:00.000Z",
} as RelationshipRecord;

/** Nada de celebração, prazo, aviso de terceiro ou língua de sistema. */
const PROIBIDOS = [
  "parabéns",
  "sucesso",
  "ótima escolha",
  "foi avisado",
  "foi notificado",
  "avisamos",
  "em breve",
  "prazo",
  "aguarde",
  "processando",
  "workflow",
  "ticket",
  "pendente",
  "responsável atribuído",
  "vínculo anterior",
  "evento registrado",
];

function assertVocabulario(texto: string, contexto: string) {
  const lower = texto.toLowerCase();
  for (const proibido of PROIBIDOS) {
    expect(lower, `"${proibido}" vazou em ${contexto}`).not.toContain(proibido);
  }
}

describe("Continuidade — fatos sem celebração, sem promessa, sem workflow", () => {
  it("todos os estados da Connection falam a língua da casa", () => {
    for (const status of [
      "DECISAO_REGISTRADA",
      "CONTATO_INICIADO",
      "PRIMEIRO_ATENDIMENTO_REALIZADO",
      "ENCERRADO_SEM_RELACIONAMENTO",
    ] as const) {
      const { container, unmount } = render(
        <ConnectionProgressPanel
          caseId="case-1"
          connection={buildConnection({ status })}
          providerPresentations={PRESENTATIONS}
        />,
      );
      assertVocabulario(container.textContent ?? "", `Connection ${status}`);
      // Nenhum enum ou identificador técnico atravessa a tela.
      expect(container.textContent).not.toMatch(/[A-Z]{3,}_[A-Z_]{3,}|conn-\d|case-\d/);
      unmount();
    }
  });

  it("o modo de contato nasce sem valor pré-selecionado e sem 'recomendado'", () => {
    const { container } = render(
      <ContactModePanel caseId="case-1" connection={buildConnection()} />,
    );
    // Declaração, nunca formulário: não há radio nem checkbox — e nenhuma
    // opção vem marcada ou rotulada como melhor.
    expect(container.querySelector("input")).toBeNull();
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["recomendado", "mais rápido", "mais seguro", "preferencial", "ideal"]) {
      expect(texto, `veredito de modo: ${proibido}`).not.toContain(proibido);
    }
    assertVocabulario(container.textContent ?? "", "ContactModePanel");
  });

  it("Relationship ATIVO transmite continuidade — nunca conclusão", () => {
    const { container } = render(
      <RelationshipStatusPanel
        caseId="case-1"
        relationship={RELATIONSHIP}
        providerPresentations={PRESENTATIONS}
      />,
    );
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["concluída", "finalizado", "missão cumprida", "jornada concluída"]) {
      expect(texto, `conclusão vazou: ${proibido}`).not.toContain(proibido);
    }
    assertVocabulario(container.textContent ?? "", "Relationship ATIVO");
  });
});
