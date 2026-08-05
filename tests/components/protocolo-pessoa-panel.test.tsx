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
    degree: "PESA_MUITO",
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
  it("traducao pendente mostra a leitura proposta e diz de quem e o ato", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);

    expect(screen.getByText(/Leitura proposta: Pelo que você me contou/)).toBeInTheDocument();
    expect(screen.getByText("Aguardando o reconhecimento dela")).toBeInTheDocument();
    expect(screen.getByText(/O desfecho é ato da paciente/)).toBeInTheDocument();
  });

  /**
   * PP-03C — AQUI HAVIA DOIS TESTES DOS BOTOES DE DESFECHO.
   *
   * "Reconheceu", "Corrigiu" e "Recusou" gravavam, pela mao do Curador, o ato
   * que o Metodo reserva a paciente. O segundo teste protegia o DT-22 naquele
   * formulario (corrigir sem texto ficava desabilitado) — regra que continua
   * viva, mas agora na RPC e no CHECK do banco, e verificada em
   * tests/unit/desfechos-do-reconhecimento.test.ts.
   *
   * O painel do Curador nao tem mais o que testar aqui porque nao tem mais o
   * que escrever aqui.
   */
  it("o painel do Curador nao oferece nenhum desfecho", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);

    for (const botao of ["Reconheceu", "Corrigiu", "Recusou"]) {
      expect(screen.queryByRole("button", { name: botao }), botao).not.toBeInTheDocument();
    }
    expect(screen.queryByLabelText("Correcao dela")).not.toBeInTheDocument();
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
    expect(screen.getAllByRole("button", { name: "Registrar conversa" })).toHaveLength(15);
  });

  it("a contagem é de conversas — sem percentual", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);
    expect(screen.getByText("1 de 15 conversas registradas")).toBeInTheDocument();
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

/**
 * ITEM 1.10C-A — O RETORNO DOS DESFECHOS AO CURADOR.
 *
 * Desde o PP-03C ela discorda por conta própria. Antes deste bloco, ele só
 * descobria isso rolando o Protocolo inteiro até topar com um estado diferente
 * — e uma discordância no fim da lista atravessava a Curadoria sem ninguém ver.
 */
describe("1.10C-A · o que ela respondeu, antes de qualquer outra coisa", () => {
  it("A5 · sem nada a revisar, o bloco NÃO some — ele diz que não há", () => {
    render(<ProtocoloPessoaPanel caseId="case-1" needs={[need()]} />);

    expect(screen.getByText("Respostas dela que exigem revisão")).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma resposta da paciente exige revisão neste momento."),
    ).toBeInTheDocument();
  });

  it("A4 · PENDENTE e RECONHECIDA nunca aparecem como pendência dele", () => {
    render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[
          need(),
          need({ subcriterionCode: "MODELO_COMUNICACAO", acknowledgment: "RECONHECIDA" }),
        ]}
      />,
    );

    expect(
      screen.getByText("Nenhuma resposta da paciente exige revisão neste momento."),
    ).toBeInTheDocument();
  });

  it("A2 · o texto dela aparece inteiro, sem corte", () => {
    const texto =
      "Não foi isso. Eu disse que aceito conversar sobre cirurgia, mas só depois de seis meses " +
      "de tratamento clínico, e com a minha irmã junto na consulta.";

    render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[need({ acknowledgment: "RECUSADA", correction: texto })]}
      />,
    );

    expect(screen.getByText(`Ela disse: ${texto}`)).toBeInTheDocument();
    expect(screen.getByText(/Sua leitura: Pelo que você me contou/)).toBeInTheDocument();
  });

  it("A1 · RECUSADA aparece antes de CORRIGIDA no bloco de revisão", () => {
    const { container } = render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[
          need({ subcriterionCode: "MODELO_COMUNICACAO", acknowledgment: "CORRIGIDA", correction: "quase isso" }),
          need({ acknowledgment: "RECUSADA", correction: "nao foi isso" }),
        ]}
      />,
    );

    const texto = container.textContent ?? "";
    expect(texto.indexOf("nao foi isso")).toBeLessThan(texto.indexOf("quase isso"));
    expect(screen.getByText("Ela discordou desta leitura")).toBeInTheDocument();
    expect(screen.getByText("Ela corrigiu esta leitura")).toBeInTheDocument();
  });

  it("A1 · a lista do Protocolo sobe o conceito contestado, sem perder nenhum", () => {
    const { container } = render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[need({ subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO", acknowledgment: "RECUSADA", correction: "nao" })]}
      />,
    );

    const itens = container.querySelectorAll("ul > li.rounded.border");
    // Nenhuma pergunta some do painel dele.
    expect(itens.length).toBe(17);
    // E a contestada é a primeira da lista.
    expect(itens[0]!.textContent).toContain("P16");
  });

  it("A7 · o bloco de revisão é só leitura — nenhum botão nasce dele", () => {
    render(
      <ProtocoloPessoaPanel
        caseId="case-1"
        needs={[need({ acknowledgment: "RECUSADA", correction: "nao foi isso" })]}
      />,
    );

    const bloco = screen.getByText("Respostas dela que exigem revisão").closest("section")!;
    expect(bloco.querySelectorAll("button")).toHaveLength(0);
  });
});
