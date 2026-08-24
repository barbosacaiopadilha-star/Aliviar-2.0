import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import { ambienceFor } from "@/modules/paciente/ambiente";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

describe("AmbientHero — responde visualmente antes de textualmente", () => {
  it("traz uma ideia só: quem chegou e onde a jornada está", () => {
    render(<AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Olá, João.");
    expect(screen.getByText("Curadoria em andamento")).toBeInTheDocument();
    expect(
      screen.getByText("Seu Curador está analisando cuidadosamente o seu caso."),
    ).toBeInTheDocument();
  });

  /**
   * 24/08 ("as configurações visuais da landing") · a cena saiu de DENTRO do
   * hero — a fotografia é a casa inteira agora (PatientAmbientLayer) e o
   * hero é card de vidro. O que estes oráculos passam a guardar: nenhuma
   * foto própria volta ao hero por descuido, e a MENSAGEM continua sendo a
   * linguagem que muda com a etapa (Storytelling Ambiental).
   */
  it("o hero é vidro sobre a cena da casa — sem foto própria", () => {
    const { container } = render(
      <AmbientHero firstName="Maria" stage="DOSSIE" eyebrow="Sua Curadoria está pronta" />,
    );

    expect(container.querySelector(".patient-hero__scene")).toBeNull();
    expect(container.querySelector("section")?.className).toContain("patient-veu");
    // A mensagem da etapa continua chegando — é ela que carrega o ambiente.
    expect(screen.getByText(ambienceFor("DOSSIE").message)).toBeInTheDocument();
  });

  it("o ambiente muda com a etapa — é linguagem, não decoração fixa", () => {
    render(<AmbientHero firstName="Ana" stage="CONSULTA_INICIAL" eyebrow="Sua jornada começa" />);
    const mensagemConsulta = ambienceFor("CONSULTA_INICIAL").message;
    expect(screen.getByText(mensagemConsulta)).toBeInTheDocument();
    cleanup();

    render(<AmbientHero firstName="Ana" stage="ACOMPANHAMENTO" eyebrow="Seguimos com você" />);
    expect(screen.getByText(ambienceFor("ACOMPANHAMENTO").message)).toBeInTheDocument();
    expect(ambienceFor("ACOMPANHAMENTO").message).not.toBe(mensagemConsulta);
  });
});

/* MERGE/CORTE DE 23/08 · os describes de JourneyWalk, ProfileCard e
   CuradoriaCard saíram COM os componentes: uso zero com substituto vivo
   (contrato 32 §4) — a régua vive em Sua Jornada (JornadaNarrativa), o Mapa
   em Meus dados (PerfilPanel), e o cartão da Curadoria virou o BlocoCuradoria
   dentro do próprio Início. */

/* 23/08 · o ExpandableSection saiu com substituto vivo: a Dobra (`<details>`
   nativo) é o primitivo do Progressive Disclosure agora — acessível de
   graça, zero estado, testada nas cartas e no Mapa. */

describe("A experiência inteira respeita a fronteira de vocabulário", () => {
  it("nenhuma superfície nova fala em nota, ranking ou mecanismo", () => {
    // As superfícies que saíram (régua, cartões-resumo) são varridas nas
    // telas que as substituíram; aqui fica o que este arquivo ainda cobre.
    const { container } = render(
      <AmbientHero firstName="João" stage="CURADORIA" eyebrow="Curadoria em andamento" />,
    );

    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
