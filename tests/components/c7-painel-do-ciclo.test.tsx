import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CicloDoProfissionalPanel } from "@/components/profiles/ciclo-do-profissional-panel";
import { destinosPossiveis, type ImpactoDaTransicao } from "@/modules/profiles/ciclo-do-profissional";

/**
 * OPS-G5 · CORTE 7 — a mudança de estado, do lado de quem decide.
 *
 * A tese é que nada acontece por engano. Estes testes medem o caminho inteiro:
 * o que é oferecido, o que só aparece depois de uma escolha, o que exige a mão
 * da pessoa, e o que é recusado antes do clique.
 */

afterEach(cleanup);

const SEM_IMPACTO: ImpactoDaTransicao = {
  bloqueio: null,
  consequencias: ["Deixa de ser apresentado em novas Curadorias."],
  preservado: ["Relatórios já emitidos e entregues permanecem exatamente como estão."],
};

function montar(sobre: {
  ciclo: Parameters<typeof destinosPossiveis>[0];
  impacto?: ImpactoDaTransicao;
  aoMudar?: ReturnType<typeof vi.fn>;
}) {
  const mudarCiclo = sobre.aoMudar ?? vi.fn(async () => ({ success: true as const, data: null }));
  render(
    <CicloDoProfissionalPanel
      cicloAtual={sobre.ciclo}
      destinos={destinosPossiveis(sobre.ciclo)}
      preverImpacto={async () => ({ success: true as const, data: sobre.impacto ?? SEM_IMPACTO })}
      mudarCiclo={mudarCiclo}
    />,
  );
  return { mudarCiclo };
}

const aplicar = () => screen.getByRole("button", { name: /aplicar mudança/i });

describe("C7 · só é oferecido o que existe", () => {
  it("de PUBLICADO_ATIVO, os destinos são pausar e retirar — nada além", () => {
    montar({ ciclo: "PUBLICADO_ATIVO" });
    const opcoes = screen
      .getAllByRole("option")
      .map((o) => o.textContent)
      .filter((t) => !t?.startsWith("—"));
    expect(opcoes).toEqual(["Pausado", "Retirado da rede"]);
  });

  it("de RETIRADO_ARQUIVADO, o único caminho de volta passa pela preparação", () => {
    montar({ ciclo: "RETIRADO_ARQUIVADO" });
    const opcoes = screen
      .getAllByRole("option")
      .map((o) => o.textContent)
      .filter((t) => !t?.startsWith("—"));
    expect(opcoes, "voltar direto para publicado seria pular a revisão").toEqual(["Em preparação"]);
  });

  it("legado sem ciclo não oferece mudança nenhuma — a revisão vem antes", () => {
    montar({ ciclo: null });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/precisa de revisão antes/)).toBeInTheDocument();
  });
});

describe("C7 · o impacto é lido antes, não depois", () => {
  it("escolher o destino mostra o que muda e o que permanece", async () => {
    montar({ ciclo: "PUBLICADO_ATIVO" });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "RETIRADO_ARQUIVADO");

    await waitFor(() => expect(screen.getByText("O que muda")).toBeInTheDocument());
    expect(screen.getByText(/Deixa de ser apresentado/)).toBeInTheDocument();
    expect(screen.getByText("O que permanece")).toBeInTheDocument();
    expect(screen.getByText(/Relatórios já emitidos/), "não disse o que NÃO muda").toBeInTheDocument();
  });

  it("com bloqueio, a confirmação nem é oferecida", async () => {
    montar({
      ciclo: "PUBLICADO_ATIVO",
      impacto: {
        bloqueio: "Este profissional tem acompanhamento em curso.",
        consequencias: [],
        preservado: [],
      },
    });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "RETIRADO_ARQUIVADO");

    await waitFor(() => expect(screen.getByText(/acompanhamento em curso/)).toBeInTheDocument());
    expect(screen.queryByLabelText("Motivo"), "pediu motivo para um ato bloqueado").not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(aplicar()).toBeDisabled();
  });
});

