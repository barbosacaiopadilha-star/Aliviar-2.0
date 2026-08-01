import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MinhasEvidencias } from "@/components/profissional/minhas-evidencias";
import type {
  OwnDivergenceView,
  OwnEvidenceVersion,
} from "@/modules/curadoria/evidencias-pratica-repository";

afterEach(cleanup);

/**
 * A TELA DO PROFISSIONAL — transparência sem acusação.
 *
 * O que se pina: estados descritivos, histórico cronológico, e a linguagem da
 * divergência — objetiva, nunca "informação incorreta" ou "você declarou
 * errado". E o que NÃO pode aparecer: parecer, verificador, fonte consultada,
 * nota interna, ranking.
 */

function versao(overrides: Partial<OwnEvidenceVersion> = {}): OwnEvidenceVersion {
  return {
    subcriterionCode: "CONTINUIDADE_CANAIS",
    version: 1,
    options: ["MENSAGEM_COM_EQUIPE_OU_SECRETARIA"],
    details: {},
    conditionNote: null,
    status: "nao_verificado",
    collectedAt: "2026-08-14T10:00:00.000Z",
    verifiedAt: null,
    ...overrides,
  };
}

const DIVERGENCIA: OwnDivergenceView = {
  subcriterionCode: "CONTINUIDADE_CANAIS",
  declaredVersion: "Mensagem com a equipe ou secretaria",
  foundVersion: "O site informa apenas reagendamento",
  status: "aberta",
  severity: "observacao",
  openedAt: "2026-08-20T10:00:00.000Z",
};

describe("MinhasEvidencias", () => {
  it("mostra a resposta declarada com a data, em linguagem descritiva", () => {
    render(<MinhasEvidencias versions={[versao()]} divergences={[]} />);

    expect(screen.getByText("Canais entre consultas")).toBeInTheDocument();
    expect(screen.getByText("Declarada, ainda não verificada")).toBeInTheDocument();
    expect(screen.getByText(/Resposta declarada em 2026-08-14/)).toBeInTheDocument();
  });

  it("informação verificada aparece com a data — sem dizer quem verificou", () => {
    render(
      <MinhasEvidencias
        versions={[
          versao(),
          versao({ version: 2, status: "verificado", verifiedAt: "2026-08-20T10:00:00.000Z" }),
        ]}
        divergences={[]}
      />,
    );

    expect(screen.getByText("Verificada pela operação")).toBeInTheDocument();
    expect(screen.getByText(/informação verificada em 2026-08-20/)).toBeInTheDocument();
    expect(screen.getByText("1 verificadas")).toBeInTheDocument();
  });

  it("a divergência usa a linguagem acordada — objetiva, nunca acusatória", () => {
    render(<MinhasEvidencias versions={[versao()]} divergences={[DIVERGENCIA]} />);

    expect(
      screen.getByText(/A operação identificou uma diferença entre sua declaração/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Revise esta resposta para mantê-la atualizada/)).toBeInTheDocument();
    expect(screen.getByText(/A esclarecer: O site informa apenas reagendamento/)).toBeInTheDocument();

    expect(document.body.textContent).not.toMatch(
      /incorret|falsa|errad|mentir|inconsistente com a verdade/i,
    );
  });

  it("o histórico é cronológico e diz que responder de novo cria versão", () => {
    render(
      <MinhasEvidencias
        versions={[
          versao(),
          versao({ version: 2, options: ["APENAS_REAGENDAMENTO"], status: "verificado", verifiedAt: "2026-08-20T10:00:00.000Z" }),
        ]}
        divergences={[]}
      />,
    );

    expect(screen.getByText(/Responder de novo cria uma nova versão/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ver esta resposta e o histórico" }));
    const historico = screen.getByRole("list", { name: /Histórico — Canais entre consultas/ });
    const itens = historico.querySelectorAll("li");
    expect(itens).toHaveLength(2);
    expect(itens[0]!.textContent).toContain("Versão 1");
    expect(itens[1]!.textContent).toContain("Versão 2");
  });

  it("nunca julga o profissional nem exibe governança interna", () => {
    render(
      <MinhasEvidencias
        versions={[versao({ status: "verificado", verifiedAt: "2026-08-20T10:00:00.000Z" })]}
        divergences={[DIVERGENCIA]}
      />,
    );

    // Julgamento sobre a pessoa, ranking, score, recomendação.
    expect(document.body.textContent).not.toMatch(
      /você está (certo|errado)|confiável|seu perfil é melhor|o sistema recomenda|ranking|score|%/i,
    );
    // Governança interna: parecer, identidade, fonte consultada.
    expect(document.body.textContent).not.toMatch(/parecer|verificado por|fonte consultada/i);
  });

  it("sem evidência nenhuma, a seção não aparece — nada a dizer é não dizer nada", () => {
    const { container } = render(<MinhasEvidencias versions={[]} divergences={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
