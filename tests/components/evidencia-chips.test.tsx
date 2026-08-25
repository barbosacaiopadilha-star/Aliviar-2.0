/**
 * EVIDÊNCIAS COMO CHIPS — o que restou do "Premium" depois da ADR-093.
 *
 * Os painéis A, B e D e os estados vazios provavam o `MesaShell` e o
 * `mesa-vazios`, que saíram com a Mesa antiga. O que fica é o chip: ele é
 * órfão REGISTRADO (`GAP-D-3`, na allowlist do detector), e um órfão
 * registrado com teste é capacidade guardada — não lixo.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenciaChips } from "@/components/curadoria/mesa/evidencia-chips";

afterEach(cleanup);

describe("Evidências como chips", () => {
  const EVIDENCIAS = [
    { id: "crm", label: "CRM", estado: "verificado" as const, detalhe: "Conselho consultado em 27/07." },
    { id: "fellow", label: "Fellowship", estado: "divergente" as const, detalhe: "Instituição confirma aperfeiçoamento." },
    { id: "hist", label: "Histórico", estado: "ausente" as const, detalhe: "Nenhum vínculo registrado." },
  ];

  it("mostra tudo num relance, com o estado em texto", () => {
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    expect(screen.getByRole("button", { name: /CRM/ }).textContent).toContain("verificado");
    expect(screen.getByRole("button", { name: /Fellowship/ }).textContent).toContain("fontes divergem");
    expect(screen.getByRole("button", { name: /Histórico/ }).textContent).toContain("não registrado");
  });

  it("o detalhe abre sob demanda, um por vez", async () => {
    const user = userEvent.setup();
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);

    expect(screen.queryByText(/Conselho consultado/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /CRM/ }));
    expect(screen.getByText(/Conselho consultado/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fellowship/ }));
    expect(screen.queryByText(/Conselho consultado/)).not.toBeInTheDocument();
    expect(screen.getByText(/Instituição confirma aperfeiçoamento/)).toBeInTheDocument();
  });

  it("divergência e ausência não somem para a fileira ficar bonita", () => {
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("sem evidência, diz isso em vez de mostrar fileira vazia", () => {
    render(<EvidenciaChips evidencias={[]} />);
    expect(screen.getByText(/Nenhuma evidência registrada/)).toBeInTheDocument();
  });
});
