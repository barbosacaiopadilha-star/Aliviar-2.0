import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import { CuradoriaCard } from "@/components/paciente/experiencia/curadoria-card";
import { ExpandableSection } from "@/components/paciente/experiencia/expandable-section";
import { JourneyWalk, type WalkStage } from "@/components/paciente/experiencia/journey-walk";
import { ProfileCard } from "@/components/paciente/experiencia/profile-card";
import { ambienceFor } from "@/modules/paciente/ambiente";
import { buildPerfilView, violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

/** O que ela declarou — ADR-042: níveis, nunca pontos. */
const MAPA = [
  { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" as const },
];

const CAMINHADA: WalkStage[] = [
  { id: "CONSULTA_INICIAL", label: "Consulta", status: "done" },
  { id: "PERFIL_DE_PRIORIDADES", label: "Perfil", status: "done" },
  { id: "CURADORIA", label: "Curadoria", status: "current" },
  { id: "DOSSIE", label: "Relatório", status: "ahead" },
  { id: "ESCOLHA", label: "Escolha", status: "ahead" },
];

describe("AmbientHero — responde visualmente antes de textualmente", () => {
  it("traz uma ideia só: quem chegou e onde a jornada está", () => {
    render(<AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Olá, João.");
    expect(screen.getByText("Curadoria em andamento")).toBeInTheDocument();
    expect(
      screen.getByText("Seu Curador está analisando cuidadosamente o seu caso."),
    ).toBeInTheDocument();
  });

  it("a cena é decorativa para quem vê e descrita para quem não vê", () => {
    const { container } = render(
      <AmbientHero firstName="Maria" stage="DOSSIE" eyebrow="Sua Curadoria está pronta" />,
    );

    // A imagem de fundo não é anunciada como conteúdo…
    expect(container.querySelector(".patient-hero__scene")).toHaveAttribute("aria-hidden", "true");
    // …mas a informação que ela carrega chega em texto.
    //
    // MASTER-0B · a asserção lê a projeção, não um literal. A frase estava
    // escrita à mão aqui ("ambiente amplo e aberto") e virou oráculo defasado
    // no instante em que a cena do DOSSIE mudou — descrevendo para leitor de
    // tela uma foto que a etapa não usa mais. O que este teste protege é o
    // PAR: cena escondida, descrição presente.
    expect(screen.getByText(ambienceFor("DOSSIE").sceneDescription)).toBeInTheDocument();
  });

  it("o ambiente muda com a etapa — é linguagem, não decoração fixa", () => {
    const { container: consulta } = render(
      <AmbientHero firstName="Ana" stage="CONSULTA_INICIAL" eyebrow="Sua jornada começa" />,
    );
    const cenaConsulta = consulta.querySelector(".patient-hero__scene")?.getAttribute("style");
    cleanup();

    const { container: acompanhamento } = render(
      <AmbientHero firstName="Ana" stage="ACOMPANHAMENTO" eyebrow="Seguimos com você" />,
    );
    const cenaAcompanhamento = acompanhamento.querySelector(".patient-hero__scene")?.getAttribute("style");

    expect(cenaConsulta).not.toBe(cenaAcompanhamento);
  });
});

describe("JourneyWalk — caminhada, não lista de pendências", () => {
  it("a etapa atual é a única que fala; as demais são marcas discretas", () => {
    render(<JourneyWalk stages={CAMINHADA} currentDetail="Estamos comparando profissionais." />);

    const atual = screen.getByText("Curadoria").closest("li")!;
    expect(atual).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(/Estamos comparando profissionais/)).toBeInTheDocument();

    // Nenhuma etapa futura carrega descrição própria — só o rótulo.
    const futura = screen.getByText("Relatório").closest("li")!;
    expect(within(futura).queryByText(/\./)).toBeNull();
  });

  it("o estado de cada etapa chega a leitor de tela, nunca só em cor", () => {
    render(<JourneyWalk stages={CAMINHADA} currentDetail="Em andamento." />);

    const concluida = screen.getByText("Consulta").closest("li")!;
    expect(concluida.textContent).toContain("concluída");
    const futura = screen.getByText("Escolha").closest("li")!;
    expect(futura.textContent).toContain("ainda por vir");
  });
});

describe("ProfileCard — resumo primeiro, detalhe sob demanda", () => {
  it("mostra três respostas e nada mais; o painel completo fica fechado", () => {
    render(<ProfileCard perfil={buildPerfilView(MAPA, true)} />);

    // O cartão antecipa o que mais importa, em vez de contar critérios.
    expect(screen.getByText("O que mais importa para o seu caso")).toBeInTheDocument();
    expect(screen.getByText("Muito importante")).toBeInTheDocument();
    expect(screen.getByText("Residência médica")).toBeInTheDocument();
    expect(screen.getByText("Reconhecido por você")).toBeInTheDocument();

    // Progressive Disclosure: o retrato completo não está na tela ainda.
    expect(screen.queryByText("Não influencia este caso")).toBeNull();
    expect(screen.getByRole("button", { name: /Conhecer meu Perfil/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("abrir revela o Perfil completo no mesmo lugar, sem trocar de página", async () => {
    const user = userEvent.setup();
    render(<ProfileCard perfil={buildPerfilView(MAPA, true)} />);

    await user.click(screen.getByRole("button", { name: /Conhecer meu Perfil/ }));

    expect(screen.getAllByText("O que mais importa para o seu caso").length).toBe(2);
    expect(screen.getByRole("button", { name: /Recolher meu Perfil/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("Perfil em construção diz 'em conversa' em vez de zero", () => {
    render(<ProfileCard perfil={buildPerfilView([], false)} />);
    expect(screen.getAllByText("Em conversa").length).toBeGreaterThan(0);
    expect(screen.getByText("Ainda com você")).toBeInTheDocument();
  });
});

describe("CuradoriaCard — uma frase, uma ação", () => {
  it("com ação, oferece o caminho; sem ação, não inventa botão", () => {
    const { rerender } = render(
      <CuradoriaCard
        message="Nossa equipe está comparando profissionais."
        action={{ label: "Acompanhar", href: "/paciente/curadoria" }}
      />,
    );
    expect(screen.getByRole("link", { name: "Acompanhar" })).toHaveAttribute(
      "href",
      "/paciente/curadoria",
    );

    rerender(<CuradoriaCard message="Estamos ouvindo a sua história." />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("ExpandableSection — o primitivo do Progressive Disclosure", () => {
  it("alterna estado com teclado e anuncia a região que controla", async () => {
    const user = userEvent.setup();
    render(
      <ExpandableSection label="Ver detalhes">
        <p>Conteúdo revelado.</p>
      </ExpandableSection>,
    );

    const botao = screen.getByRole("button", { name: /Ver detalhes/ });
    expect(botao).toHaveAttribute("aria-controls");
    expect(screen.queryByText("Conteúdo revelado.")).not.toBeInTheDocument();

    botao.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Conteúdo revelado.")).toBeInTheDocument();
  });
});

describe("A experiência inteira respeita a fronteira de vocabulário", () => {
  it("nenhuma superfície nova fala em nota, ranking ou mecanismo", () => {
    const { container } = render(
      <div>
        <AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" />
        <JourneyWalk stages={CAMINHADA} currentDetail="Estamos comparando profissionais." />
        <ProfileCard perfil={buildPerfilView(MAPA, true)} />
        <CuradoriaCard message="Nossa equipe está comparando profissionais." />
      </div>,
    );

    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
