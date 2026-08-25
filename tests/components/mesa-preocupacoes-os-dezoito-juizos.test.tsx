/**
 * OS 18 PONTOS DE JUÍZO, CONTADOS NA TELA — `SIM-43`.
 *
 * @metodo ADR-067 §5 — três juízos técnicos por profissional, mais os
 *   relacionais que o Case declarou
 * @metodo ADR-093 — o juízo mora na célula, junto do fato que o justifica
 *
 * POR QUE ESTE TESTE EXISTE, E POR QUE ELE NÃO PODE SER DE MÓDULO.
 *
 * `mesa-por-preocupacoes.test.ts` já prova que *"a conta fecha em 6 pontos de
 * juízo por profissional"*. Esse teste passava — e passava com razão, porque o
 * módulo estava certo. Quem perdia seis dos dezoito era a TELA: o encolhimento
 * da linha redundante trocava as células por uma frase, e é dentro da célula
 * que mora o ato de registrar.
 *
 * Medido na Mesa em 25/08, com três profissionais reais: 12 botões onde o
 * Método pede 18. Nenhum teste olhava para a tela, então nada caiu.
 *
 * Este olha. Se um ponto de juízo sumir da renderização, ele cai — e é a única
 * coisa que ele faz.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import {
  montarMesaPorPreocupacoes,
  type ProfissionalNaMesa,
} from "@/modules/curadoria/mesa-por-preocupacoes";
import { SUBCRITERIOS_ATIVOS } from "../apoio/subcriterios-ativos";

afterEach(cleanup);

const TRES: ProfissionalNaMesa[] = [
  { id: "helena", nome: "Dra. Helena", estados: {} },
  { id: "otavio", nome: "Dr. Otávio", estados: {} },
  { id: "cecilia", nome: "Dra. Cecília", estados: {} },
];

const CASO = "f347924a-133f-4370-81d3-70f0beea16f4";

function montar(rotulos: Record<string, string> = {}) {
  const mesa = montarMesaPorPreocupacoes({
    respostas: [],
    importancias: {},
    profissionais: TRES,
    subcriteriosAtivos: [...SUBCRITERIOS_ATIVOS],
    rotulos,
  });

  return render(
    <ComparacaoPorPreocupacoes
      caseId={CASO}
      {...mesa}
      profissionais={TRES.map((p) => ({ id: p.id, nome: p.nome }))}
    />,
  );
}

describe("Os 18 pontos de juízo — contados na tela, não no módulo", () => {
  it("a tela oferece 6 pontos de juízo por profissional, e são 18 com três", () => {
    montar();

    const botoes = screen.getAllByRole("button", { name: /Registrar juízo/i });

    expect(botoes).toHaveLength(18);
  });

  it("são 3 técnicos e 3 relacionais por profissional — a divisão da ADR-067 §5", () => {
    const { container } = montar();

    // Os técnicos são do EIXO: um por eixo, nunca um por subcritério. Fossem
    // por subcritério, seriam 5 de formação e a conta daria 42.
    const tecnicos = container.querySelectorAll("[data-ponto-de-juizo]");
    expect(tecnicos).toHaveLength(9);
    expect(
      [...new Set([...tecnicos].map((td) => td.getAttribute("data-ponto-de-juizo")))].sort(),
    ).toEqual(["EXPERIENCIA", "FORMACAO", "HISTORICO"]);

    // Os relacionais caem em linhas que são perguntas feitas A ELA.
    const total = screen.getAllByRole("button", { name: /Registrar juízo/i }).length;
    expect(total - tecnicos.length).toBe(9);
  });

  // A REGRESSÃO NOMEADA. Estas duas linhas têm células idênticas entre si, e é
  // exatamente por isso que a tela as encolhia — levando o ato junto.
  it("as linhas de preferências e de notícias difíceis mantêm o ato, apesar de idênticas", () => {
    montar();

    for (const pergunta of [
      /Existe algo que você não aceita/i,
      /notícia difícil/i,
    ]) {
      const linha = screen.getByText(pergunta).closest("tr");
      expect(linha).not.toBeNull();
      expect(
        linha!.querySelectorAll("button"),
        `a linha "${pergunta}" perdeu o ato de registrar juízo`,
      ).not.toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------

// `SIM-44`. Convênio e custo não são medida de profissional — são condições de
// possibilidade. A tela os pintava com cor de atenção e escrevia "Exige juízo
// seu", cobrando um ato que ninguém deve e que ela não oferecia onde cumprir.
describe("A tela não cobra juízo onde o Método não pede", () => {
  // Com um candidato só nada encolhe (uma coluna nunca "separa" ninguém), e a
  // célula aparece inteira — é onde o dono do próximo passo pode ser lido.
  it("a célula de convênio e a de custo não devem nada a ninguém", () => {
    render(
      <ComparacaoPorPreocupacoes
        caseId={CASO}
        {...montarMesaPorPreocupacoes({
          respostas: [],
          importancias: {},
          profissionais: [TRES[0]],
          subcriteriosAtivos: [...SUBCRITERIOS_ATIVOS],
        })}
        profissionais={[{ id: TRES[0].id, nome: TRES[0].nome }]}
      />,
    );

    for (const pergunta of [/usar sua cobertura/i, /conseguir pagar/i]) {
      const celula = screen.getByText(pergunta).closest("tr")!.querySelector("td[data-motivo]")!;

      expect(celula.getAttribute("data-motivo")).toBe("FORA_DO_MOTOR");
      expect(celula.getAttribute("data-dono")).toBe("NINGUEM");
      expect(celula.textContent).toContain("O Método não cruza isto");
      expect(celula.textContent).not.toContain("Exige juízo seu");
    }
  });

  // A REGRA GERAL, que vale para a tela inteira: cobrar um ato e não oferecer
  // onde cumpri-lo era o defeito, e é isto que não pode voltar.
  it("nenhuma célula cobra juízo sem oferecer onde registrá-lo", () => {
    const { container } = montar();

    const cobram = [...container.querySelectorAll("td")].filter((td) =>
      td.textContent?.includes("Exige juízo seu"),
    );

    expect(cobram.length).toBeGreaterThan(0);
    for (const td of cobram) {
      expect(
        td.querySelectorAll("button").length,
        "uma célula cobra juízo e não oferece onde registrar",
      ).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------

// `SIM-45`. O Curador lia "experiencia volume de atuacao" — código cru
// fantasiado de prosa. E o eixo PRATICA, único que não pede juízo, nunca
// mostrava o próprio nome porque o cabeçalho dependia de haver juízo.
describe("O Curador lê nomes, não códigos", () => {
  it("o órfão aparece com o rótulo do Catálogo", () => {
    montar({ EXPERIENCIA_VOLUME_DE_ATUACAO: "Volume de atuação" });

    expect(screen.getByText("Volume de atuação")).toBeTruthy();
    expect(screen.queryByText("experiencia volume de atuacao")).toBeNull();
  });

  it("os quatro eixos mostram o próprio nome — inclusive o que não pede juízo", () => {
    montar();

    for (const rotulo of [
      /Experiência — o que já fez/,
      /Limites — o que declara não fazer/,
      /Histórico — por onde passou/,
      /Formação — onde estudou/,
    ]) {
      expect(screen.getByText(rotulo), `o eixo ${rotulo} não apareceu`).toBeTruthy();
    }
  });
});
