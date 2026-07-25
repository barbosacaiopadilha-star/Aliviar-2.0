import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CuradoriaBriefing } from "@/components/curadoria/curadoria-briefing";
import { buildMockBriefing } from "@/modules/briefing/mock-briefing";
import type { CuradoriaBriefingData } from "@/modules/briefing/types";

afterEach(cleanup);

const vazio: CuradoriaBriefingData = {
  caseId: "c1",
  patientFirstName: "Ana",
  patientAnswers: [],
  professionalAnswers: new Map(),
  professionalNames: new Map(),
  observations: [],
  suggestions: [],
};

describe("CuradoriaBriefing — as cinco seções", () => {
  it("reúne paciente, médico, observações, atenção e sugestões", () => {
    render(<CuradoriaBriefing data={buildMockBriefing()} />);
    expect(screen.getByText(/Como Ana costuma decidir/)).toBeInTheDocument();
    expect(screen.getByText(/Como cada profissional declara conduzir/)).toBeInTheDocument();
    expect(screen.getByText(/Observações desta Consulta Inicial/)).toBeInTheDocument();
    expect(screen.getByText(/Sugestões para a apresentação/)).toBeInTheDocument();
  });

  it("mostra a fala preservada do paciente, não só o rótulo da opção", () => {
    render(<CuradoriaBriefing data={buildMockBriefing()} />);
    // Aparece duas vezes de propósito: na seção do paciente E como evidência
    // da sugestão que ela fundamenta — rastreabilidade, não duplicação.
    expect(screen.getAllByText(/preciso ler com calma/i).length).toBeGreaterThanOrEqual(2);
  });

  it("toda observação do Curador aparece com autor e data", () => {
    render(<CuradoriaBriefing data={buildMockBriefing()} />);
    expect(screen.getByText(/Curador de Demonstração ·/)).toBeInTheDocument();
  });

  it("toda evidência declara a origem", () => {
    const { container } = render(<CuradoriaBriefing data={buildMockBriefing()} />);
    const texto = container.textContent ?? "";
    expect(texto).toContain("Paciente informou:");
    expect(texto).toContain("Médico declarou:");
  });
});

describe("o que o Briefing NUNCA exibe", () => {
  it("nenhum score, nota, percentual, estrela, medalha ou selo", () => {
    const { container } = render(<CuradoriaBriefing data={buildMockBriefing()} />);
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["score", "%", "ranking", "estrela", "medalha", "selo", "pontuaç", "nota:"]) {
      expect(texto, `exibiu vocabulário proibido: ${proibido}`).not.toContain(proibido);
    }
  });

  it("não exibe posição, ordem de preferência ou 'melhor'", () => {
    const { container } = render(<CuradoriaBriefing data={buildMockBriefing()} />);
    const texto = (container.textContent ?? "").toLowerCase();
    expect(texto).not.toContain("1º lugar");
    expect(texto).not.toContain("melhor opção");
    expect(texto).not.toContain("mais indicado");
  });
});

describe("estado vazio — a Curadoria não depende do Briefing (P16)", () => {
  it("diz por que está vazio e que a Curadoria segue normalmente", () => {
    render(<CuradoriaBriefing data={vazio} />);
    expect(screen.getByText(/A Curadoria segue\s+normalmente/)).toBeInTheDocument();
    expect(screen.getByText(/apoio, nunca requisito/)).toBeInTheDocument();
  });

  it("não inventa seções quando não há dado", () => {
    render(<CuradoriaBriefing data={vazio} />);
    expect(screen.queryByText(/Pontos de atenção/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Como cada profissional/)).not.toBeInTheDocument();
  });
});
