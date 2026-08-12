import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { MesaShell } from "@/components/curadoria/mesa/mesa-shell";
import { linhaDeInvestigacao } from "@/modules/curadoria/mesa-investigacao";
import {
  buildMesaEtapas,
  mesaProgress,
  proximaDecisao,
  MESA_ETAPAS,
  MESA_ETAPA_LABELS,
  MESA_ETAPA_QUESTIONS,
  type MesaEtapaId,
  type MesaFacts,
} from "@/modules/curadoria/mesa-etapas";

/**
 * A-1 · O RÓTULO DA ETAPA SAIU DA ÁREA DE TRABALHO.
 *
 * `MESA_ETAPA_LABELS[etapaAtual]` era renderizado em três lugares ao mesmo
 * tempo. Dois têm função distinta e permanecem:
 *
 *   A · trilha (`mesa-step__label`, `aria-current="step"`) → onde estou
 *   B · faixa de pendência (E-1)                          → de qual etapa fala
 *   C · `mesa-work__title`                                → nada
 *
 * Só C saiu. Nenhuma string mudou, nenhum estado mudou, nenhum domínio foi
 * tocado: a pergunta assume o primeiro nível de conteúdo, que já era o papel
 * dela.
 */

afterEach(cleanup);

const FATOS: MesaFacts = {
  profileAcknowledged: true,
  mapPending: 0,
  professionalsFound: 4,
  awaitingAreaDeclaration: 2, // ← deixa REDE pendente: a faixa do E-1 aparece
  eligible: 3,
  criteriaAwaiting: 6,
  julgamentosAguardando: 0,
  regimeDaAvaliacao: "LEGADO_6XN",
  selected: 0,
  reportExists: false,
  reportApproved: false,
  reportEmitted: false,
};

