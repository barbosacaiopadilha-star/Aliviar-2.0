import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConductionPanel } from "@/components/curadoria/conduction-panel";
import { JourneyNavigator } from "@/components/curadoria/journey-navigator";
import { conduct } from "@/modules/curadoria/cos/conduction";
import { buildCuratorJourney } from "@/modules/curadoria/cos/journey";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

const marina = MOCK_RECORDS["caso-2041"]!;
const state = conduct(marina);
const journey = buildCuratorJourney(marina, state);

describe("ConductionPanel — workflow guiado", () => {
  it("usa rótulo de ação específico em vez de Continuar", () => {
    render(<ConductionPanel state={state} caseId={marina.caseId} journey={journey} />);
    const primaryActions = screen.getAllByRole("link", { name: /^Abrir a Mesa de Curadoria/ });
    expect(primaryActions.some((link) => link.className.includes("bg-brand-primary"))).toBe(true);
    expect(screen.queryByRole("link", { name: /^Continuar/i })).not.toBeInTheDocument();
  });

  it("renderiza pendências como links clicáveis", () => {
    render(<ConductionPanel state={state} caseId={marina.caseId} journey={journey} />);
    const actionLinks = screen.getAllByRole("link", { name: /Definir os critérios|Registrar|Abrir/i });
    expect(actionLinks.length).toBeGreaterThan(0);
    for (const link of actionLinks) {
      expect(link).toHaveAttribute("href", expect.stringContaining(marina.caseId));
    }
  });

  it("conta etapas da jornada, nunca fases internas", () => {
    render(<ConductionPanel state={state} caseId={marina.caseId} journey={journey} />);
    expect(screen.getByText(/de 4 etapas concluídas/)).toBeInTheDocument();
    expect(screen.queryByText(/de 9 fases/)).not.toBeInTheDocument();
  });
});

describe("JourneyNavigator — as quatro etapas", () => {
  it("etapas bloqueadas não são links e dizem de que dependem", () => {
    render(<JourneyNavigator journey={journey} caseId={marina.caseId} />);
    const blocked = journey.steps.find((step) => step.status === "BLOQUEADA");
    expect(blocked).toBeDefined();
    const rows = screen.getAllByText(blocked!.label);
    expect(rows.some((node) => node.closest("[aria-disabled='true']"))).toBe(true);
    expect(screen.getAllByText(/Depende de:/i).length).toBeGreaterThan(0);
  });

  it("etapas disponíveis levam ao slug da jornada", () => {
    render(<JourneyNavigator journey={journey} caseId={marina.caseId} />);
    const link = screen.getByRole("link", { name: /Abrir Acolhimento/i });
    expect(link).toHaveAttribute("href", `/coa/curadoria/casos/${marina.caseId}/acolhimento`);
  });

  it("mostra progresso como fato, sem percentual nem previsão de tempo", () => {
    const { container } = render(<JourneyNavigator journey={journey} caseId={marina.caseId} />);
    expect(screen.getByText(/de 4 etapas concluídas/)).toBeInTheDocument();
    const texto = container.textContent ?? "";
    expect(texto).not.toContain("%");
    expect(texto).not.toMatch(/minutos?|horas?/i);
  });

  it("expõe navegação acessível", () => {
    render(<JourneyNavigator journey={journey} caseId={marina.caseId} />);
    expect(screen.getByRole("navigation", { name: /Etapas da Curadoria/i })).toBeInTheDocument();
  });

  it("nenhuma etapa usa o vocabulário interno das fases", () => {
    const { container } = render(<JourneyNavigator journey={journey} caseId={marina.caseId} />);
    const texto = container.textContent ?? "";
    // "Filtros" e "Devolutiva" eram nomes de fase que o Curador não usa.
    expect(texto).not.toContain("Filtros");
    expect(texto).not.toContain("Devolutiva");
  });
});
