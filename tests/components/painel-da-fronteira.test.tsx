import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PainelDaFronteira } from "@/components/curadoria/fronteira/painel-da-fronteira";
import type { ItemDaFronteira } from "@/modules/curadoria/fronteira-do-mapa-repository";

/**
 * ITEM 2.C — A2c, O2-A e O2-B COMO TESTES DE COMPONENTE (aceites bloqueantes).
 *
 * A2c: os NOVE elementos renderizados antes de qualquer ato. O2-A: confirmar
 * e recusar custam o MESMO número de interações (um clique cada). O2-B: os
 * dois controles têm a MESMA proeminência — botões irmãos no mesmo contêiner,
 * nenhum em menu, nenhum depreciado. Motivo: oferecido aos DOIS, exigido de
 * nenhum. E nada nasce pré-marcado (A2d na apresentação).
 */

type EntradaDoAto = { proposalId: string; motivo?: string | null };

const confirmarMock = vi.fn(async (_entrada: EntradaDoAto) => ({
  desfecho: "ATO_REGISTRADO" as const,
}));
const recusarMock = vi.fn(async (_entrada: EntradaDoAto) => ({
  desfecho: "ATO_REGISTRADO" as const,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/curadoria/fronteira-do-mapa-actions", () => ({
  confirmarItemDaFronteiraAction: (entrada: EntradaDoAto) => confirmarMock(entrada),
  recusarItemDaFronteiraAction: (entrada: EntradaDoAto) => recusarMock(entrada),
}));

afterEach(cleanup);
beforeEach(() => {
  confirmarMock.mockClear();
  recusarMock.mockClear();
});

const ITEM: ItemDaFronteira = {
  proposalId: "prop-1",
  professionalProfileId: "prof-1",
  professionalName: "Dra. Fronteira",
  subcriterionCode: "MODELO_COMUNICACAO",
  conceptName: "Comunicação com a pessoa",
  suggestedStatus: "CONFIRMADO",
  origem: {
    record: "practice_evidence:ev-1",
    version: "1",
    declaredAt: "2026-08-08T12:00:00Z",
    author: "coletor-1",
    resumo: "ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR",
    verificationStatus: "nao_verificado",
  },
  regra: { ruleId: "regra-x", ruleVersion: 3, catalogVersion: "1.1.0", emittedAt: "2026-08-08T12:30:00Z" },
  state: "PROPOSTA",
  ato: null,
  mapaAtual: null,
  julgamentoVigente: { conclusao: "Juízo vigente de leitura.", versao: 2 },
};

describe("A2c · os nove elementos — a decisão nunca aparece sem a proveniência (G-2.C-4)", () => {
  it("elementos 1–4: declaração original, proposta, origem e regra+versão, das fontes", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    const declaracao = screen.getByTestId("declaracao-original");
    expect(declaracao.textContent).toContain("ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR");
    expect(declaracao.textContent).toContain("practice_evidence:ev-1");
    expect(declaracao.textContent).toContain("v1");
    expect(screen.getByTestId("proposta").textContent).toContain("CONFIRMADO");
    expect(screen.getByTestId("origem")).toBeTruthy();
    const regra = screen.getByTestId("regra");
    expect(regra.textContent).toContain("regra-x");
    expect(regra.textContent).toContain("v3");
  });

  it("elemento 5: os dois atos presentes; elementos 8–9: pendente é leitura e nada avança sem ato", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    expect(screen.getByRole("button", { name: "Confirmar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeTruthy();
    expect(screen.getByTestId("desfecho").textContent).toContain("Aguardando decisão");
    // Nada pré-marcado, nenhum ato disparado na renderização (A2d).
    expect(confirmarMock).not.toHaveBeenCalled();
    expect(recusarMock).not.toHaveBeenCalled();
  });

  it("elementos 6–7: autoria e data aparecem quando o item foi decidido", () => {
    render(
      <PainelDaFronteira
        itens={[
          {
            ...ITEM,
            state: "CONFIRMADA",
            ato: { natureza: "CONFIRMACAO", actorName: "Admin Um", actedAt: "2026-08-08T14:00:00Z" },
          },
        ]}
      />,
    );
    const autoria = screen.getByTestId("autoria-do-ato");
    expect(autoria.textContent).toContain("Confirmada por Admin Um");
  });

  it("o julgamento associado aparece como LEITURA — nunca edição", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    expect(screen.getByTestId("julgamento-associado").textContent).toContain("Juízo vigente de leitura.");
  });
});

describe("O2-A · mesmo número de interações até cada desfecho — bloqueante", () => {
  it("UM clique confirma; UM clique recusa — e cada ato leva exatamente um proposal_id", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(confirmarMock).toHaveBeenCalledTimes(1);
    expect(confirmarMock).toHaveBeenCalledWith({ proposalId: "prop-1", motivo: null });

    cleanup();
    render(<PainelDaFronteira itens={[ITEM]} />);
    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    expect(recusarMock).toHaveBeenCalledTimes(1);
    expect(recusarMock).toHaveBeenCalledWith({ proposalId: "prop-1", motivo: null });
  });

  it("o motivo é OFERECIDO aos dois e exigido de nenhum: ato sem motivo é válido nos dois lados", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    const campo = screen.getByLabelText("Motivo (opcional para os dois atos)") as HTMLInputElement;
    expect(campo.value).toBe("");
    fireEvent.change(campo, { target: { value: "li a proveniência inteira" } });
    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    expect(recusarMock).toHaveBeenCalledWith({ proposalId: "prop-1", motivo: "li a proveniência inteira" });
  });
});

describe("O2-B · mesma proeminência — bloqueante", () => {
  it("os dois controles são botões IRMÃOS no mesmo contêiner, com as mesmas classes", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    const container = screen.getByTestId("atos-prop-1");
    const botoes = Array.from(container.querySelectorAll("button"));
    expect(botoes).toHaveLength(2);
    expect(botoes[0].textContent).toBe("Confirmar");
    expect(botoes[1].textContent).toBe("Recusar");
    expect(botoes[0].className).toBe(botoes[1].className);
    expect(botoes[0].parentElement).toBe(botoes[1].parentElement);
  });

  it("a recusa não vive em menu, dropdown ou details — nem escondida, nem depreciada", () => {
    render(<PainelDaFronteira itens={[ITEM]} />);
    const recusar = screen.getByRole("button", { name: "Recusar" });
    let ancestral = recusar.parentElement;
    while (ancestral) {
      expect(["DETAILS", "MENU", "SELECT"].includes(ancestral.tagName)).toBe(false);
      ancestral = ancestral.parentElement;
    }
    expect(recusar.hasAttribute("hidden")).toBe(false);
    expect((recusar as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("vazio-honesto · a ausência de propostas é dita — e lida como alarme, não sucesso (R-1)", () => {
  it("sem itens, o painel explica o vazio e nomeia a leitura de R-1", () => {
    render(<PainelDaFronteira itens={[]} />);
    const vazio = screen.getByTestId("fronteira-vazia");
    expect(vazio.textContent).toContain("vazio-honesto");
    expect(vazio.textContent).toContain("não é sucesso");
  });
});
