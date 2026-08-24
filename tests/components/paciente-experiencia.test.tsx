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
