import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  ComparacaoPremium,
  type ComparacaoColuna,
} from "@/components/curadoria/mesa/comparacao-premium";
import { EvidenciaChips } from "@/components/curadoria/mesa/evidencia-chips";
import { FiltrosRapidos } from "@/components/curadoria/mesa/filtros-rapidos";
import { LinhaInvestigacao } from "@/components/curadoria/mesa/linha-investigacao";
import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
import { MesaTimelineDupla } from "@/components/curadoria/mesa/mesa-timeline";
import { PainelAtencao } from "@/components/curadoria/mesa/painel-atencao";
import { PainelHipoteses } from "@/components/curadoria/mesa/painel-hipoteses";
import {
  filtrosDisponiveis,
  hipoteseDe,
  itensDeAtencao,
  linhaDeInvestigacao,
  recorteSentence,
  type InvestigacaoProfissional,
} from "@/modules/curadoria/mesa-investigacao";
import {
  buildMesaEtapas,
  mesaProgress,
  proximaDecisao,
  MESA_ETAPAS,
  type MesaEtapaId,
  type MesaFacts,
} from "@/modules/curadoria/mesa-etapas";

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Comparação premium
// ---------------------------------------------------------------------------

const COLUNAS: ComparacaoColuna[] = [
  {
    id: "a",
    nome: "Dra. Helena",
    technicalScore: 80,
    patientScore: 60,
    technicalCoverageSentence: "Avaliação construída sobre 100 dos 100 pontos.",
    patientCoverageSentence: "Avaliação construída sobre 100 dos 100 pontos.",
    celulas: [
      {
        criterion: "FORMACAO",
        label: "Formação Profissional",
        assessment: "ATENDE_PLENAMENTE",
        pointsSentence: "40/40",
        evidence: "Residência confirmada pelo conselho.",
      },
      {
        criterion: "ACESSO",
        label: "Acesso",
        assessment: "INFORMACAO_INSUFICIENTE",
        pointsSentence: "não avaliável",
        evidence: "Agenda não localizada.",
      },
    ],
  },
  {
    id: "b",
    nome: "Dr. Marcos",
    technicalScore: 55,
    patientScore: 70,
    technicalCoverageSentence: "Avaliação construída sobre 60 dos 100 pontos.",
    patientCoverageSentence: "Avaliação construída sobre 100 dos 100 pontos.",
    celulas: [
      {
        criterion: "FORMACAO",
        label: "Formação Profissional",
        assessment: "ATENDE_PARCIALMENTE",
        pointsSentence: "20/40",
        evidence: "Formação na área correlata.",
      },
      {
        criterion: "ACESSO",
        label: "Acesso",
        assessment: null,
        pointsSentence: "não avaliável",
        evidence: "",
      },
    ],
  },
];

