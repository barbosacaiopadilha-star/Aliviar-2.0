import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BarraCompatibilidade } from "@/components/paciente/caminhos/barra-compatibilidade";
import { CaminhosPanel } from "@/components/paciente/caminhos/caminhos-panel";
import { ComparacaoCaminhos } from "@/components/paciente/caminhos/comparacao-caminhos";
import { Retrato } from "@/components/paciente/caminhos/retrato";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";
import type { PatientCuradoria, PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function dimensoes(overrides: Record<string, string> = {}) {
  const base = {
    FORMACAO: "PLENO",
    EXPERIENCIA: "PLENO",
    CONTINUIDADE_DO_CUIDADO: "PLENO",
    MODELO_DE_ATENDIMENTO: "PLENO",
    ACESSO: "PLENO",
    ...overrides,
  };
  const rotulos: Record<string, string> = {
    FORMACAO: "Formação",
    EXPERIENCIA: "Experiência",
    CONTINUIDADE_DO_CUIDADO: "Continuidade",
    MODELO_DE_ATENDIMENTO: "Modelo de atendimento",
    ACESSO: "Acesso",
  };
  return Object.entries(base).map(([criterion, level]) => ({
    criterion,
    label: rotulos[criterion]!,
    level: level as PatientCuradoriaOption["dimensions"][number]["level"],
  }));
}

function opcao(id: string, nome: string, overrides: Partial<PatientCuradoriaOption> = {}): PatientCuradoriaOption {
  return {
    id,
    professionalProfileId: `prof-${id}`,
    professionalName: nome,
    justification: `Este caminho entrou porque responde ao seu caso — ${nome}.`,
    relationToWeights: "Em relação ao seu Perfil: Continuidade do Cuidado atende plenamente.",
    relationalReading: null,
    favorablePoints: ["Formação específica para o seu caso."],
    attentionPoints: ["Ainda não conseguimos confirmar como ocorre o acompanhamento."],
    suggestedQuestions: ["Como funciona o acompanhamento após a primeira consulta?"],
    dimensions: dimensoes(),
    formacao: [],
    ...overrides,
  };
}

const CURADORIA: PatientCuradoria = {
  curatedSelectionId: "sel-1",
  caseId: "case-1",
  curatorName: null,
  deliveredAt: "2026-07-27T12:00:00.000Z",
  compositionRationale: "Os três cobrem a área exigida por caminhos diferentes.",
  options: [
    opcao("a", "Dra. Helena Monteiro"),
    opcao("b", "Dr. Rafael Nogueira", {
      dimensions: dimensoes({ ACESSO: "PARCIAL", MODELO_DE_ATENDIMENTO: "A_CONFIRMAR" }),
    }),
    opcao("c", "Dra. Marina Azevedo"),
  ],
  decision: null,
};

describe("Retrato — presença sem foto que não existe", () => {
  it("usa as iniciais do nome, ignorando o título", () => {
    const { container } = render(<Retrato nome="Dra. Helena Monteiro" />);
    expect(container.textContent).toBe("HM");
  });

  it("é determinístico: o mesmo nome sempre tem o mesmo tratamento", () => {
    const primeiro = render(<Retrato nome="Dr. Rafael Nogueira" />).container.firstElementChild?.className;
    cleanup();
    const segundo = render(<Retrato nome="Dr. Rafael Nogueira" />).container.firstElementChild?.className;
    expect(primeiro).toBe(segundo);
  });

  it("é decorativo para leitor de tela — o nome já está no título da carta", () => {
    const { container } = render(<Retrato nome="Dra. Marina Azevedo" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("BarraCompatibilidade — representação, jamais medida", () => {
  it("o estado vem por extenso, não só em cor", () => {
    render(
      <BarraCompatibilidade
        dimension={{ criterion: "ACESSO", label: "Acesso", level: "PARCIAL" }}
      />,
    );
    expect(screen.getAllByText("Encontra em parte").length).toBeGreaterThan(0);
  });

  it("'ainda precisamos confirmar' é lacuna nossa, nunca demérito", () => {
    render(
      <BarraCompatibilidade
        dimension={{ criterion: "MODELO_DE_ATENDIMENTO", label: "Modelo", level: "A_CONFIRMAR" }}
      />,
    );
    expect(screen.getAllByText("Ainda não foi possível confirmar").length).toBeGreaterThan(0);
    // A frase para leitor de tela nomeia a dimensão e o estado.
    expect(screen.getByText(/Modelo: Ainda não foi possível confirmar/)).toBeInTheDocument();
  });

  it("nenhum número, percentual ou nota aparece", () => {
    const { container } = render(
      <BarraCompatibilidade dimension={{ criterion: "FORMACAO", label: "Formação", level: "PLENO" }} />,
    );
    expect(container.textContent).not.toMatch(/\d/);
  });
});

describe("CartaCaminho — abertura no lugar, com memória", () => {
  it("nasce fechada, mostrando resumo e o convite", () => {
    render(<CaminhosPanel curadoria={CURADORIA} />);

    expect(screen.getAllByRole("button", { name: "Conhecer este caminho" })).toHaveLength(3);
    // Progressive Disclosure: as barras não estão na tela ainda.
    expect(screen.queryByText("Como responde ao seu Perfil")).not.toBeInTheDocument();
  });

  it("abrir revela compatibilidade, destaques, atenção e perguntas — nesta ordem", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);

    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);

    expect(screen.getByText("Como responde ao seu Perfil")).toBeInTheDocument();
    expect(screen.getByText("O que você encontra neste caminho")).toBeInTheDocument();
    expect(screen.getByText("Do que você abre mão neste caminho")).toBeInTheDocument();
    expect(
      screen.getByText("Perguntas que podem ajudar na próxima conversa"),
    ).toBeInTheDocument();
    expect(screen.getByText("A leitura completa")).toBeInTheDocument();
  });

  it("o ponto de atenção é o texto exato do Relatório, nunca reescrito", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);
    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);

    expect(
      screen.getByText("Ainda não conseguimos confirmar como ocorre o acompanhamento."),
    ).toBeInTheDocument();
  });

  it("uma carta aberta por vez — abrir outra recolhe a primeira", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);

    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);
    expect(screen.getAllByRole("button", { name: "Recolher" })).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);
    expect(screen.getAllByRole("button", { name: "Recolher" })).toHaveLength(1);
  });

  it("guarda a memória de navegação entre visitas", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CaminhosPanel curadoria={CURADORIA} />);

    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);
    await user.click(screen.getByRole("button", { name: "Recolher" }));
    expect(screen.getByText("Você já conheceu este caminho.")).toBeInTheDocument();

    unmount();
    render(<CaminhosPanel curadoria={CURADORIA} />);
    expect(screen.getByText("Você já conheceu este caminho.")).toBeInTheDocument();
  });

  it("navegador sem storage não quebra a experiência", async () => {
    const original = window.localStorage.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage indisponível");
    });

    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);
    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);

    expect(screen.getByText("Como responde ao seu Perfil")).toBeInTheDocument();
    vi.mocked(Storage.prototype.setItem).mockRestore();
    window.localStorage.setItem = original;
  });

  it("a preparação para a escolha só aparece depois dos três conhecidos", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);

    // A porta da Decisão nunca declara suficiência ("agora você já tem o que
    // precisa") — quem percebe que viu o bastante é ela (Linguagem §6/§10.3).
    const frase = /nenhum deles está pré-escolhido/;
    expect(screen.queryByText(frase)).not.toBeInTheDocument();

    // Uma carta por vez, cada uma pelo próprio nome: a lista de botões se
    // reordena a cada abertura, e clicar sempre no primeiro reabriria a mesma.
    for (const nome of ["Dra. Helena Monteiro", "Dr. Rafael Nogueira", "Dra. Marina Azevedo"]) {
      const carta = screen.getByRole("article", { name: nome });
      await user.click(within(carta).getByRole("button", { name: "Conhecer este caminho" }));
    }
    expect(screen.getByText(frase)).toBeInTheDocument();
    expect(screen.queryByText(/informações necessárias/)).not.toBeInTheDocument();
  });
});

