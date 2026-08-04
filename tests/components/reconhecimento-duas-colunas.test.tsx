import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReconhecimentoDuasColunas } from "@/components/paciente/reconhecimento-duas-colunas";
// B1 — os tipos vêm do MÓDULO, nunca do componente: a camada de dados não pode
// depender de um `.tsx`.
import type {
  LinhaDoReconhecimento,
  LinhaTecnica,
} from "@/modules/paciente/reconhecimento-contrato";
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
      importancia: {
        importance: "MUITO_IMPORTANTE",
        declaredBy: "Dra. Ana",
        registradoEm: "2026-08-02T09:00:00Z",
      },
    },
    profissional: { estado: null },
  });

  return {
    subcriterionCode: "ACESSO_MODALIDADE",
    label: "Como você quer ser atendida",
    declaracao: {
      grau: "É essencial para você",
      opcoes: ["Por vídeo"],
      em: "2026-08-01T10:00:00Z",
      autor: "perfil-paciente",
    },
    registro: {
      importancia: "Muito importante",
      autor: "Dra. Ana",
      registradoEm: "2026-08-02T09:00:00Z",
    },
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
  it("o registro diz quem registrou e quando — B2, sem a tela procurar na cadeia", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} />);
    expect(screen.getByText("Registrado por Dra. Ana em 02 de agosto de 2026.")).toBeInTheDocument();
  });

  it("com autor e sem data, diz o que sabe e declara o que falta — nunca aproxima", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[
          linha({ registro: { importancia: "Importante", autor: "Dra. Ana", registradoEm: null } }),
        ]}
      />,
    );

    expect(screen.getByText("Registrado por Dra. Ana — não consta a data.")).toBeInTheDocument();
  });

  it("com data e sem autor, também não inventa a metade que falta", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[
          linha({
            registro: {
              importancia: "Importante",
              autor: null,
              registradoEm: "2026-08-02T09:00:00Z",
            },
          }),
        ]}
      />,
    );

    expect(
      screen.getByText("Registrado em 02 de agosto de 2026 — não consta quem registrou."),
    ).toBeInTheDocument();
  });

  it("compatibilidade retroativa: sem autor, diz que é registro anterior ao regime", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[
          linha({ registro: { importancia: "Importante", autor: null, registradoEm: null } }),
        ]}
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
      profissional: { estado: null },
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

/**
 * B3 — O TERCEIRO BLOCO TEM PROCEDÊNCIA, NÃO CADEIA.
 *
 * A cadeia do Item 1.9 tem dois lados, e um deles é a fala dela. Um conceito
 * técnico não tem esse lado: fabricar cadeia aqui seria proveniência falsa. O
 * que o bloco carrega é quem registrou e quando — e a lacuna dita por nome.
 */
describe("O terceiro bloco — o que não veio dela", () => {
  function tecnico(overrides: Partial<LinhaTecnica> = {}): LinhaTecnica {
    return {
      subcriterionCode: "FORMACAO_TITULACAO",
      label: "Titulação",
      importancia: "Muito importante",
      autor: "Dra. Ana",
      registradoEm: "2026-08-02T09:00:00Z",
      ...overrides,
    };
  }

  it("diz explicitamente que nada ali veio dela", () => {
    render(<ReconhecimentoDuasColunas linhas={[]} tecnicos={[tecnico()]} />);

    expect(screen.getByText(/nada aqui veio de você/)).toBeInTheDocument();
    expect(screen.getByText("O que a Curadoria considerou por conta própria")).toBeInTheDocument();
  });

  it("carrega autor e data quando existem", () => {
    render(<ReconhecimentoDuasColunas linhas={[]} tecnicos={[tecnico()]} />);

    expect(screen.getByText("Registrado por Dra. Ana em 02 de agosto de 2026.")).toBeInTheDocument();
  });

  it("declara a lacuna quando a origem não está disponível", () => {
    render(
      <ReconhecimentoDuasColunas
        linhas={[]}
        tecnicos={[tecnico({ autor: null, registradoEm: null })]}
      />,
    );

    expect(screen.getByText(/não consta quem registrou, nem quando/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/autor desconhecido|sem autor|data desconhecida/i);
  });

  it("fica FORA da comparação — nunca vira uma das duas colunas", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} tecnicos={[tecnico()]} />);

    const comparacao = screen.getAllByRole("listitem")[0]!;
    expect(comparacao.textContent).not.toContain("Titulação");
  });

  it("sem itens técnicos, o bloco simplesmente não existe", () => {
    render(<ReconhecimentoDuasColunas linhas={[linha()]} tecnicos={[]} />);

    expect(
      screen.queryByText("O que a Curadoria considerou por conta própria"),
    ).not.toBeInTheDocument();
  });
});
