import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import { MODELOS_DE_REDACAO } from "@/modules/curadoria/modelos-de-redacao";

/**
 * A BIBLIOTECA DETERMINÍSTICA na superfície
 * (CONTRATO_BIBLIOTECA_DE_REDACAO §7/§13).
 *
 * O que se prova aqui: abrir a lista NÃO toca o campo; `Usar este texto`
 * copia e o texto segue integralmente editável; escrever do zero funciona
 * sem abrir nada; e o que é registrado é o texto final, nunca o modelo.
 *
 * Não há mock de provider, nem de action de geração, nem relógio de timeout —
 * porque não existe mais nada disso para simular. É a medida da simplificação.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const registrar = vi.fn();

vi.mock("@/modules/curadoria/julgamento-actions", () => ({
  registrarJulgamentoAction: (...args: unknown[]) => registrar(...args),
  retirarJulgamentoAction: async () => ({ desfecho: "JUIZO_RETIRADO", versaoId: null }),
}));

const CONCEITO: ConceitoDeJuizo = {
  code: "FORMACAO",
  label: "Formação Profissional",
  natureza: "TECNICO",
  lacuna: "SEM_JUIZO",
  vigente: null,
  historico: [],
  evidenciasCorrentes: [
    {
      id: "ev-1",
      version: 2,
      subcriterionCode: "FORMACAO_GRADUACAO",
      status: "verificado",
      resumo: "FORMACAO_GRADUACAO",
    },
  ],
  versaoBaseId: null,
};

const SUFICIENTE = MODELOS_DE_REDACAO.FORMACAO[0].texto;
const INSUFICIENTE = MODELOS_DE_REDACAO.FORMACAO.find(
  (m) => m.situacao === "INFORMACAO_INSUFICIENTE",
)!.texto;

function montar(conceito: ConceitoDeJuizo = CONCEITO) {
  render(
    <PainelDeJuizo
      caseId="case-1"
      profissionais={[
        { professionalProfileId: "prof-1", nome: "Dra. Exemplo", conceitos: [conceito] },
      ]}
    />,
  );
}

const campo = () =>
  screen.getByLabelText("Conclusão sobre Formação Profissional") as HTMLTextAreaElement;
const botaoRegistrar = () =>
  screen.getByRole("button", { name: "Registrar juízo" }) as HTMLButtonElement;
const abrir = () => fireEvent.click(screen.getByRole("button", { name: "Modelos de redação" }));

beforeEach(() => {
  registrar.mockReset();
  registrar.mockResolvedValue({ desfecho: "JUIZO_REGISTRADO", versaoId: "j-1" });
});
afterEach(cleanup);

describe("§7 · abrir a lista", () => {
  it("6 · o textarea nasce vazio e nenhum modelo está na tela antes do clique", () => {
    montar();
    expect(campo().value).toBe("");
    expect(screen.queryByText(SUFICIENTE)).toBeNull();
    expect(screen.queryByRole("button", { name: "Usar este texto" })).toBeNull();
  });

  it("o botão fica ABAIXO do campo — escrever do zero é o padrão", () => {
    montar();
    const html = document.body.innerHTML;
    expect(html.indexOf("Conclusão sobre")).toBeLessThan(html.indexOf("Modelos de redação"));
  });

  it("7 · abrir a lista NÃO altera o textarea — e mostra os quatro modelos", () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Texto que eu já escrevi." } });
    abrir();

    expect(campo().value).toBe("Texto que eu já escrevi.");
    expect(screen.getAllByRole("button", { name: "Usar este texto" })).toHaveLength(4);
    expect(screen.getByText("Elementos suficientes")).toBeTruthy();
    expect(screen.getByText("Elementos parciais")).toBeTruthy();
    expect(screen.getByText("Informação insuficiente")).toBeTruthy();
    expect(screen.getByText("Com ressalva")).toBeTruthy();
  });

  it("a lista diz o que ela é — nenhum modelo é uma conclusão", () => {
    montar();
    abrir();
    expect(
      screen.getByText("Modelos de redação — nenhum é uma conclusão. Escolha, edite ou ignore."),
    ).toBeTruthy();
  });

  it("os textos exibidos são exatamente os canônicos do conceito", () => {
    montar();
    abrir();
    for (const modelo of MODELOS_DE_REDACAO.FORMACAO) {
      expect(screen.getByText(modelo.texto), modelo.id).toBeTruthy();
    }
  });

  it("o ✕ fecha a lista sem tocar no campo", () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Meu texto." } });
    abrir();
    fireEvent.click(screen.getByRole("button", { name: "Fechar modelos de redação" }));

    expect(screen.queryByText(SUFICIENTE)).toBeNull();
    expect(campo().value).toBe("Meu texto.");
  });

  it("cada cartão abre a SUA biblioteca — a do vizinho não aparece", () => {
    render(
      <PainelDeJuizo
        caseId="case-1"
        profissionais={[
          {
            professionalProfileId: "prof-1",
            nome: "Dra. Exemplo",
            conceitos: [
              CONCEITO,
              {
                ...CONCEITO,
                code: "MODELO_DECISAO_COMPARTILHADA",
                label: "Decisão compartilhada",
                natureza: "RELACIONAL",
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Modelos de redação" })[0]);
    expect(screen.getByText(SUFICIENTE)).toBeTruthy();
    expect(screen.queryByText(MODELOS_DE_REDACAO.MODELO_DECISAO_COMPARTILHADA[0].texto)).toBeNull();
    expect(
      screen.getByTestId("juizo-MODELO_DECISAO_COMPARTILHADA").textContent?.includes(SUFICIENTE),
    ).toBe(false);
  });
});

describe("§7 · usar, editar, ignorar", () => {
  it("8 · `Usar este texto` copia o modelo para o campo", () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    expect(campo().value).toBe(SUFICIENTE);
  });

  it("qualquer uma das quatro situações pode ser escolhida", () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[2]);
    expect(campo().value).toBe(INSUFICIENTE);
  });

  it("9 · depois de usar, o texto é comum: 100% editável, sem trecho travado", () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);

    fireEvent.change(campo(), { target: { value: "Reescrevi inteiro com as minhas palavras." } });
    expect(campo().value).toBe("Reescrevi inteiro com as minhas palavras.");
    expect(campo().readOnly).toBe(false);
    expect(campo().disabled).toBe(false);
    expect(campo().maxLength).toBe(280);
  });

  it("11 · sobrescrever trabalho existente exige confirmação — recusar preserva o texto", () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Minha conclusão em andamento." } });
    abrir();

    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    expect(confirmar).toHaveBeenCalled();
    expect(campo().value).toBe("Minha conclusão em andamento.");

    confirmar.mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    expect(campo().value).toBe(SUFICIENTE);
    confirmar.mockRestore();
  });

  it("com o campo vazio, usar um modelo não pergunta nada", () => {
    montar();
    abrir();
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    expect(confirmar).not.toHaveBeenCalled();
    confirmar.mockRestore();
  });

  it("10 · escrever do zero funciona sem abrir a lista", () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Conclusão inteiramente minha." } });
    expect(botaoRegistrar().disabled).toBe(false);
    expect(screen.queryByText(SUFICIENTE)).toBeNull();
  });
});

describe("§11 · autoria e persistência", () => {
  it("12 · registra o texto EDITADO — o modelo original não viaja", async () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    fireEvent.change(campo(), { target: { value: "Versão final, reescrita por mim." } });

    fireEvent.click(botaoRegistrar());
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));

    const payload = registrar.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.conclusao).toBe("Versão final, reescrita por mim.");
    expect(JSON.stringify(payload).includes(SUFICIENTE)).toBe(false);
  });

  it("23 · nenhum identificador de modelo é persistido no ato", async () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    fireEvent.click(botaoRegistrar());
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));

    const payload = registrar.mock.calls[0][0] as Record<string, unknown>;
    const serializado = JSON.stringify(payload);
    for (const proibido of ["formacao-suficiente", "template", "modelo", "situacao", "ELEMENTOS_"]) {
      expect(serializado.includes(proibido), `o ato carrega: ${proibido}`).toBe(false);
    }
    // O texto usado sem edição é o texto final — e é só isso que atravessa.
    expect(payload.conclusao).toBe(SUFICIENTE);
  });

  it("13 · abrir a lista e usar um modelo, sozinhos, não registram ato nenhum", () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[1]);
    expect(registrar).not.toHaveBeenCalled();
  });

  it("24 · a autoria continua da sessão: nenhum ator viaja no payload", async () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Conclusão minha." } });
    fireEvent.click(botaoRegistrar());
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));

    const payload = registrar.mock.calls[0][0] as Record<string, unknown>;
    for (const proibido of ["actorId", "actor_id", "authorId", "ai_assisted"]) {
      expect(Object.keys(payload).includes(proibido), proibido).toBe(false);
    }
  });

  it("após registrar, o campo volta a nascer vazio — sem carry-forward", async () => {
    montar();
    abrir();
    fireEvent.click(screen.getAllByRole("button", { name: "Usar este texto" })[0]);
    fireEvent.click(botaoRegistrar());
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(campo().value).toBe(""));
  });
});

describe("§9 · o que deixou de existir", () => {
  it("14/15/16 · sem botão de gerar, sem estado de carregamento, sem mensagem de erro", () => {
    montar();
    expect(screen.queryByRole("button", { name: /Sugerir/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Gerar outras/i })).toBeNull();
    expect(screen.queryByText(/Gerando/i)).toBeNull();
    expect(screen.queryByText(/não foi possível gerar/i)).toBeNull();
  });

  it("abrir a lista é síncrono — o conteúdo está na tela no mesmo tique", () => {
    montar();
    abrir();
    // Sem `await`, sem `waitFor`: se houvesse rede, isto falharia.
    expect(screen.getByText(SUFICIENTE)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Usar este texto" })).toHaveLength(4);
  });

  it("um conceito sem biblioteca simplesmente não mostra o botão", () => {
    montar({ ...CONCEITO, code: "AREA", label: "Área de atuação" });
    expect(screen.queryByRole("button", { name: "Modelos de redação" })).toBeNull();
    expect(screen.queryByTestId("modelos-AREA")).toBeNull();
    // E o juízo continua inteiro.
    const campoArea = screen.getByLabelText("Conclusão sobre Área de atuação") as HTMLTextAreaElement;
    fireEvent.change(campoArea, { target: { value: "Conclusão sem modelo." } });
    expect(botaoRegistrar().disabled).toBe(false);
  });
});
