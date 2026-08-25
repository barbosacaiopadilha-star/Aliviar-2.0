import { cleanup, render, screen, fireEvent } from "@testing-library/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import type { PracticeEvidenceRecord } from "@/modules/curadoria/evidencias-pratica-repository";

vi.mock("@/modules/curadoria/evidencias-actions", () => ({
  verifyEvidenceAction: vi.fn(async () => ({ success: true })),
  markEvidenceOutdatedAction: vi.fn(async () => ({ success: true })),
  openEvidenceDivergenceAction: vi.fn(async () => ({ success: true })),
  resolveEvidenceDivergenceAction: vi.fn(async () => ({ success: true })),
  requestPracticeUpdateAction: vi.fn(async () => ({ success: true })),
  loadEvidenceHistoryAction: vi.fn(async () => ({ success: true, history: [] })),
}));

afterEach(cleanup);


/**
 * A BASE DE EVIDÊNCIAS NA MESA — abertura progressiva.
 *
 * O painel do Protocolo da Pessoa saiu junto com a Mesa antiga (ADR-093): na
 * Mesa nova, cada resposta dela mora na LINHA da própria frase, e o desfecho
 * do reconhecimento — inclusive quando ela recusa ou corrige — aparece ali,
 * não num painel separado. O que este arquivo continua guardando é o contrato
 * do painel de evidências, que atravessou a mudança inteiro.
 */
function evidenceRow(overrides: Partial<PracticeEvidenceRecord> = {}): PracticeEvidenceRecord {
  return {
    id: "ev-1",
    professionalProfileId: "prof-1",
    subcriterionCode: "CONTINUIDADE_CANAIS",
    catalogVersion: "1.0.0",
    version: 1,
    options: ["MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA"],
    details: {},
    conditionNote: null,
    observation: null,
    sourceTier: "INSTITUCIONAL",
    source: "Autodeclaração pelo Protocolo da Prática Profissional",
    collectedAt: "2026-08-01T10:00:00.000Z",
    collectedBy: "profissional-uuid",
    status: "nao_verificado",
    verifiedAt: null,
    verifiedBy: null,
    verificationSource: null,
    ...overrides,
  };
}

const CAN_ALL = {
  verify: true,
  openDivergence: true,
  requestUpdate: true,
  resolveDivergence: true,
  markOutdated: true,
};
const CAN_CURADOR = { ...CAN_ALL, verify: false, resolveDivergence: false, markOutdated: false };
const AGORA = "2026-08-01T12:00:00.000Z";

describe("MesaEvidenciasPanel — abertura progressiva", () => {
  it("nível 1 resume por contagem e nunca usa linguagem de correspondência", () => {
    render(
      <MesaEvidenciasPanel
        caseId="case-1"
        professionals={[{ professionalProfileId: "prof-1", displayName: "Dra. A" }]}
        rows={{ "prof-1": [evidenceRow()] }}
        divergences={[]}
        updateRequests={[]}
        can={CAN_ALL}
        nowIso={AGORA}
      />,
    );
    expect(screen.getByText("1 de 29 conceitos com informação")).toBeInTheDocument();
    expect(screen.getByText("1 apenas declaradas")).toBeInTheDocument();
    expect(screen.getByText("28 sem informação")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/atende|compatível|não atende|score|ranking|%/i);
  });

  it("nível 2 abre por conceito com estado e validade; nível 3 abre o detalhe com a ação de verificar", () => {
    render(
      <MesaEvidenciasPanel
        caseId="case-1"
        professionals={[{ professionalProfileId: "prof-1", displayName: "Dra. A" }]}
        rows={{ "prof-1": [evidenceRow()] }}
        divergences={[]}
        updateRequests={[]}
        can={CAN_ALL}
        nowIso={AGORA}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver por conceito" }));
    expect(screen.getByText("Canais entre consultas")).toBeInTheDocument();
    expect(screen.getByText("Declarado, ainda não verificado")).toBeInTheDocument();
    expect(screen.getByText("Sem data suficiente para avaliar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir detalhe" }));
    expect(
      screen.getByText(/Você está verificando esta versão específica da informação/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assinar verificação" })).toBeInTheDocument();
  });

  it("sem permissão de verificar, a assinatura não aparece — mas divergência e solicitação sim", () => {
    render(
      <MesaEvidenciasPanel
        caseId="case-1"
        professionals={[{ professionalProfileId: "prof-1", displayName: "Dra. A" }]}
        rows={{ "prof-1": [evidenceRow()] }}
        divergences={[]}
        updateRequests={[]}
        can={CAN_CURADOR}
        nowIso={AGORA}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver por conceito" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir detalhe" }));

    expect(screen.queryByRole("button", { name: "Assinar verificação" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir divergência" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar pendência" })).toBeInTheDocument();
  });

  it("verificação vencida aparece como estado da informação, vindo do cálculo", () => {
    render(
      <MesaEvidenciasPanel
        caseId="case-1"
        professionals={[{ professionalProfileId: "prof-1", displayName: "Dra. A" }]}
        rows={{
          "prof-1": [
            evidenceRow({
              subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO",
              // Estrutura por campos do catálogo aprovado: custo não achata
              // faixa em options[] — a faixa vive no campo details.faixa.
              options: [],
              details: { faixa: "ATE_300" },
              status: "verificado",
              verifiedAt: "2026-04-01T00:00:00.000Z",
              verifiedBy: "admin-uuid",
              verificationSource: "Confirmação com a secretaria",
            }),
          ],
        }}
        divergences={[]}
        updateRequests={[]}
        can={CAN_ALL}
        nowIso={AGORA}
      />,
    );
    expect(screen.getByText("1 com verificação vencida")).toBeInTheDocument();
  });
});
