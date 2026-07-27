import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PerfilPanel } from "@/components/paciente/perfil-panel";
import { buildPerfilView, violatesPatientVocabulary } from "@/modules/paciente/experiencia";

afterEach(cleanup);

const PESOS = {
  FORMACAO: 30,
  EXPERIENCIA: 50,
  HISTORICO: 20,
  ACESSO: 30,
  CONTINUIDADE_DO_CUIDADO: 50,
  MODELO_DE_ATENDIMENTO: 20,
} as const;

describe("PerfilPanel — importância em palavras, construção honesta", () => {
  it("mostra os dois grupos com as importâncias projetadas, sem nenhum número de peso", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(PESOS, true)} />);

    expect(screen.getByText("Prioridades Técnicas")).toBeInTheDocument();
    expect(screen.getByText("Prioridades do Modelo de Cuidado")).toBeInTheDocument();
    expect(screen.getByText("Continuidade do Cuidado")).toBeInTheDocument();
    expect(screen.getAllByText("Muito importante").length).toBe(2);
    // "Importante" exato: Formação (30), Acesso (30), Histórico (20) e Modelo (20).
    expect(screen.getAllByText("Importante").length).toBe(4);

    // O peso nunca atravessa como número.
    expect(container.textContent).not.toMatch(/\b50\b|\b30\b|\b20\b/);
  });

  it("em construção: progresso visível, acessível, e critérios ainda em conversa", () => {
    render(<PerfilPanel perfil={buildPerfilView({ FORMACAO: 30 }, false)} />);

    const barra = screen.getByRole("progressbar", { name: "Construção do Perfil" });
    expect(barra).toHaveAttribute("aria-valuenow", "14");
    expect(screen.getByText("Seu perfil está sendo construído junto com o Curador.")).toBeInTheDocument();
    expect(screen.getAllByText("Ainda em conversa").length).toBe(5);
  });

  it("completo sem validação: a pergunta aparece e diz que a confirmação é na conversa", () => {
    render(<PerfilPanel perfil={buildPerfilView(PESOS, false)} />);
    expect(
      screen.getByText(/Este perfil representa corretamente o que é importante para você\?/),
    ).toBeInTheDocument();
    expect(screen.getByText(/A Curadoria só começa depois desse seu sim/)).toBeInTheDocument();
  });

  it("nada na tela viola o vocabulário do paciente", () => {
    const { container } = render(<PerfilPanel perfil={buildPerfilView(PESOS, true)} />);
    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
