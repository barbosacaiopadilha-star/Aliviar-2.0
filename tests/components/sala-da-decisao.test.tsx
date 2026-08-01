import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import type { ProviderPresentation } from "@/modules/ace/artifacts/final-curadoria";
import type { ConnectionRecord } from "@/modules/connection/types";

/**
 * A Sala da Decisão — guardas da Onda 2.
 *
 * O que estes casos protegem, e por quê: as quatro verdades precedem o ato
 * (SD-O1), o ato é único e nomeado (SD-O2/SD-P3), nada celebra nem atesta
 * prontidão (SD-N9/N9-A_DECISAO), nenhuma frase promete o que ninguém
 * garante (SD-N3), e a janela de troca é dita pelo marco — nunca como
 * reversibilidade geral (SD-N5, §6.4).
 */

const { createConnectionActionMock, correctChoiceActionMock, routerRefreshMock } = vi.hoisted(
  () => ({
    createConnectionActionMock: vi.fn(),
    correctChoiceActionMock: vi.fn(),
    routerRefreshMock: vi.fn(),
  }),
);

vi.mock("@/modules/connection/actions", () => ({
  createConnectionAction: createConnectionActionMock,
  correctChoiceAction: correctChoiceActionMock,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: routerRefreshMock }) }));

afterEach(cleanup);
beforeEach(() => {
  createConnectionActionMock.mockReset();
  correctChoiceActionMock.mockReset();
  routerRefreshMock.mockReset();
});

const CASE_ID = "case-1";

const PRESENTATIONS: ProviderPresentation[] = [
  "Ana Profissional",
  "Bruno Profissional",
  "Carla Profissional",
].map((displayName, index) => ({
  providerId: `provider-${index}`,
  displayName,
  professionalSummary: "",
  whyIncluded: "",
  strengthsForThisCase: [],
  relevantLimitations: [],
  practicalConsiderations: [],
}));

function buildConnection(overrides: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    id: "connection-1",
    caseId: CASE_ID,
    anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: "delivery-1" },
    patientProfileId: "patient-1",
    professionalProfileId: "provider-0",
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    decidedAt: "2026-07-15T10:00:00.000Z",
    createdAt: "2026-07-15T10:00:00.000Z",
    updatedAt: "2026-07-15T10:00:00.000Z",
    ...overrides,
  };
}

async function atravessarOLimiar() {
  const user = userEvent.setup();
  render(
    <ConnectionChoicePanel
      caseId={CASE_ID}
      providerPresentations={PRESENTATIONS}
      connection={null}
    />,
  );
  await user.click(screen.getByRole("radio", { name: "Ana Profissional" }));
  await user.click(screen.getByRole("button", { name: "Quero seguir com Ana Profissional" }));
  return user;
}

describe("Sala da Decisão — as quatro verdades antes do ato", () => {
  it("diz o alcance real: registrado e visível, sem consulta, horário ou contato", async () => {
    await atravessarOLimiar();

    expect(screen.getByText(/Não há consulta marcada, não há horário/)).toBeInTheDocument();
    expect(screen.getByText(/ainda não foi procurado/)).toBeInTheDocument();
  });

  it("nomeia quem responde pelo caso, a janela de troca e as alternativas", async () => {
    await atravessarOLimiar();

    expect(screen.getByText(/continua sob responsabilidade da Aliviar/)).toBeInTheDocument();
    expect(
      screen.getByText(/Enquanto você não tiver falado com Ana Profissional, pode trocar aqui mesmo/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Os outros dois caminhos continuam na Mesa/)).toBeInTheDocument();
  });

  it("as verdades vêm ANTES do gesto, nunca depois dele", async () => {
    await atravessarOLimiar();
    const texto = document.body.textContent ?? "";

    const alcance = texto.indexOf("Não há consulta marcada");
    const gesto = texto.indexOf("Seguir com Ana Profissional");
    expect(alcance).toBeGreaterThan(-1);
    expect(gesto).toBeGreaterThan(-1);
    expect(alcance, "o alcance precede o ato").toBeLessThan(gesto);
  });
});

describe("Sala da Decisão — um ato, sem pressão", () => {
  it("o gesto é nomeado e diz sobre quem — nunca 'continuar'", async () => {
    await atravessarOLimiar();

    expect(screen.getByRole("button", { name: "Seguir com Ana Profissional" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^continuar$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /finalizar|concluir/i })).toBeNull();
  });

  it("uma única confirmação: o ato persiste direto, sem segunda tela", async () => {
    createConnectionActionMock.mockResolvedValue({ success: true });
    const user = await atravessarOLimiar();

    await user.click(screen.getByRole("button", { name: "Seguir com Ana Profissional" }));

    expect(createConnectionActionMock).toHaveBeenCalledTimes(1);
    // Nada de "tem certeza?" nem reconfirmação (SD-N2).
    expect(screen.queryByText(/tem certeza/i)).toBeNull();
  });

  it("voltar aos caminhos não persiste nada e não deixa rastro de recuo", async () => {
    const user = await atravessarOLimiar();

    await user.click(screen.getByRole("button", { name: "Voltar aos caminhos" }));

    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(createConnectionActionMock).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(/você voltou|da última vez|retomar/i);
  });

  it("nenhuma celebração, nenhum veredito, nenhuma prontidão atestada", async () => {
    await atravessarOLimiar();
    const texto = (document.body.textContent ?? "").toLowerCase();

    for (const proibido of [
      "parabéns",
      "ótima escolha",
      "escolheu bem",
      "sucesso",
      "tudo certo",
      "pronta para",
      "você já tem o que precisa",
      "muitas pacientes",
      "recomendado",
      "melhor",
    ]) {
      expect(texto, `pressão ou veredito: ${proibido}`).not.toContain(proibido);
    }
  });

  it("nenhuma promessa sem autoridade: ninguém foi avisado, nada tem prazo", async () => {
    await atravessarOLimiar();
    const texto = (document.body.textContent ?? "").toLowerCase();

    for (const proibido of [
      "foi avisado",
      "foi notificado",
      "entraremos em contato",
      "em breve",
      "prazo",
      "aguarde",
      "consulta marcada.",
      "acompanhamento iniciado",
      "irreversível",
      "totalmente reversível",
      "a qualquer momento",
    ]) {
      expect(texto, `promessa sem autoridade: ${proibido}`).not.toContain(proibido);
    }
  });
});

describe("Sala da Decisão — a janela de troca", () => {
  it("em DECISAO_REGISTRADA, a correção é dita pelo marco, não como promessa geral", () => {
    render(
      <ConnectionChoicePanel
        caseId={CASE_ID}
        providerPresentations={PRESENTATIONS}
        connection={buildConnection()}
      />,
    );

    expect(
      screen.getByText(/Enquanto você não tiver falado com Ana Profissional/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar minha escolha" })).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toContain("mude quando quiser");
  });

  it("depois de CONTATO_INICIADO a janela fecha — e ninguém a apresenta como erro", () => {
    render(
      <ConnectionChoicePanel
        caseId={CASE_ID}
        providerPresentations={PRESENTATIONS}
        connection={buildConnection({ status: "CONTATO_INICIADO" })}
      />,
    );

    expect(screen.queryByRole("button", { name: "Alterar minha escolha" })).toBeNull();
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/não é mais possível|bloquead/);
  });
});