function montarMesa() {
  const etapas = buildMesaEtapas(FATOS);
  const decisao = proximaDecisao(etapas, FATOS.profileAcknowledged);
  render(
    <MesaShell
      patientName="Maria Andrade"
      areaRequirement="Ortopedia de coluna"
      curatorName="Dra. Ana"
      estado={{ ...mesaProgress(etapas), decisao }}
      alerts={[]}
      etapas={etapas}
      totalProfissionais={2}
      linha={linhaDeInvestigacao({
        mapaCompleto: true,
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
      contexto={<input aria-label="Anotação do caso" defaultValue="" />}
      timeline={<p>Linha do tempo</p>}
    />,
  );
  return { etapas, decisao };
}

/** A etapa que a Mesa abre — a mesma que o shell recebe em `decisao.etapa`. */
function etapaAberta() {
  const { decisao } = montarMesa();
  return decisao.etapa;
}

describe("A-1 · o rótulo saiu do trabalho, não da Mesa", () => {
  it("T-A1-1 · a etapa continua identificável NA TRILHA", () => {
    const etapa = etapaAberta();
    const trilha = screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" });
    // O botão da etapa aberta é o único com `aria-current="step"`...
    const ativos = within(trilha)
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-current") === "step");
    expect(ativos).toHaveLength(1);
    // ...e carrega exatamente o rótulo daquela etapa, da mesma constante.
    expect(ativos[0]!.textContent).toContain(MESA_ETAPA_LABELS[etapa]);
    expect(ativos[0]!.className).toContain("mesa-step--ativa");
  });

  it("T-A1-2 · a pergunta continua visível — e agora é o PRIMEIRO título do trabalho", () => {
    const etapa = etapaAberta();
    const pergunta = document.querySelector(".mesa-work__question");
    expect(pergunta?.textContent).toBe(MESA_ETAPA_QUESTIONS[etapa]);

    // Primeiro título da área de trabalho, sem nada de texto acima além da
    // linha de investigação (que é lista, não título).
    const work = document.querySelector(".mesa-work")!;
    const titulos = [...work.querySelectorAll("h1,h2,h3,h4,h5,h6")];
    expect(titulos[0]).toBe(pergunta);
  });

  it("T-A1-3 · `mesa-work__title` deixou de renderizar", () => {
    montarMesa();
    expect(document.querySelector(".mesa-work__title")).toBeNull();
  });

  it("T-A1-3b · e o rótulo não aparece mais DENTRO da área de trabalho", () => {
    const etapa = etapaAberta();
    const work = document.querySelector(".mesa-work")!;
    // A trilha e a faixa vivem fora de `.mesa-work` — dentro dela, zero.
    expect(work.textContent).not.toContain(MESA_ETAPA_LABELS[etapa]);
  });

  it("T-A1-4 · nenhum conteúdo funcional da etapa desapareceu", () => {
    const etapa = etapaAberta();
    expect(screen.getByText(`Trabalho de ${etapa}`)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Maria Andrade");
    expect(screen.getByLabelText("Anotação do caso")).toBeInTheDocument();
    // A Mesa entrega a timeline em mais de um slot (contexto e painel).
    expect(screen.getAllByText("Linha do tempo").length).toBeGreaterThan(0);
    // A linha de investigação, que fica logo acima da pergunta, continua lá.
    expect(document.querySelector(".mesa-raciocinio")).toBeTruthy();
  });

  it("T-A1-5 · `pending` e `waitingOn` intactos — faixa visual E `sr-only`", () => {
    const { etapas } = montarMesa();
    const pendentes = etapas.filter((e) => e.pending !== null);
    expect(pendentes.length, "o cenário precisa ter pendência para provar isto").toBeGreaterThan(0);

    const faixa = document.querySelector(".mesa-steps__pendencias");
    expect(faixa).toBeTruthy();
    // A faixa continua nomeando a etapa — ocorrência B, que NÃO é alvo de A-1.
    const rotulosNaFaixa = [...document.querySelectorAll(".mesa-steps__pendencia-etapa")].map(
      (n) => n.textContent ?? "",
    );
    expect(rotulosNaFaixa.length).toBeGreaterThan(0);
    expect(rotulosNaFaixa.some((r) => r.length > 0)).toBe(true);

    // E o leitor de tela continua recebendo a frase, como no E-1.
    const srOnly = [...document.querySelectorAll(".sr-only")].map((n) => n.textContent ?? "");
    expect(srOnly.some((t) => t.includes(pendentes[0]!.pending!))).toBe(true);
  });

  it("T-A1-6 · a estrutura acima do conteúdo encolheu — uma linha de texto a menos", () => {
    const etapa = etapaAberta();
    const work = document.querySelector(".mesa-work")!;
    // Entre a trilha e o conteúdo sobra UM bloco de texto: a pergunta.
    // (jsdom não faz layout; o ganho em pixels foi medido no navegador real.)
    const blocosDeTexto = [...work.children].filter(
      (n) => n.tagName === "P" || /^H[1-6]$/.test(n.tagName),
    );
    expect(blocosDeTexto).toHaveLength(1);
    expect(blocosDeTexto[0]!.textContent).toBe(MESA_ETAPA_QUESTIONS[etapa]);
  });

  it("T-A1-7 · trocar de etapa continua trocando pergunta, conteúdo e estado da trilha", async () => {
    const user = userEvent.setup();
    const { etapas } = montarMesa();
    const trilha = screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" });

    const atual = () =>
      within(trilha)
        .getAllByRole("button")
        .find((b) => b.getAttribute("aria-current") === "step")!;

    const inicial = atual().textContent ?? "";
    // Vai para uma etapa diferente da aberta, pela própria trilha.
    const destino = etapas.find((e) => !inicial.includes(MESA_ETAPA_LABELS[e.id]))!;
    await user.click(
      within(trilha)
        .getAllByRole("button")
        .find((b) => (b.textContent ?? "").includes(MESA_ETAPA_LABELS[destino.id]))!,
    );

    // Pergunta, conteúdo e trilha acompanham — sem depender do título removido.
    expect(document.querySelector(".mesa-work__question")?.textContent).toBe(
      MESA_ETAPA_QUESTIONS[destino.id],
    );
    expect(screen.getByText(`Trabalho de ${destino.id}`)).toBeInTheDocument();
    expect(atual().textContent).toContain(MESA_ETAPA_LABELS[destino.id]);
    expect(document.querySelector(".mesa-work__title")).toBeNull();
  });

  it("T-A1-7b · os atalhos de teclado seguem intactos", async () => {
    const user = userEvent.setup();
    montarMesa();
    const antes = document.querySelector(".mesa-work__question")?.textContent;
    await user.keyboard("]");
    const depois = document.querySelector(".mesa-work__question")?.textContent;
    expect(depois).not.toBe(antes);
    expect(document.querySelector(".mesa-work__title")).toBeNull();
  });

  it("§11 · não-regressão semântica: rótulos, perguntas e etapas intactos", () => {
    // A-1 é de renderização. As constantes do domínio não foram tocadas.
    expect(MESA_ETAPAS.length).toBe(6);
    for (const etapa of MESA_ETAPAS) {
      expect(MESA_ETAPA_LABELS[etapa]?.length).toBeGreaterThan(0);
      expect(MESA_ETAPA_QUESTIONS[etapa]?.length).toBeGreaterThan(0);
    }
    // E o rótulo continua existindo e sendo usado — pela trilha.
    const etapa = etapaAberta();
    expect(screen.getAllByText(MESA_ETAPA_LABELS[etapa]).length).toBeGreaterThan(0);
  });
});