describe("Comparação — uma dimensão por vez", () => {
  it("mostra as cinco dimensões como abas e uma só de cada vez", () => {
    render(<ComparacaoCaminhos options={[CURADORIA.options[0]!, CURADORIA.options[1]!]} />);

    expect(screen.getAllByRole("tab")).toHaveLength(5);
    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByRole("heading", { name: "Formação" })).toBeInTheDocument();
    expect(within(painel).queryByRole("heading", { name: "Acesso" })).not.toBeInTheDocument();
  });

  it("trocar de dimensão mostra os mesmos caminhos sob a nova pergunta", async () => {
    const user = userEvent.setup();
    render(<ComparacaoCaminhos options={[CURADORIA.options[0]!, CURADORIA.options[1]!]} />);

    await user.click(screen.getByRole("tab", { name: "Acesso" }));
    const painel = screen.getByRole("tabpanel");
    expect(within(painel).getByRole("heading", { name: "Acesso" })).toBeInTheDocument();
    expect(within(painel).getByText("Dra. Helena Monteiro")).toBeInTheDocument();
    expect(within(painel).getByText("Dr. Rafael Nogueira")).toBeInTheDocument();
  });

  it("com menos de dois caminhos não há o que comparar", () => {
    const { container } = render(<ComparacaoCaminhos options={[CURADORIA.options[0]!]} />);
    expect(container.firstChild).toBeNull();
  });

  it("comparar é escolha da pessoa — nasce vazia e aparece ao marcar dois", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const marcar = screen.getAllByRole("checkbox", { name: "Comparar" });
    await user.click(marcar[0]!);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    await user.click(marcar[1]!);
    expect(screen.getByRole("tablist", { name: "Aspectos" })).toBeInTheDocument();
  });
});

