/**
 * LEITURA RELACIONAL NA MESA — guardas de superfície (ADR-065).
 *
 * O que se pina: a aba mostra célula, sinalização humana e lacuna sem
 * ordenar, sem somar e sem comparar profissionais; o estado vazio diz a
 * verdade ("nada aqui é inferido"); o texto guiado da pessoa chega íntegro.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AbasCompatibilidade } from "@/components/curadoria/mesa/abas-compatibilidade";
import { LeituraRelacionalPanel } from "@/components/curadoria/mesa/leitura-relacional-panel";
import {
  crossRelational,
  relationalSummary,
  relationalSummarySentence,
  type RelationalNeed,
} from "@/modules/curadoria/motor-relacional";

function colunaDe(nome: string, needs: RelationalNeed[], evidence: Map<string, { subcriterionCode: string; options: string[] }>) {
  const { readings, notAnsweredByPerson } = crossRelational(needs, evidence);
  const summary = relationalSummary(readings);
  return {
    professionalProfileId: nome,
    nome,
    readings,
    notAnsweredByPerson,
    summary,
    summarySentence: relationalSummarySentence(summary),
  };
}

const NEEDS: RelationalNeed[] = [
  { subcriterionCode: "MODELO_COMUNICACAO", options: ["QUE_CONFIRMEM_SE_ENTENDI"], degree: "ESSENCIAL" },
  {
    subcriterionCode: "MODELO_PREFERENCIAS_E_RESTRICOES",
    options: [],
    degree: "ESSENCIAL",
    guidedText: "Não aceito transfusão de sangue.",
  },
];

describe("LeituraRelacionalPanel", () => {
  it("mostra célula da matriz, sinalização humana e o resumo por contagem", () => {
    const coluna = colunaDe(
      "Profissional A",
      NEEDS,
      new Map([
        [
          "MODELO_COMUNICACAO",
          { subcriterionCode: "MODELO_COMUNICACAO", options: ["VERIFICA_SE_A_PESSOA_COMPREENDEU"] },
        ],
      ]),
    );
    render(<LeituraRelacionalPanel colunas={[coluna]} relationalNeedsCount={NEEDS.length} />);

    expect(screen.getByText("Profissional A")).toBeInTheDocument();
    expect(screen.getByText("Alta compatibilidade")).toBeInTheDocument();
    expect(screen.getByText("Aguarda juízo do Curador")).toBeInTheDocument();
    expect(screen.getByText(/1 alta · 1 aguarda juízo do Curador/)).toBeInTheDocument();
    // O texto guiado da pessoa chega íntegro ao Curador.
    expect(screen.getByText("Não aceito transfusão de sangue.")).toBeInTheDocument();
    // A conduta declarada aparece pelo rótulo do Catálogo, não pelo código.
    expect(screen.getByText(/Verifica se a pessoa compreendeu/)).toBeInTheDocument();
  });

  it("sem resposta da pessoa, diz a verdade — nada é inferido", () => {
    render(<LeituraRelacionalPanel colunas={[]} relationalNeedsCount={0} />);
    expect(screen.getByText(/nada aqui é inferido/i)).toBeInTheDocument();
  });

  it("nenhum vocabulário de pódio, soma ou percentual", () => {
    const coluna = colunaDe("Profissional B", NEEDS, new Map());
    const { container } = render(
      <LeituraRelacionalPanel colunas={[coluna]} relationalNeedsCount={NEEDS.length} />,
    );
    expect(container.textContent).not.toMatch(/%|ranking|melhor|pontos|total|score/i);
  });
});

describe("AbasCompatibilidade", () => {
  it("abre na Assistencial e não renderiza as duas leituras ao mesmo tempo", () => {
    render(
      <AbasCompatibilidade
        assistencial={<p>conteúdo assistencial</p>}
        relacional={<p>conteúdo relacional</p>}
      />,
    );
    expect(screen.getByText("conteúdo assistencial")).toBeInTheDocument();
    expect(screen.queryByText("conteúdo relacional")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Relacional" })).toHaveAttribute("aria-selected", "false");
  });
});
