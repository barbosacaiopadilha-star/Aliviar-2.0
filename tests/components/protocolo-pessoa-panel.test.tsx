import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtocoloPessoaPanel } from "@/components/curadoria/protocolo-pessoa-panel";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import type { CaseNeedRecord } from "@/modules/curadoria/protocolos-repository";
import type { PracticeEvidenceRecord } from "@/modules/curadoria/evidencias-pratica-repository";

vi.mock("@/modules/curadoria/protocolos-actions", () => ({
  registerPersonNeedAction: vi.fn(async () => ({ success: true })),
  acknowledgePersonNeedAction: vi.fn(async () => ({ success: true })),
}));

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
 * PROTOCOLO DA PESSOA + BASE NA MESA — contratos de tela.
 *
 * O que se pina: tradução pendente pede o ato dela (reconhecer/corrigir/
 * recusar); a leitura proposta aparece separada da resposta; declaração
 * clínica não abre formulário; e o painel de evidências fala do estado da
 * INFORMAÇÃO — nunca "atende"/"não atende", que é correspondência.
 */

function need(overrides: Partial<CaseNeedRecord> = {}): CaseNeedRecord {
  return {
    caseId: "case-1",
    subcriterionCode: "CONTINUIDADE_RETORNOS",
    options: ["RETORNO_JA_MARCADO_AO_SAIR"],
    degree: "IMPORTANTE",
    flexibility: null,
    guidedText: null,
    origin: "TRADUCAO",
    proposedReading: "Pelo que você me contou, entendi que quer sair com o retorno marcado. É isso?",
    acknowledgment: "PENDENTE",
    correction: null,
    declaredBy: "curador-1",
    declaredAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("ProtocoloPessoaPanel", () => {
  it("tradução pendente mostra a leitura proposta e pede o ato dela", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);

    expect(screen.getByText(/Leitura proposta: Pelo que você me contou/)).toBeInTheDocument();
    expect(screen.getByText("Aguardando o reconhecimento dela")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconheceu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recusou" })).toBeInTheDocument();
  });

  it("'Corrigiu' fica desabilitado sem o texto da correção — correção sem texto não é correção", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);

    const corrigiu = screen.getByRole("button", { name: "Corrigiu" });
    expect(corrigiu).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Correção dela"), {
      target: { value: "Prefere retorno conforme a evolução." },
    });
    expect(screen.getByRole("button", { name: "Corrigiu" })).not.toBeDisabled();
  });

  it("resposta corrigida exibe a correção nas palavras dela, separada da leitura", () => {
    render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[need({ acknowledgment: "CORRIGIDA", correction: "Prefere conforme a evolução." })]}
      />,
    );
    expect(screen.getByText("Corrigida por ela")).toBeInTheDocument();
    expect(screen.getByText(/Correção dela: Prefere conforme a evolução/)).toBeInTheDocument();
    expect(screen.getByText(/Leitura proposta:/)).toBeInTheDocument();
  });

  it("declaração clínica não oferece formulário de conversa", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[]} />);
    const badges = screen.getAllByText("Declaração clínica do Curador");
    expect(badges).toHaveLength(2); // P8 e P9
    // Os botões de registrar existem só para as 14 perguntas.
    expect(screen.getAllByRole("button", { name: "Registrar conversa" })).toHaveLength(14);
  });

  it("a contagem é de conversas — sem percentual", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);
    expect(screen.getByText("1 de 14 conversas registradas")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/%/);
  });
});

function evidenceRow(overrides: Partial<PracticeEvidenceRecord> = {}): PracticeEvidenceRecord {
  return {
    id: "ev-1",
    professionalProfileId: "prof-1",
    subcriterionCode: "CONTINUIDADE_CANAIS",
    catalogVersion: "1.0.0",
    version: 1,
    options: ["MENSAGEM_COM_EQUIPE_OU_SECRETARIA"],
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
    expect(screen.getByText("1 de 28 conceitos com informação")).toBeInTheDocument();
    expect(screen.getByText("1 apenas declaradas")).toBeInTheDocument();
    expect(screen.getByText("27 sem informação")).toBeInTheDocument();
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
              options: ["FAIXA_ATE_300"],
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
