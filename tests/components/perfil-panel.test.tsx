import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PerfilPanel } from "@/components/paciente/perfil-panel";
import { buildPerfilView, violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

/** O que ela declarou — ADR-042: níveis, nunca pontos. */
const MAPA = [
  { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "EXPERIENCIA_CASOS_SEMELHANTES", importance: "MUITO_IMPORTANTE" as const },
  { subcriterionCode: "CONTINUIDADE_RETORNOS", importance: "IMPORTANTE" as const },
  { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" as const },
  { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "RELEVANTE" as const },
  { subcriterionCode: "HISTORICO_PRODUCAO_ACADEMICA", importance: "NAO_INFLUENCIA" as const },
];

describe("PerfilPanel — o que mais importa, nas palavras dela", () => {
  it("agrupa os fatores pelos níveis que ela declarou", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);

    expect(screen.getByText("O que mais importa para o seu caso")).toBeInTheDocument();
    expect(screen.getByText("Muito importante")).toBeInTheDocument();
    expect(screen.getByText("Importante")).toBeInTheDocument();
    expect(screen.getByText("Relevante")).toBeInTheDocument();

    expect(screen.getByText("Residência médica")).toBeInTheDocument();
    expect(screen.getByText("Casos semelhantes")).toBeInTheDocument();
    expect(screen.getByText("Comunicação")).toBeInTheDocument();
  });

  it("não esconde o que ela deixou de fora", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(screen.getByText("Não influencia este caso")).toBeInTheDocument();
    expect(screen.getByText("Produção acadêmica")).toBeInTheDocument();
  });

  it("nenhum ponto, porcentagem ou barra de progresso sobrou", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    const texto = container.textContent ?? "";

    expect(screen.queryByRole("progressbar")).toBeNull();
    for (const proibido of ["pts", "pontos", "%", "orçamento", "peso"]) {
      expect(texto.toLowerCase(), `mecanismo interno vazou: ${proibido}`).not.toContain(proibido);
    }
    expect(texto, "nenhum número na tela dela").not.toMatch(/\d/);
  });

  it("mapa vazio: diz que nasce da conversa, sem simular retrato pronto", () => {
    render(<PerfilPanel perfil={buildPerfilView([], false)} />);
    expect(screen.getByText(/definido na conversa com seu Curador/)).toBeInTheDocument();
  });

  it("sem validação, a confirmação é dita como conversa — nunca como botão", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, false)} />);
    expect(screen.getByText(/A Curadoria só começa depois desse seu sim/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("validado, some a pergunta e a frase muda de dono", () => {
    render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(screen.queryByText(/depois desse seu sim/)).toBeNull();
    expect(screen.getByText(/Este Perfil é seu/)).toBeInTheDocument();
  });

  it("o painel inteiro respeita o vocabulário do paciente", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(MAPA, true)} />);
    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
