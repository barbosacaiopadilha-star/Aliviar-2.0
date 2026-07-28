import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { EvidenciaChips } from "@/components/curadoria/mesa/evidencia-chips";
import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
import { MesaTimeline } from "@/components/curadoria/mesa/mesa-timeline";
import { RedeVazia, RelatorioNaoGerado } from "@/components/curadoria/mesa/mesa-vazios";
import {
  buildMesaEtapas,
  mesaProgress,
  proximaDecisao,
  MESA_ETAPAS,
  type MesaEtapaId,
  type MesaFacts,
} from "@/modules/curadoria/mesa-etapas";

afterEach(cleanup);

const FATOS: MesaFacts = {
  profileAcknowledged: true,
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

function conteudoFalso(): Record<MesaEtapaId, React.ReactNode> {
  return Object.fromEntries(
    MESA_ETAPAS.map((etapa) => [etapa, <p key={etapa}>Trabalho de {etapa}</p>]),
  ) as Record<MesaEtapaId, React.ReactNode>;
}

function montar(facts: MesaFacts = FATOS, alerts: string[] = []) {
  const etapas = buildMesaEtapas(facts);
  const decisao = proximaDecisao(etapas, facts.profileAcknowledged);
  return render(
    <MesaShell
      patientName="Maria Andrade"
      areaRequirement="Ortopedia de coluna"
      curatorName="Dra. Ana"
      progress={mesaProgress(etapas)}
      decisao={decisao}
      alerts={alerts}
      etapas={etapas}
      conteudo={conteudoFalso()}
      contexto={<p>Contexto do caso</p>}
      timeline={
        <MesaTimeline
          marks={[
            { id: "CONSULTA", label: "Consulta", status: "done" },
            { id: "PERFIL", label: "Perfil", status: "done" },
            { id: "CURADORIA", label: "Curadoria", status: "current" },
            { id: "ENTREGA", label: "Entrega", status: "ahead" },
          ]}
        />
      }
    />,
  );
}

describe("Painel A — contexto que não sai da tela", () => {
  it("mostra paciente, área, Curador e progresso da investigação", () => {
    montar();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Maria Andrade");
    expect(screen.getByText(/Ortopedia de coluna · Dra. Ana · 2 de 7 etapas/)).toBeInTheDocument();
  });

  it("diz qual é a próxima decisão, e ela é anunciada", () => {
    montar();
    const decisao = screen.getByText(/Sua vez:/);
    expect(decisao).toHaveTextContent("6 critérios sem avaliação");
    expect(decisao).toHaveAttribute("aria-live", "polite");
  });

  it("quando nada depende do Curador, a frase deixa de cobrá-lo", () => {
    montar({ ...FATOS, professionalsFound: 0, eligible: 0, criteriaAwaiting: 0 });
    expect(screen.queryByText(/Sua vez:/)).not.toBeInTheDocument();
    const cabecalho = screen.getByRole("banner");
    expect(within(cabecalho).getByText(/Nenhum profissional publicado/)).toBeInTheDocument();
  });

  it("alerta nunca é escondido para o cabeçalho parecer limpo", () => {
    montar(FATOS, ["Divergência crítica em aberto"]);
    expect(screen.getByText("Divergência crítica em aberto")).toBeInTheDocument();
  });
});

describe("Painel B — as sete etapas, no mesmo ambiente", () => {
  it("abre onde está a próxima decisão", () => {
    montar();
    const nav = screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" });
    const ativa = within(nav).getByRole("button", { current: "step" });
    expect(ativa).toHaveTextContent("Avaliação técnica");
  });

  it("trocar de etapa troca a área de trabalho, não a página", async () => {
    const user = userEvent.setup();
    montar();

    expect(screen.getByText("Trabalho de AVALIACAO")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Mapa de Prioridades/ }));

    expect(screen.getByText("Trabalho de PERFIL")).toBeInTheDocument();
    expect(screen.queryByText("Trabalho de AVALIACAO")).not.toBeInTheDocument();
    // O contexto permaneceu: nada de perder o caso ao navegar.
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Maria Andrade");
    expect(screen.getByText("Contexto do caso")).toBeInTheDocument();
  });

  it("nenhuma etapa é bloqueada — o Curador entra onde quiser", async () => {
    const user = userEvent.setup();
    montar({ ...FATOS, mapPending: 4, eligible: 0, professionalsFound: 0 });

    const nav = screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" });
    for (const botao of within(nav).getAllByRole("button")) {
      expect(botao).not.toBeDisabled();
    }

    await user.click(within(nav).getByRole("button", { name: /Relatório/ }));
    expect(screen.getByText("Trabalho de RELATORIO")).toBeInTheDocument();
  });

  it("o estado de cada etapa chega a leitor de tela, nunca só em marca visual", () => {
    montar();
    const nav = screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" });
    expect(within(nav).getByRole("button", { name: /Mapa de Prioridades/ }).textContent).toContain("respondida");
    expect(within(nav).getByRole("button", { name: /Cruzamento/ }).textContent).toContain(
      "depende de outra etapa",
    );
  });

  it("cada etapa mostra a pergunta que o Curador responde nela", async () => {
    const user = userEvent.setup();
    montar();
    await user.click(screen.getByRole("button", { name: /Rede elegível/ }));
    expect(
      screen.getByRole("heading", { name: "Quem pode participar desta Curadoria?" }),
    ).toBeInTheDocument();
  });
});

