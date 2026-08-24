import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import { COMPATIBILITY_LABELS } from "@/modules/paciente/experiencia";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

afterEach(cleanup);

/**
 * A AUSÊNCIA NA TELA — a contraparte de `carta-ausencia-dita-uma-vez`.
 *
 * O teste puro prova a frase; este prova o que a pessoa vê. Foi montando o
 * Case de ponta a ponta que o problema apareceu inteiro: três opções com
 * "0 altas · 0 médias · 25 lacunas" produziam três cartas em que TUDO era
 * "Ainda não foi possível confirmar".
 */

const ROTULOS: Record<string, string> = {
  FORMACAO: "Formação",
  EXPERIENCIA: "Experiência",
  CONTINUIDADE_DO_CUIDADO: "Continuidade",
  MODELO_DE_ATENDIMENTO: "Modelo de atendimento",
  ACESSO: "Acesso",
};

function dimensoes(
  niveis: Record<string, PatientCuradoriaOption["dimensions"][number]["level"]>,
): PatientCuradoriaOption["dimensions"] {
  return Object.entries(niveis).map(([criterion, level]) => ({
    criterion,
    label: ROTULOS[criterion]!,
    level,
  }));
}

function opcao(dims: PatientCuradoriaOption["dimensions"]): PatientCuradoriaOption {
  return {
    id: "o1",
    professionalProfileId: "prof-1",
    professionalName: "Dra. Helena Monteiro",
    justification: "Este caminho responde ao que você colocou como mais importante.",
    relationToWeights: "",
    relationalReading: null,
    favorablePoints: [],
    attentionPoints: [],
    suggestedQuestions: [],
    dimensions: dims,
    formacao: [],
    formacaoIndisponivel: false,
  };
}

/**
 * A carta é CONTROLADA: `aberta` vem de fora e `onAbrir` é do pai. Clicar aqui
 * com um `onAbrir` vazio não abre nada — o primeiro rascunho deste teste caiu
 * exatamente nisso. Renderizar já aberta é o que corresponde ao componente.
 */
function abrir(option: PatientCuradoriaOption) {
  render(
    <CartaCaminho
      option={option}
      aberta
      jaConhecida={false}
      onAbrir={() => {}}
      onFechar={() => {}}


    />,
  );
}

describe("carta com NADA confirmado", () => {
  const TUDO_A_CONFIRMAR = opcao(
    dimensoes({
      FORMACAO: "A_CONFIRMAR",
      EXPERIENCIA: "A_CONFIRMAR",
      CONTINUIDADE_DO_CUIDADO: "A_CONFIRMAR",
      MODELO_DE_ATENDIMENTO: "A_CONFIRMAR",
      ACESSO: "A_CONFIRMAR",
    }),
  );

  it("a frase repetida não aparece NENHUMA vez", async () => {
    // Era o defeito: cinco por carta, quinze entre as três.
    render(
      <CartaCaminho
        option={TUDO_A_CONFIRMAR}
        aberta
        jaConhecida={false}
        onAbrir={() => {}}
        onFechar={() => {}}


      />,
    );
    expect(screen.queryAllByText(COMPATIBILITY_LABELS.A_CONFIRMAR)).toHaveLength(0);
  });

  it("a seção de Perfil não existe — cabeçalho sobre lista vazia é promessa não cumprida", () => {
    render(
      <CartaCaminho
        option={TUDO_A_CONFIRMAR}
        aberta
        jaConhecida={false}
        onAbrir={() => {}}
        onFechar={() => {}}


      />,
    );
    expect(screen.queryByText("Como responde ao seu Perfil")).not.toBeInTheDocument();
    expect(screen.getByText("O que ainda não sabemos")).toBeInTheDocument();
  });

  it("as cinco dimensões são NOMEADAS numa frase só — nada é escondido", () => {
    render(
      <CartaCaminho
        option={TUDO_A_CONFIRMAR}
        aberta
        jaConhecida={false}
        onAbrir={() => {}}
        onFechar={() => {}}


      />,
    );
    const frase = screen.getByText(/Ainda não pudemos confirmar/).textContent ?? "";
    for (const rotulo of Object.values(ROTULOS)) {
      expect(frase.toLowerCase(), `dimensão sumiu: ${rotulo}`).toContain(rotulo.toLowerCase());
    }
    expect(frase).toContain("Sua Curadora pode buscar isso");
  });
});

describe("carta com parte confirmada", () => {
  it("o que se sabe vira linha; só o que falta entra na frase final", () => {
    const option = opcao(
      dimensoes({
        FORMACAO: "PLENO",
        EXPERIENCIA: "NAO_ATENDE",
        CONTINUIDADE_DO_CUIDADO: "A_CONFIRMAR",
        MODELO_DE_ATENDIMENTO: "A_CONFIRMAR",
        ACESSO: "PARCIAL",
      }),
    );
    abrir(option);

    expect(screen.getByText("Como responde ao seu Perfil")).toBeInTheDocument();
    expect(screen.getByText(COMPATIBILITY_LABELS.PLENO)).toBeInTheDocument();
    // NAO_ATENDE é fato conhecido e continua na lista: é dele que a frase de
    // prontidão se alimenta. Varrê-lo para "o que não sabemos" esconderia um
    // custo real da opção.
    expect(screen.getByText(COMPATIBILITY_LABELS.NAO_ATENDE)).toBeInTheDocument();

    const frase = screen.getByText(/Ainda não pudemos confirmar/).textContent ?? "";
    expect(frase).toContain("continuidade e modelo de atendimento");
    expect(frase.toLowerCase()).not.toContain("formação");
    expect(frase.toLowerCase()).not.toContain("experiência");
  });

  it("com tudo confirmado, a seção de ausência não existe", () => {
    const option = opcao(
      dimensoes({
        FORMACAO: "PLENO",
        EXPERIENCIA: "PLENO",
        CONTINUIDADE_DO_CUIDADO: "PLENO",
        MODELO_DE_ATENDIMENTO: "PLENO",
        ACESSO: "PLENO",
      }),
    );
    abrir(option);
    expect(screen.queryByText("O que ainda não sabemos")).not.toBeInTheDocument();
  });
});
