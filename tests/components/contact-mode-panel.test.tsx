import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContactModePanel } from "@/components/patient/contact-mode-panel";
import type { ConnectionRecord } from "@/modules/connection/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const defineContactModeAction = vi.fn();
vi.mock("@/modules/connection/actions", () => ({
  defineContactModeAction: (...args: unknown[]) =>
    defineContactModeAction(...args),
}));

afterEach(cleanup);

const T0 = "2026-08-01T10:00:00.000Z";

function connection(overrides: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    id: "connection-1",
    caseId: "11111111-1111-4111-8111-111111111111",
    anchor: { source: "ACE_LEGADO", finalDeliveryId: "delivery-1" },
    patientProfileId: "patient-1",
    professionalProfileId: "professional-1",
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    decidedAt: T0,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

describe("ContactModePanel", () => {
  it("não vem com nenhum modo pré-selecionado", () => {
    render(
      <ContactModePanel caseId={connection().caseId} connection={connection()} />,
    );

    // Ausência de escolha é dita como ausência — nunca resolvida por padrão.
    expect(
      screen.getByText(/ainda não disse como prefere começar/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/é assim que está registrado/i)).toBeNull();
    expect(screen.getAllByRole("button", { name: /escolher/i })).toHaveLength(2);
  });

  it("oferece as duas opções, ambas explícitas", () => {
    render(
      <ContactModePanel caseId={connection().caseId} connection={connection()} />,
    );

    expect(
      screen.getByText(/prefiro entrar em contato diretamente/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/quero que a aliviar faça a aproximação/i),
    ).toBeInTheDocument();
  });

  it("marca a aproximação intermediada como capacidade ainda indisponível, sem prometer prazo", () => {
    render(
      <ContactModePanel caseId={connection().caseId} connection={connection()} />,
    );

    expect(
      screen.getByText(/ainda não conseguimos fazer essa aproximação por você/i),
    ).toBeInTheDocument();
  });

  it("não promete contato, prazo, disponibilidade nem acompanhamento já iniciado", () => {
    const { container } = render(
      <ContactModePanel caseId={connection().caseId} connection={connection()} />,
    );
    const texto = container.textContent ?? "";

    expect(texto).not.toMatch(/em breve/i);
    expect(texto).not.toMatch(/entraremos em contato/i);
    expect(texto).not.toMatch(/prazo|em até|horas|dias úteis/i);
    expect(texto).not.toMatch(/foi avisad/i);
    expect(texto).not.toMatch(/já está acompanhando/i);
    expect(texto).not.toMatch(/disponibilidade (confirmada|garantida)/i);
    expect(texto).not.toMatch(/consulta (marcada|reservada|encaminhada)/i);
    expect(texto).not.toMatch(/está tudo certo/i);
  });

  it("mostra o modo registrado quando já existe, e permite mudar", () => {
    render(
      <ContactModePanel
        caseId={connection().caseId}
        connection={connection({ contactMode: "CONTATO_DIRETO_ACOMPANHADO" })}
      />,
    );

    expect(screen.getByText(/é assim que está registrado/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mudar para esta/i }),
    ).toBeInTheDocument();
  });

  it.each([
    "CONTATO_INICIADO",
    "PRIMEIRO_ATENDIMENTO_REALIZADO",
    "ENCERRADO_SEM_RELACIONAMENTO",
  ] as const)(
    "desaparece depois de produzido efeito (%s) — o modo vira história",
    (status) => {
      const { container } = render(
        <ContactModePanel
          caseId={connection().caseId}
          connection={connection({ status })}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );
});