describe("Painel D — contexto e linha do tempo persistentes", () => {
  it("a linha do tempo do Case fica visível em qualquer etapa", async () => {
    const user = userEvent.setup();
    montar();

    const aside = screen.getByRole("complementary", { name: "Contexto do Case" });
    expect(within(aside).getByText("Consulta")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Relatório/ }));
    expect(within(aside).getByText("Consulta")).toBeInTheDocument();
  });

  it("a linha do tempo orienta, não navega — nenhum link nela", () => {
    render(
      <MesaTimeline
        marks={[
          { id: "CONSULTA", label: "Consulta", status: "done" },
          { id: "CURADORIA", label: "Curadoria", status: "current" },
        ]}
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Curadoria").closest("li")).toHaveAttribute("aria-current", "step");
  });
});

describe("Evidências como chips", () => {
  const EVIDENCIAS = [
    { id: "crm", label: "CRM", estado: "verificado" as const, detalhe: "Conselho consultado em 27/07." },
    { id: "fellow", label: "Fellowship", estado: "divergente" as const, detalhe: "Instituição confirma aperfeiçoamento." },
    { id: "hist", label: "Histórico", estado: "ausente" as const, detalhe: "Nenhum vínculo registrado." },
  ];

  it("mostra tudo num relance, com o estado em texto", () => {
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    expect(screen.getByRole("button", { name: /CRM/ }).textContent).toContain("verificado");
    expect(screen.getByRole("button", { name: /Fellowship/ }).textContent).toContain("fontes divergem");
    expect(screen.getByRole("button", { name: /Histórico/ }).textContent).toContain("não registrado");
  });

  it("o detalhe abre sob demanda, um por vez", async () => {
    const user = userEvent.setup();
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);

    expect(screen.queryByText(/Conselho consultado/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /CRM/ }));
    expect(screen.getByText(/Conselho consultado/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fellowship/ }));
    expect(screen.queryByText(/Conselho consultado/)).not.toBeInTheDocument();
    expect(screen.getByText(/Instituição confirma aperfeiçoamento/)).toBeInTheDocument();
  });

  it("divergência e ausência não somem para a fileira ficar bonita", () => {
    render(<EvidenciaChips evidencias={EVIDENCIAS} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("sem evidência, diz isso em vez de mostrar fileira vazia", () => {
    render(<EvidenciaChips evidencias={[]} />);
    expect(screen.getByText(/Nenhuma evidência registrada/)).toBeInTheDocument();
  });
});

describe("Estados vazios da Mesa — orientam, nunca parecem erro", () => {
  it.each([
    { nome: "Rede vazia", ui: <RedeVazia /> },
    { nome: "Relatório não gerado", ui: <RelatorioNaoGerado /> },
  ])("$nome diz o que houve e qual é o próximo passo", ({ ui }) => {
    const { container } = render(ui);
    const texto = container.textContent ?? "";

    expect(texto.length).toBeGreaterThan(80);
    // "não é um erro da tela" tranquiliza — o que se proíbe é ENQUADRAR a
    // situação como falha do sistema.
    for (const proibido of ["ocorreu um erro", "erro ao", "falha ao", "não foi possível", "inválido"]) {
      expect(texto.toLowerCase(), `enquadramento de falha: ${proibido}`).not.toContain(proibido);
    }
  });

  it("a Rede sem elegíveis é dita como resultado válido, não como defeito", () => {
    render(<RedeVazia />);
    expect(screen.getByText(/resultado válido/)).toBeInTheDocument();
  });
});
