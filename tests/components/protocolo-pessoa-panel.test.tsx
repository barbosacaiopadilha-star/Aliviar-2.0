import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProtocoloPessoaPanel } from "@/components/curadoria/protocolo-pessoa-panel";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import type { CaseNeedRecord } from "@/modules/curadoria/protocolos-repository";

vi.mock("@/modules/curadoria/protocolos-actions", () => ({
  registerPersonNeedAction: vi.fn(async () => ({ success: true })),
  acknowledgePersonNeedAction: vi.fn(async () => ({ success: true })),
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

describe("MesaEvidenciasPanel", () => {
  it("fala do estado da informação — nunca de correspondência", () => {
    render(
      <MesaEvidenciasPanel
        professionals={[{ professionalProfileId: "prof-1", displayName: "Dra. A" }]}
        evidencias={{
          "prof-1": {
            registrados: 5,
            verificados: 2,
            declarados: 2,
            divergentes: 1,
            desatualizados: 0,
            revisaoPendente: 1,
          },
        }}
      />,
    );

    expect(screen.getByText("5 conceitos com informação")).toBeInTheDocument();
    expect(screen.getByText("2 com informação verificada")).toBeInTheDocument();
    expect(screen.getByText("2 apenas declaradas")).toBeInTheDocument();
    expect(screen.getByText("1 com divergência aberta")).toBeInTheDocument();
    expect(screen.getByText("1 com verificação vencida")).toBeInTheDocument();
    // Vocabulário de correspondência não aparece aqui — é outra camada.
    expect(document.body.textContent).not.toMatch(/atende|compatível|não atende/i);
  });

  it("sem evidência, diz isso — nunca inventa estado", () => {
    render(
      <MesaEvidenciasPanel
        professionals={[{ professionalProfileId: "prof-2", displayName: "Dr. B" }]}
        evidencias={{}}
      />,
    );
    expect(screen.getByText("Nenhuma evidência de prática registrada ainda.")).toBeInTheDocument();
  });
});