describe("Comparação — colunas limpas, uma célula por vez", () => {
  it("cada profissional é uma coluna e cada critério é uma linha", () => {
    render(<ComparacaoPremium colunas={COLUNAS} />);
    expect(screen.getByRole("columnheader", { name: "Dra. Helena" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Dr. Marcos" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Formação Profissional" })).toBeInTheDocument();
  });

  it("clicar abre apenas aquela célula — nunca a ficha inteira", async () => {
    const user = userEvent.setup();
    render(<ComparacaoPremium colunas={COLUNAS} />);

    expect(screen.queryByText(/Residência confirmada/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Dra. Helena, Formação Profissional/ }));

    expect(screen.getByText(/Residência confirmada/)).toBeInTheDocument();
    // A outra célula da mesma coluna continua fechada.
    expect(screen.queryByText(/Agenda não localizada/)).not.toBeInTheDocument();
  });

  it("uma célula aberta fecha a anterior — a matriz não vira parede de texto", async () => {
    const user = userEvent.setup();
    render(<ComparacaoPremium colunas={COLUNAS} />);

    await user.click(screen.getByRole("button", { name: /Dra. Helena, Formação Profissional/ }));
    await user.click(screen.getByRole("button", { name: /Dr. Marcos, Formação Profissional/ }));

    expect(screen.queryByText(/Residência confirmada/)).not.toBeInTheDocument();
    expect(screen.getByText(/Formação na área correlata/)).toBeInTheDocument();
  });

  it("o estado da célula chega em texto, não só em cor ou marca", () => {
    render(<ComparacaoPremium colunas={COLUNAS} />);
    expect(
      screen.getByRole("button", { name: /Dra. Helena, Acesso: informação insuficiente/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Dr. Marcos, Acesso: sem declaração/ }),
    ).toBeInTheDocument();
  });

  it("célula sem evidência diz isso — não abre um vazio", async () => {
    const user = userEvent.setup();
    render(<ComparacaoPremium colunas={COLUNAS} />);
    await user.click(screen.getByRole("button", { name: /Dr. Marcos, Acesso/ }));
    expect(screen.getByText(/Nenhuma evidência foi registrada/)).toBeInTheDocument();
  });

  it("nenhuma coluna recebe posição, medalha ou pré-marcação", () => {
    const { container } = render(<ComparacaoPremium colunas={COLUNAS} />);
    const texto = container.textContent ?? "";
    for (const proibido of ["1º", "melhor", "ranking", "vencedor", "recomendad", "top "]) {
      expect(texto.toLowerCase()).not.toContain(proibido.toLowerCase());
    }
    expect(texto).toContain("não há colocação");
  });

  it("os dois cruzamentos aparecem separados — nunca somados", () => {
    render(<ComparacaoPremium colunas={COLUNAS} />);
    // Os dois cruzamentos vivem em linhas próprias, cada um com o próprio
    // número — nunca numa soma e nunca na mesma frase.
    const linhas = screen
      .getAllByRole("cell")
      .flatMap((celula) => [...celula.querySelectorAll(".mesa-matriz__linha")])
      .map((linha) => linha.textContent?.replace(/\s+/g, " ").trim());

    expect(linhas).toContain("Avaliação Técnica 80 de 100");
    expect(linhas).toContain("Compatibilidade Assistencial 60 de 100");
    expect(linhas.some((linha) => /total|soma|140|de 200/i.test(linha ?? ""))).toBe(false);
  });

  it("a legenda traduz cada marca — quem não vê cor lê a mesma coisa", () => {
    render(<ComparacaoPremium colunas={COLUNAS} />);
    const legenda = screen.getByText("atende plenamente").closest("ul")!;
    expect(within(legenda).getAllByRole("listitem")).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Chips inteligentes
// ---------------------------------------------------------------------------

describe("Chips inteligentes — o estado inteiro, sem abrir outra tela", () => {
  const EVIDENCIAS = [
    {
      id: "crm",
      label: "CRM",
      estado: "verificado" as const,
      detalhe: "Registro ativo.",
      fonte: "Conselho Regional de Medicina",
      data: "27/07/2026",
      proveniencia: "Consulta ao portal público do conselho",
      observacoes: "Sem anotação disciplinar.",
      historico: ["Verificado em 12/03/2026 — mesmo resultado."],
    },
    {
      id: "fellow",
      label: "Fellowship",
      estado: "divergente" as const,
      detalhe: "Instituição confirma aperfeiçoamento, não fellowship.",
    },
    { id: "hist", label: "Histórico", estado: "ausente" as const, detalhe: "Sem registro." },
    {
      id: "area",
      label: "Área de atuação",
      estado: "nao_verificado" as const,
      detalhe: "Autodeclarada.",
    },
  ];

  it("os quatro estados têm rótulo próprio em texto", () => {
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    expect(screen.getByRole("button", { name: /CRM/ }).textContent).toContain("verificado");
    expect(screen.getByRole("button", { name: /Fellowship/ }).textContent).toContain(
      "fontes divergem",
    );
    expect(screen.getByRole("button", { name: /Histórico/ }).textContent).toContain(
      "não registrado",
    );
    expect(screen.getByRole("button", { name: /Área de atuação/ }).textContent).toContain(
      "aguardando verificação",
    );
  });

  it("expandir entrega fonte, data, proveniência, observações e histórico", async () => {
    const user = userEvent.setup();
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    await user.click(screen.getByRole("button", { name: /CRM/ }));

    expect(screen.getByText("Conselho Regional de Medicina")).toBeInTheDocument();
    expect(screen.getByText("27/07/2026")).toBeInTheDocument();
    expect(screen.getByText(/Consulta ao portal público/)).toBeInTheDocument();
    expect(screen.getByText("Sem anotação disciplinar.")).toBeInTheDocument();
    expect(screen.getByText(/Verificado em 12\/03\/2026/)).toBeInTheDocument();
  });

  it("campo sem registro é dito, não omitido", async () => {
    const user = userEvent.setup();
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    await user.click(screen.getByRole("button", { name: /Fellowship/ }));
    expect(screen.getAllByText("sem registro").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

describe("Filtros instantâneos", () => {
  const REDE: InvestigacaoProfissional[] = [
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
    {
      id: "b",
      nome: "Dr. Marcos",
      estado: "AGUARDANDO_DECLARACAO",
      areaDeclarada: false,
      temDivergencia: false,
      filtrosSemInformacao: 0,
      criteriosPendentes: 0,
      criteriosInsuficientes: 0,
    },
  ];

  function montarFiltros(ativos: Parameters<typeof filtrosDisponiveis>[1] = []) {
    return render(
      <FiltrosRapidos
        filtros={filtrosDisponiveis(REDE, ativos)}
        resumo={recorteSentence(ativos.length ? 1 : 2, 2, ativos.length)}
        onAlternar={() => {}}
        onLimpar={() => {}}
      />,
    );
  }

  it("aplica sem abrir menu — os filtros são botões, ali", () => {
    montarFiltros();
    expect(screen.getByRole("button", { name: /Com divergência/ })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("o estado do filtro é anunciado, não só visual", () => {
    montarFiltros(["DIVERGENCIA"]);
    expect(screen.getByRole("button", { name: /Com divergência/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("todo recorte diz quantos ficaram de fora", () => {
    montarFiltros(["DIVERGENCIA"]);
    const resumo = screen.getByText(/1 de 2 exibido/);
    expect(resumo).toHaveAttribute("aria-live", "polite");
  });

  it("limpar só aparece quando há o que limpar", () => {
    montarFiltros();
    expect(screen.queryByRole("button", { name: "Limpar" })).toBeNull();
    cleanup();
    montarFiltros(["DIVERGENCIA"]);
    expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Painel inteligente e hipóteses
// ---------------------------------------------------------------------------

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

describe("Painel de hipóteses", () => {
  it("devolve o raciocínio e diz que não é registro nem recomendação", () => {
    render(
      <PainelHipoteses
        hipotese={hipoteseDe({
          professionalProfileId: "a",
          nome: "Dra. Helena",
          celulas: [
            {
              label: "Continuidade do Cuidado",
              bloco: "PRIORIDADES",
              assessment: "ATENDE_PLENAMENTE",
            },
          ],
          pendentes: ["Acesso"],
        })}
      />,
    );

    expect(screen.getByText(/Você declarou atendimento pleno/)).toBeInTheDocument();
    expect(screen.getByText("Em investigação")).toBeInTheDocument();
    expect(screen.getByText(/Não é recomendação e não fica registrada/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Linha de investigação e linha do tempo dupla
// ---------------------------------------------------------------------------

describe("Linha de investigação", () => {
  it("marca onde o raciocínio está, sem virar navegação", () => {
    render(
      <LinhaInvestigacao
        etapas={linhaDeInvestigacao({
          budgetsComplete: true,
          eligible: 2,
          criteriaDeclared: 4,
          criteriaTotal: 12,
          selected: 0,
        })}
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Evidências").closest("li")).toHaveAttribute("aria-current", "step");
  });
});

describe("Linha do tempo dupla", () => {
  it("mostra as duas ao mesmo tempo, cada uma com o próprio nome", () => {
    render(
      <MesaTimelineDupla
        paciente={[
          { id: "CONSULTA", label: "Consulta", status: "done" },
          { id: "CURADORIA", label: "Curadoria", status: "current" },
        ]}
        investigacao={[
          { id: "PERFIL", label: "Perfil", status: "done" },
          { id: "REDE", label: "Rede elegível", status: "current" },
        ]}
      />,
    );

    const doPaciente = screen.getByRole("list", { name: "Jornada do paciente" });
    const daInvestigacao = screen.getByRole("list", { name: "Investigação do Curador" });

    expect(within(doPaciente).getByText("Curadoria")).toBeInTheDocument();
    expect(within(daInvestigacao).getByText("Rede elegível")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Atalhos — dentro da Mesa inteira
// ---------------------------------------------------------------------------

const FATOS: MesaFacts = {
  profileValidated: true,
  mapPending: 0,
  professionalsFound: 4,
  awaitingAreaDeclaration: 0,
  eligible: 3,
  criteriaAwaiting: 6,
  selected: 0,
  reportExists: false,
  reportApproved: false,
  reportEmitted: false,
};

function montarMesa() {
  const etapas = buildMesaEtapas(FATOS);
  const decisao = proximaDecisao(etapas, FATOS.profileValidated);
  return render(
    <MesaShell
      patientName="Maria Andrade"
      areaRequirement="Ortopedia de coluna"
      curatorName="Dra. Ana"
      progress={mesaProgress(etapas)}
      decisao={decisao}
      alerts={[]}
      etapas={etapas}
      totalProfissionais={2}
      linha={linhaDeInvestigacao({
        budgetsComplete: true,
        eligible: 3,
        criteriaDeclared: 12,
        criteriaTotal: 18,
        selected: 0,
      })}
      conteudo={
        Object.fromEntries(
          MESA_ETAPAS.map((etapa) => [etapa, <p key={etapa}>Trabalho de {etapa}</p>]),
        ) as Record<MesaEtapaId, React.ReactNode>
      }
      contexto={
        <input aria-label="Anotação do caso" defaultValue="" />
      }
      timeline={<p>Linha do tempo</p>}
    />,
  );
}

describe("Atalhos de teclado", () => {
  it("] e [ andam pelas etapas sem trocar de página", async () => {
    const user = userEvent.setup();
    montarMesa();

    expect(screen.getByText("Trabalho de AVALIACAO")).toBeInTheDocument();
    await user.keyboard("]");
    expect(screen.getByText("Trabalho de COMPATIBILIDADE")).toBeInTheDocument();
    await user.keyboard("[["); // "[[" é o escape do userEvent para a tecla "["
    expect(screen.getByText("Trabalho de AVALIACAO")).toBeInTheDocument();
    // O contexto nunca some ao navegar por tecla.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Maria Andrade");
  });

  it("param nas pontas — não circulam do Relatório de volta ao Perfil", async () => {
    const user = userEvent.setup();
    montarMesa();
    await user.keyboard("]]]]]]]]");
    expect(screen.getByText("Trabalho de RELATORIO")).toBeInTheDocument();
    await user.keyboard("]");
    expect(screen.getByText("Trabalho de RELATORIO")).toBeInTheDocument();
  });

  it("C e R levam à comparação e ao Relatório", async () => {
    const user = userEvent.setup();
    montarMesa();
    await user.keyboard("c");
    expect(screen.getByText("Trabalho de CRUZAMENTO")).toBeInTheDocument();
    await user.keyboard("r");
    expect(screen.getByText("Trabalho de RELATORIO")).toBeInTheDocument();
  });

  it("? abre a ajuda, Esc fecha", async () => {
    const user = userEvent.setup();
    montarMesa();

    expect(screen.queryByRole("dialog")).toBeNull();
    await user.keyboard("?");
    const ajuda = screen.getByRole("dialog", { name: "Atalhos da Mesa" });
    expect(within(ajuda).getByText(/Próximo profissional/)).toBeInTheDocument();
    expect(
      within(ajuda).getByText(/Nenhum atalho gera, aprova ou emite o Relatório/),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a ajuda também abre por clique — atalho é aceleração, nunca requisito", async () => {
    const user = userEvent.setup();
    montarMesa();
    await user.click(screen.getByRole("button", { name: /Atalhos/ }));
    expect(screen.getByRole("dialog", { name: "Atalhos da Mesa" })).toBeInTheDocument();
  });

  it("não rouba a tecla de quem está escrevendo", async () => {
    const user = userEvent.setup();
    montarMesa();

    const campo = screen.getByLabelText("Anotação do caso");
    await user.click(campo);
    await user.keyboard("cr]");

    expect(campo).toHaveValue("cr]");
    expect(screen.getByText("Trabalho de AVALIACAO")).toBeInTheDocument();
  });
});
