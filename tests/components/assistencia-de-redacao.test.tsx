import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";

/**
 * ASSISTÊNCIA DE REDAÇÃO — a superfície
 * (CONTRATO_ASSISTENCIA_DE_REDACAO_IA §2/§13).
 *
 * O que se prova aqui é comportamento renderizado: nada aparece sem clique;
 * `Usar esta` preenche e o texto segue editável; escrever do zero funciona
 * sem tocar na assistência; falha do modelo NÃO bloqueia `Registrar juízo`;
 * e o que é registrado é o texto final do campo, nunca a alternativa.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const sugerir = vi.fn();
const registrar = vi.fn();

vi.mock("@/modules/curadoria/assistencia-de-redacao-actions", () => ({
  sugerirRedacaoAction: (...args: unknown[]) => sugerir(...args),
  assistenciaDeRedacaoDisponivel: async () => true,
}));

vi.mock("@/modules/curadoria/julgamento-actions", () => ({
  registrarJulgamentoAction: (...args: unknown[]) => registrar(...args),
  retirarJulgamentoAction: async () => ({ desfecho: "JUIZO_RETIRADO", versaoId: null }),
}));

const SUGESTOES = {
  objetiva: "Há um registro corrente sobre a formação documentada.",
  cautelosa: "O registro disponível é limitado e a leitura permanece parcial.",
  explicativa: "A leitura apoia-se no que foi documentado, sem extrapolar além disso.",
};

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

function montar(assistenciaDisponivel = true, conceito: ConceitoDeJuizo = CONCEITO) {
  render(
    <PainelDeJuizo
      caseId="case-1"
      assistenciaDisponivel={assistenciaDisponivel}
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

beforeEach(() => {
  sugerir.mockReset();
  registrar.mockReset();
  registrar.mockResolvedValue({ desfecho: "JUIZO_REGISTRADO", versaoId: "j-1" });
});
afterEach(cleanup);

describe("§2 · estado inicial — nada aparece sem ato explícito", () => {
  it("2 · o campo nasce vazio e nenhuma alternativa está na tela antes do clique", () => {
    montar();
    expect(campo().value).toBe("");
    expect(screen.queryByText(SUGESTOES.objetiva)).toBeNull();
    expect(screen.queryByRole("button", { name: "Usar esta" })).toBeNull();
    expect(sugerir).not.toHaveBeenCalled();
  });

  it("o botão de sugerir fica ABAIXO do campo — escrever do zero é o padrão", () => {
    montar();
    const html = document.body.innerHTML;
    expect(html.indexOf("Conclusão sobre")).toBeLessThan(html.indexOf("Sugerir redação"));
  });

  it("1 · após o clique, aparecem exatamente TRÊS alternativas, nenhuma selecionada", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));

    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());
    expect(screen.getAllByRole("button", { name: "Usar esta" })).toHaveLength(3);
    expect(screen.getByText("Objetiva")).toBeTruthy();
    expect(screen.getByText("Cautelosa")).toBeTruthy();
    expect(screen.getByText("Explicativa")).toBeTruthy();
    // Nenhuma foi escolhida automaticamente.
    expect(campo().value).toBe("");
  });

  it("a action recebe SÓ identificadores — nenhum contexto vem do cliente", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(sugerir).toHaveBeenCalled());
    expect(sugerir.mock.calls[0][0]).toEqual({
      caseId: "case-1",
      professionalProfileId: "prof-1",
      subcriterionCode: "FORMACAO",
    });
  });
});

describe("§2 · usar, editar, ignorar", () => {
  it("3 · `Usar esta` leva o texto ao campo", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[0]);
    expect(campo().value).toBe(SUGESTOES.objetiva);
  });

  it("4 · depois de usar, o texto é comum: totalmente editável, sem trecho travado", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[0]);

    fireEvent.change(campo(), { target: { value: "Reescrevi inteiro com as minhas palavras." } });
    expect(campo().value).toBe("Reescrevi inteiro com as minhas palavras.");
    expect(campo().readOnly).toBe(false);
    expect(campo().disabled).toBe(false);
  });

  it("22 · sobrescrever trabalho existente pede confirmação — e recusar preserva o texto", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.change(campo(), { target: { value: "Minha conclusão em andamento." } });
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[0]);
    expect(confirmar).toHaveBeenCalled();
    expect(campo().value).toBe("Minha conclusão em andamento.");

    confirmar.mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[0]);
    expect(campo().value).toBe(SUGESTOES.objetiva);
    confirmar.mockRestore();
  });

  it("o ✕ descarta as alternativas sem tocar no campo", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.change(campo(), { target: { value: "Texto meu." } });
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Descartar sugestões" }));
    expect(screen.queryByText(SUGESTOES.objetiva)).toBeNull();
    expect(campo().value).toBe("Texto meu.");
  });

  it("5 · escrever do zero funciona sem tocar na assistência", () => {
    montar();
    fireEvent.change(campo(), { target: { value: "Conclusão inteiramente minha." } });
    expect(botaoRegistrar().disabled).toBe(false);
    expect(sugerir).not.toHaveBeenCalled();
  });

  it("23 · `Gerar outras` substitui as anteriores e para no limite de 3 gerações", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    const outras = { ...SUGESTOES, objetiva: "Segunda geração da alternativa objetiva." };
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: outras });
    fireEvent.click(screen.getByRole("button", { name: "Gerar outras" }));
    await waitFor(() => expect(screen.getByText(outras.objetiva)).toBeTruthy());
    // Substitui: a geração anterior sai da tela, não acumula histórico.
    expect(screen.queryByText(SUGESTOES.objetiva)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Gerar outras" }));
    await waitFor(() => expect(sugerir).toHaveBeenCalledTimes(3));
    await waitFor(() =>
      expect(screen.getByText("Limite de gerações deste cartão atingido.")).toBeTruthy(),
    );
    expect((screen.getByRole("button", { name: "Gerar outras" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});

describe("§11/§29 · falha e indisponibilidade nunca bloqueiam o juízo", () => {
  it("7 · erro do modelo: aviso discreto, campo intacto, registro liberado", async () => {
    sugerir.mockResolvedValue({ desfecho: "ERRO_TECNICO" });
    montar();
    fireEvent.change(campo(), { target: { value: "Minha conclusão." } });
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));

    await waitFor(() =>
      expect(screen.getByText("Não foi possível gerar sugestões agora.")).toBeTruthy(),
    );
    expect(campo().value).toBe("Minha conclusão.");
    expect(botaoRegistrar().disabled).toBe(false);
  });

  it("15 · saída recusada pela validação não exibe nada", async () => {
    sugerir.mockResolvedValue({ desfecho: "SAIDA_RECUSADA" });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));

    await waitFor(() =>
      expect(screen.getByText("A sugestão não passou na verificação e não será exibida.")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Usar esta" })).toBeNull();
  });

  it("17 · timeout (promessa rejeitada) não trava o formulário", async () => {
    sugerir.mockRejectedValue(new Error("timeout"));
    montar();
    fireEvent.change(campo(), { target: { value: "Conclusão apesar do timeout." } });
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));

    await waitFor(() =>
      expect(screen.getByText("Não foi possível gerar sugestões agora.")).toBeTruthy(),
    );
    expect(botaoRegistrar().disabled).toBe(false);
  });

  it("30 · duplo clique não dispara requisições concorrentes no mesmo cartão", async () => {
    let liberar: (valor: unknown) => void = () => {};
    sugerir.mockReturnValue(new Promise((resolve) => (liberar = resolve)));
    montar();
    const botao = screen.getByRole("button", { name: "✨ Sugerir redação" });
    fireEvent.click(botao);
    fireEvent.click(botao);
    fireEvent.click(botao);
    expect(sugerir).toHaveBeenCalledTimes(1);

    liberar({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());
  });

  it("11 · sem assistência disponível, o botão não é exibido — melhor ausente que quebrado", () => {
    montar(false);
    expect(screen.queryByRole("button", { name: "✨ Sugerir redação" })).toBeNull();
    expect(screen.queryByTestId("assistencia-FORMACAO")).toBeNull();
    // E o juízo continua inteiro.
    fireEvent.change(campo(), { target: { value: "Conclusão sem assistência nenhuma." } });
    expect(botaoRegistrar().disabled).toBe(false);
  });
});

describe("§7 · autoria — só o texto final é ato", () => {
  it("6/12/13 · registra o texto EDITADO, não a alternativa, e sem nenhum campo de IA", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[0]);
    fireEvent.change(campo(), { target: { value: "Versão final, reescrita por mim." } });

    fireEvent.click(botaoRegistrar());
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(1));

    const payload = registrar.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.conclusao).toBe("Versão final, reescrita por mim.");
    // A alternativa original NÃO viaja, e nenhum metadado de IA existe.
    expect(JSON.stringify(payload).includes(SUGESTOES.objetiva)).toBe(false);
    for (const proibido of ["ai_assisted", "sugestao", "model", "promptVersion", "assist"]) {
      expect(Object.keys(payload).some((chave) => chave.includes(proibido))).toBe(false);
    }
  });

  it("12 · pedir sugestão, sozinho, não registra ato nenhum", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());
    fireEvent.click(screen.getAllByRole("button", { name: "Usar esta" })[1]);

    expect(registrar).not.toHaveBeenCalled();
    // E o botão de registrar continua sendo o único caminho do ato.
    expect(botaoRegistrar().disabled).toBe(false);
  });

  it("24 · as alternativas somem ao descartar — nada as guarda entre interações", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    montar();
    fireEvent.click(screen.getByRole("button", { name: "✨ Sugerir redação" }));
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    cleanup();
    montar();
    expect(screen.queryByText(SUGESTOES.objetiva)).toBeNull();
  });
});

describe("§9/§31/§32 · isolamento", () => {
  it("9/10 · o pedido carrega o Case e o profissional DESTE cartão, nunca outro", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    render(
      <PainelDeJuizo
        caseId="case-A"
        assistenciaDisponivel
        profissionais={[
          { professionalProfileId: "prof-A", nome: "Dra. A", conceitos: [CONCEITO] },
          {
            professionalProfileId: "prof-B",
            nome: "Dr. B",
            conceitos: [{ ...CONCEITO, code: "EXPERIENCIA", label: "Experiência Profissional" }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "✨ Sugerir redação" })[1]);
    await waitFor(() => expect(sugerir).toHaveBeenCalled());
    expect(sugerir.mock.calls[0][0]).toEqual({
      caseId: "case-A",
      professionalProfileId: "prof-B",
      subcriterionCode: "EXPERIENCIA",
    });

    // O texto do cartão de B não aparece no cartão de A.
    const cartaoA = screen.getByTestId("juizo-FORMACAO");
    expect(cartaoA.textContent?.includes(SUGESTOES.objetiva)).toBe(false);
  });

  it("as sugestões de um cartão não vazam para o outro", async () => {
    sugerir.mockResolvedValue({ desfecho: "SUGESTOES_GERADAS", sugestoes: SUGESTOES });
    render(
      <PainelDeJuizo
        caseId="case-A"
        assistenciaDisponivel
        profissionais={[
          {
            professionalProfileId: "prof-A",
            nome: "Dra. A",
            conceitos: [
              CONCEITO,
              { ...CONCEITO, code: "EXPERIENCIA", label: "Experiência Profissional" },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "✨ Sugerir redação" })[0]);
    await waitFor(() => expect(screen.getByText(SUGESTOES.objetiva)).toBeTruthy());

    expect(screen.getByTestId("juizo-EXPERIENCIA").textContent?.includes(SUGESTOES.objetiva)).toBe(
      false,
    );
    expect(
      (screen.getByLabelText("Conclusão sobre Experiência Profissional") as HTMLTextAreaElement)
        .value,
    ).toBe("");
  });
});