describe("A Mesa — terreno comum, conversa consigo e saídas", () => {
  it("abre pelo Terreno Comum, antes de qualquer carta (O1)", () => {
    const { container } = render(<CaminhosPanel curadoria={CURADORIA} />);
    const html = container.innerHTML;

    const comum = html.indexOf("nenhum entrou por atalho");
    const primeiraCarta = html.indexOf("Conhecer este caminho");
    expect(comum).toBeGreaterThan(-1);
    expect(primeiraCarta).toBeGreaterThan(-1);
    expect(comum, "o comum vem antes das colunas").toBeLessThan(primeiraCarta);
    // Enquadramento, nunca selo coletivo: não se infere qualidade.
    expect(container.textContent).not.toMatch(/excelente|os melhores/i);
  });

  it("a conversa consigo é lugar, não ferramenta: nada coleta, nada exige", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);

    for (const nome of ["Dra. Helena Monteiro", "Dr. Rafael Nogueira", "Dra. Marina Azevedo"]) {
      const carta = screen.getByRole("article", { name: nome });
      await user.click(within(carta).getByRole("button", { name: "Conhecer este caminho" }));
    }

    expect(screen.getByText(/do que você não abre mão/i)).toBeInTheDocument();
    // Nenhum formulário de reflexão: sem campo de texto, sem checklist novo
    // (as únicas caixas são as de "Comparar", que já existiam).
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("nenhuma barra, medidor ou progressbar em toda a Mesa (N6)", async () => {
    const user = userEvent.setup();
    render(<CaminhosPanel curadoria={CURADORIA} />);
    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("meter")).toBeNull();
  });
});

describe("A fronteira de vocabulário vale nas cartas", () => {
  it("nenhuma carta, aberta ou fechada, fala em nota, ranking ou posição", async () => {
    const user = userEvent.setup();
    const { container } = render(<CaminhosPanel curadoria={CURADORIA} />);

    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();

    await user.click(screen.getAllByRole("button", { name: "Conhecer este caminho" })[0]!);
    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });

  it("nenhuma numeração de posição aparece junto aos nomes", () => {
    const { container } = render(<CaminhosPanel curadoria={CURADORIA} />);
    const texto = container.textContent ?? "";
    for (const proibido of ["1ª opção", "2ª opção", "Opção 1", "primeiro", "segundo", "terceiro"]) {
      expect(texto.toLowerCase()).not.toContain(proibido.toLowerCase());
    }
  });
});
