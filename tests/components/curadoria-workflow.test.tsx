import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConductionPanel } from "@/components/curadoria/conduction-panel";
import { PhaseNavigator } from "@/components/curadoria/phase-navigator";
import { conduct } from "@/modules/curadoria/cos/conduction";
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

describe("ConductionPanel — workflow guiado", () => {
  const marina = MOCK_RECORDS["caso-2041"]!;
  const state = conduct(marina);

  it("usa rótulo de ação específico em vez de Continuar", () => {
    render(<ConductionPanel state={state} caseId={marina.caseId} />);
    const primaryActions = screen.getAllByRole("link", { name: /^Distribuir Prioridades/ });
    expect(primaryActions.some((link) => link.className.includes("bg-brand-primary"))).toBe(true);
    expect(screen.queryByRole("link", { name: /^Continuar/i })).not.toBeInTheDocument();
  });

  it("renderiza pendências como links clicáveis", () => {
    render(<ConductionPanel state={state} caseId={marina.caseId} />);
    const actionLinks = screen.getAllByRole("link", { name: /Distribuir Prioridades|Abrir/i });
    expect(actionLinks.length).toBeGreaterThan(0);
    for (const link of actionLinks) {
      expect(link).toHaveAttribute("href", expect.stringContaining(marina.caseId));
    }
  });
});

describe("PhaseNavigator — workflow guiado", () => {
  const marina = MOCK_RECORDS["caso-2041"]!;
  const state = conduct(marina);

  it("fases bloqueadas não são links", () => {
    render(<PhaseNavigator phases={state.phases} caseId={marina.caseId} />);
    const blocked = state.phases.find((phase) => phase.status === "BLOQUEADA");
    expect(blocked).toBeDefined();
    const blockedLabels = screen.getAllByText(/Curadoria Técnica/i);
    const blockedRow = blockedLabels.find((node) => node.closest("[aria-disabled='true']"));
    expect(blockedRow).toBeDefined();
    expect(screen.getAllByText(/Depende de:/i).length).toBeGreaterThan(0);
  });

  it("fases disponíveis são links navegáveis", () => {
    render(<PhaseNavigator phases={state.phases} caseId={marina.caseId} />);
    const historiaLink = screen.getByRole("link", { name: /Abrir História/i });
    expect(historiaLink).toHaveAttribute(
      "href",
      `/coa/curadoria/casos/${marina.caseId}/historia`,
    );
  });

  it("expõe navegação acessível", () => {
    render(<PhaseNavigator phases={state.phases} caseId={marina.caseId} />);
    expect(screen.getByRole("navigation", { name: /Workflow da Curadoria/i })).toBeInTheDocument();
  });
});