describe("C7 · o motivo pertence à transição escolhida", () => {
  it("os motivos oferecidos são os daquela passagem, não a lista inteira", async () => {
    montar({ ciclo: "PUBLICADO_ATIVO" });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "PAUSADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());

    const motivos = Array.from(screen.getByLabelText("Motivo").querySelectorAll("option"))
      .map((o) => o.textContent)
      .filter((t) => !t?.startsWith("—"));
    expect(motivos).toContain("Indisponibilidade temporária");
    expect(motivos, "ofereceu um motivo de retirada para uma pausa").not.toContain(
      "Encerramento da atuação",
    );
  });

  it("trocar de destino apaga o motivo escolhido para o anterior", async () => {
    montar({ ciclo: "PUBLICADO_ATIVO" });
    const destino = screen.getByLabelText("Mudar para");

    // SOLICITACAO_DO_PROFISSIONAL vale para pausar E para retirar. Um motivo
    // que só existisse no destino antigo seria zerado pelo próprio DOM, e o
    // teste passaria sem provar nada: quem tem de apagá-lo é o painel. A pessoa
    // escolheu "a pedido do profissional" para uma PAUSA; carregar isso calado
    // para uma RETIRADA registraria uma escolha que ela não fez.
    await userEvent.selectOptions(destino, "PAUSADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Motivo"), "SOLICITACAO_DO_PROFISSIONAL");

    await userEvent.selectOptions(destino, "RETIRADO_ARQUIVADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    expect(
      (screen.getByLabelText("Motivo") as HTMLSelectElement).value,
      "um motivo sobreviveu à troca de destino",
    ).toBe("");
  });
});

describe("C7 · a confirmação é um ato separado", () => {
  it("sem marcar a confirmação, o botão não aplica nada", async () => {
    const { mudarCiclo } = montar({ ciclo: "PUBLICADO_ATIVO" });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "PAUSADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Motivo"), "REVISAO_CADASTRAL");

    expect(aplicar()).toBeDisabled();
    expect(mudarCiclo).not.toHaveBeenCalled();
  });

  it("com destino, motivo e confirmação, a mudança é enviada como escolhida", async () => {
    const { mudarCiclo } = montar({ ciclo: "PUBLICADO_ATIVO" });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "PAUSADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Motivo"), "REVISAO_CADASTRAL");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(aplicar());

    await waitFor(() =>
      expect(mudarCiclo).toHaveBeenCalledWith({ para: "PAUSADO", motivo: "REVISAO_CADASTRAL", nota: null }),
    );
  });

  it("OUTRO exige a nota, e uma nota curta não libera o ato", async () => {
    const { mudarCiclo } = montar({ ciclo: "PUBLICADO_ATIVO" });
    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "PAUSADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Motivo"), "OUTRO");

    const nota = screen.getByLabelText(/Diga o motivo em suas palavras/);
    await userEvent.type(nota, "curta");
    expect(screen.queryByRole("checkbox"), "ofereceu confirmar com nota insuficiente").not.toBeInTheDocument();

    await userEvent.clear(nota);
    await userEvent.type(nota, "o profissional pediu um intervalo de três meses");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(aplicar());

    await waitFor(() =>
      expect(mudarCiclo).toHaveBeenCalledWith({
        para: "PAUSADO",
        motivo: "OUTRO",
        nota: "o profissional pediu um intervalo de três meses",
      }),
    );
  });
});

describe("C7 · a recusa do servidor chega inteira", () => {
  it("a frase da guarda 11 aparece para quem operou", async () => {
    const recusa = vi.fn(async () => ({
      success: false as const,
      error: "Este profissional tem acompanhamento em curso. Encerre ou substitua antes de retirar da rede.",
    }));
    montar({ ciclo: "PUBLICADO_ATIVO", aoMudar: recusa });

    await userEvent.selectOptions(screen.getByLabelText("Mudar para"), "RETIRADO_ARQUIVADO");
    await waitFor(() => expect(screen.getByLabelText("Motivo")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Motivo"), "ENCERRAMENTO_DA_ATUACAO");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(aplicar());

    await waitFor(() => expect(screen.getByText(/acompanhamento em curso/)).toBeInTheDocument());
  });
});
