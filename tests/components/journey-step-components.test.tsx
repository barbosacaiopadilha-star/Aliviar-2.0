import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LastUpdate, NextActionCard, ProgressTimeline, StepStatus } from "@/components/journey";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

afterEach(cleanup);

describe("StepStatus — as duas metades da etapa", () => {
  it("mostra o que já sabemos e o que ainda precisa ser decidido", () => {
    render(
      <StepStatus
        settled={["A história foi registrada."]}
        missing={["Registrar o contexto clínico."]}
        completionSentence="Entendi esta pessoa."
      />,
    );
    expect(screen.getByText("O que já sabemos")).toBeInTheDocument();
    expect(screen.getByText("O que ainda precisa ser decidido")).toBeInTheDocument();
    expect(screen.getByText("A história foi registrada.")).toBeInTheDocument();
    expect(screen.getByText("Registrar o contexto clínico.")).toBeInTheDocument();
  });

  it("nunca conta nem mede — sem fração, percentual ou barra", () => {
    const { container } = render(
      <StepStatus
        settled={["Um.", "Dois."]}
        missing={["Três.", "Quatro."]}
        completionSentence="Terminei."
      />,
    );
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/\d\s*de\s*\d/);
    expect(texto).not.toContain("%");
    expect(container.querySelector("progress")).toBeNull();
  });

  it("etapa fechada diz a frase que o Curador consegue dizer", () => {
    render(<StepStatus settled={["Tudo."]} missing={[]} completionSentence="Entendi esta pessoa." />);
    expect(screen.getByText("Entendi esta pessoa.")).toBeInTheDocument();
  });

  it("etapa bloqueada mostra de que depende, nunca um cinza mudo", () => {
    render(
      <StepStatus
        settled={[]}
        missing={["Algo."]}
        blockedReason="O Acolhimento foi concluído."
        completionSentence="Entendi esta pessoa."
      />,
    );
    expect(screen.getByText(/Depende de: O Acolhimento foi concluído\./)).toBeInTheDocument();
  });

  it("dois quadros na mesma tela se distinguem pelo nome da etapa", () => {
    render(
      <>
        <StepStatus stepName="Mapa de Prioridades" settled={[]} missing={["a"]} completionSentence="Sei o que importa para ela." />
        <StepStatus stepName="Curadoria Técnica" settled={[]} missing={["b"]} completionSentence="Escolhi os três caminhos." />
      </>,
    );
    expect(screen.getByText(/“Mapa de Prioridades” está/)).toBeInTheDocument();
    expect(screen.getByText(/“Curadoria Técnica” está/)).toBeInTheDocument();
  });
});

describe("NextActionCard — as quatro perguntas de uma pendência", () => {
  it("responde o que falta, por que importa, a ação e o que vem depois", () => {
    render(
      <NextActionCard
        title="Precisamos conhecer a sua história"
        why="Tudo parte do que você viveu."
        whatHappensNext="Um Curador lê e procura você."
        action={<a href="/sua-historia">Contar minha história</a>}
      />,
    );
    expect(screen.getByText("Precisamos conhecer a sua história")).toBeInTheDocument();
    expect(screen.getByText("Tudo parte do que você viveu.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contar minha história" })).toHaveAttribute(
      "href",
      "/sua-historia",
    );
    expect(screen.getByText(/Depois disso: Um Curador lê e procura você\./)).toBeInTheDocument();
  });

  it("sem pendência, declara o silêncio e ainda diz o que vem depois", () => {
    render(
      <NextActionCard
        nothingPending="Nada depende de você agora."
        whatHappensNext="A equipe segue com o seu caso."
      />,
    );
    expect(screen.getByText("Nada depende de você agora.")).toBeInTheDocument();
    expect(screen.getByText(/Depois disso: A equipe segue/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ProgressTimeline — progresso sem pressão", () => {
  const stages = [
    { id: "a", label: "Primeira", status: "done" as const },
    { id: "b", label: "Segunda", status: "current" as const, href: "/segunda" },
  ];

  it("o resumo é opcional — a jornada do paciente não conta etapas", () => {
    const { container } = render(<ProgressTimeline stages={stages} ariaLabel="Etapas" />);
    expect(container.textContent).not.toMatch(/\d de \d/);
  });

  it("com resumo, é um fato — nunca percentual nem previsão de tempo", () => {
    const { container } = render(
      <ProgressTimeline stages={stages} ariaLabel="Etapas" summary="1 de 2 etapas concluídas" />,
    );
    expect(screen.getByText("1 de 2 etapas concluídas")).toBeInTheDocument();
    expect(container.textContent).not.toContain("%");
    expect(container.textContent).not.toMatch(/minutos?/i);
  });

  it("etapa com destino é link; etapa sem destino não finge ser", () => {
    render(<ProgressTimeline stages={stages} ariaLabel="Etapas" />);
    expect(screen.getByRole("link", { name: /Segunda/ })).toHaveAttribute("href", "/segunda");
    expect(screen.queryByRole("link", { name: /Primeira/ })).not.toBeInTheDocument();
  });
});

describe("LastUpdate — acompanhamento contínuo, sem inventar movimento", () => {
  it("sem evento, diz que ainda não houve — nunca a data de agora", () => {
    render(<LastUpdate at={null} />);
    expect(screen.getByText("Nenhuma movimentação registrada ainda.")).toBeInTheDocument();
  });

  it("com evento, mostra quem e quando", () => {
    render(
      <LastUpdate
        at="2026-07-20T13:42:00.000Z"
        by="Fernanda"
        role="Curadora Médica"
        what="Consulta Inicial concluída."
      />,
    );
    expect(screen.getByText(/Fernanda/)).toBeInTheDocument();
    expect(screen.getByText(/Curadora Médica/)).toBeInTheDocument();
    expect(screen.getByText("Consulta Inicial concluída.")).toBeInTheDocument();
  });

  it("hoje é dito como hoje, com a hora", () => {
    const agora = new Date();
    agora.setHours(10, 42, 0, 0);
    render(<LastUpdate at={agora.toISOString()} by="Fernanda" />);
    expect(screen.getByText(/Hoje às 10:42/)).toBeInTheDocument();
  });
});
