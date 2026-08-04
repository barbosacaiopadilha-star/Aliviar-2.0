import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  ReconhecimentoDuasColunas,
  type LinhaDoReconhecimento,
} from "@/components/paciente/reconhecimento-duas-colunas";
import { montarCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";

/**
 * ITEM 1.10 — RECONHECIMENTO EM DUAS COLUNAS (Arquitetura §6.2.1).
 *
 * Ela reconhece como seu um Perfil que foi traduzido, sem ver a tradução (P8).
 * As duas colunas existem para que o ato seja informado: a fala dela de um
 * lado, o registro do outro — com autoria, que o PP-02 criou e o Item 1.9 lê.
 */

afterEach(cleanup);

function linha(overrides: Partial<LinhaDoReconhecimento> = {}): LinhaDoReconhecimento {
  const cadeia = montarCadeiaDeProveniencia({
    subcriterionCode: "ACESSO_MODALIDADE",
    pessoa: {
      declaracao: {
        degree: "ESSENCIAL",
        options: ["telemedicina"],
        declaredBy: "perfil-paciente",
        declaredAt: "2026-08-01T10:00:00Z",
      },
      importancia: { importance: "MUITO_IMPORTANTE", declaredBy: "Dra. Ana" },
    },
    profissional: { evidencia: null, estado: null },
  });

  return {
    subcriterionCode: "ACESSO_MODALIDADE",
    label: "Como você quer ser atendida",
    declaracao: { grau: "É essencial para você", opcoes: ["Por vídeo"], em: "2026-08-01T10:00:00Z" },
    registro: { importancia: "Muito importante", autor: "Dra. Ana" },
    cadeia,
    ...overrides,
  };
}

describe("As duas colunas", () => {
  it("mostra a fala dela e o registro, lado a lado", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} />);

    expect(screen.getByText("O que você disse")).toBeInTheDocument();
    expect(screen.getByText("O que ficou registrado")).toBeInTheDocument();
    expect(screen.getByText("É essencial para você")).toBeInTheDocument();
    expect(screen.getByText("Muito importante")).toBeInTheDocument();
  });

  it("RC-2 · a coluna dela nunca contém texto do Curador", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} />);

    const item = screen.getByRole("listitem");
    const colunaDela = within(item).getByText("O que você disse").parentElement!;
    expect(colunaDela.textContent).toContain("É essencial para você");
    expect(colunaDela.textContent).not.toContain("Muito importante");
    expect(colunaDela.textContent).not.toContain("Dra. Ana");
  });

  it("quando ela não respondeu, a coluna dela diz isso — nunca inventa fala", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha({ declaracao: null })]} />);
    expect(screen.getByText("Você ainda não respondeu sobre isto.")).toBeInTheDocument();
  });
});

describe("Consumo da autoria criada no Item 1.9", () => {
  it("o registro diz quem registrou", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} />);
    expect(screen.getByText("Registrado por Dra. Ana.")).toBeInTheDocument();
  });

  it("compatibilidade retroativa: sem autor, diz que é registro anterior ao regime", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[linha({ registro: { importancia: "Importante", autor: null } })]}
      />,
    );

    const texto = screen.getByText(/Registro anterior ao regime de autoria/);
    expect(texto).toBeInTheDocument();
    // Nunca "sem autor" nem "autor desconhecido": ausência de autoria não é
    // ausência de responsabilidade (I-8).
    expect(document.body.textContent).not.toMatch(/autor desconhecido|sem autor/i);
  });

  it("a lacuna exibida vem da cadeia do 1.9 — a tela não escreve a sua própria", () => {
    const cadeiaSemImportancia = montarCadeiaDeProveniencia({
      subcriterionCode: "ACESSO_MODALIDADE",
      pessoa: {
        declaracao: {
          degree: "ESSENCIAL",
          options: [],
          declaredBy: "perfil-paciente",
          declaredAt: "2026-08-01T10:00:00Z",
        },
        importancia: null,
      },
      profissional: { evidencia: null, estado: null },
    });

    const daCadeia = cadeiaSemImportancia.lacunas.find(
      (lacuna) => lacuna.lado === "PESSOA" && lacuna.elo === "CONFIRMACAO",
    )!;

    render(
      <ReconhecimentoDuasColunas
        linhas={[linha({ registro: null, cadeia: cadeiaSemImportancia })]}
      />,
    );

    expect(screen.getByText(daCadeia.porque)).toBeInTheDocument();
  });
});

describe("Comparação correta", () => {
  it("uma linha por conceito, na ordem recebida — a tela nunca reordena", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[
          linha({ subcriterionCode: "A", label: "Primeiro" }),
          linha({ subcriterionCode: "B", label: "Segundo" }),
        ]}
      />,
    );

    const titulos = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(["Primeiro", "Segundo"]);
  });

  it("sem nada a comparar, explica em vez de mostrar tabela vazia", () => {
    render(<ReconhecimentoDuasColunas linhas={[]} />);
    expect(screen.getByText(/o Perfil começa a existir quando você responde/)).toBeInTheDocument();
  });

  it("nenhum vocabulário de mecanismo alcança a tela dela", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} />);
    for (const proibido of ["score", "ranking", "motor", "cruzamento", "proposta"]) {
      expect(document.body.textContent?.toLowerCase()).not.toContain(proibido);
    }
  });
});
