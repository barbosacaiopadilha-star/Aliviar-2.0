/**
 * O PAINEL DE ATENÇÃO — o que restou da "produtividade" depois da ADR-093.
 *
 * A comparação premium, os filtros rápidos e o painel de hipóteses provavam
 * componentes que saíram com a Mesa antiga; os atalhos de teclado eram do
 * `MesaShell`. O painel de atenção ATRAVESSOU: é o mesmo que a Mesa nova
 * renderiza no topo, como índice das pendências de uma página de doze telas.
 *
 * Os chips ganharam arquivo próprio (`evidencia-chips.test.tsx`).
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PainelAtencao } from "@/components/curadoria/mesa/painel-atencao";
import { itensDeAtencao } from "@/modules/curadoria/mesa-investigacao";

afterEach(cleanup);

describe("Painel lateral inteligente", () => {
  it("mostra apenas o que está aberto e leva à etapa que resolve", async () => {
    const user = userEvent.setup();
    const ida: string[] = [];
    render(
      <PainelAtencao
        itens={itensDeAtencao([
          {
            id: "a",
            nome: "Dra. Helena",
            estado: "ELEGIVEL",
            areaDeclarada: true,
            temDivergencia: true,
            filtrosSemInformacao: 0,
            criteriosPendentes: 0,
            criteriosInsuficientes: 0,
          },
        ])}
        onIr={(etapa) => ida.push(etapa)}
      />,
    );

    expect(screen.getByText("Dra. Helena")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resolver em Rede elegível" }));
    expect(ida).toEqual(["REDE"]);
  });

  it("painel vazio é resposta, não painel escondido", () => {
    render(<PainelAtencao itens={[]} />);
    expect(screen.getByText(/Nada pendente neste momento/)).toBeInTheDocument();
  });
});
