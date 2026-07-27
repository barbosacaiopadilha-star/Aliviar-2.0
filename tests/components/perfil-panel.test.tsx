import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PerfilPanel } from "@/components/paciente/perfil-panel";
import { PatientCuradoriaView } from "@/components/patient/patient-curadoria-view";
import { buildPerfilView, violatesPatientVocabulary } from "@/modules/paciente/experiencia";
import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";

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

const CURADORIA: PatientCuradoria = {
  curatedSelectionId: "sel-1",
  caseId: "case-1",
  curatorName: null,
  deliveredAt: "2026-07-27T12:00:00.000Z",
  compositionRationale: "Os três cobrem a área exigida por caminhos diferentes.",
  options: [
    {
      id: "opt-a",
      professionalProfileId: "a",
      professionalName: "Dra. Helena Monteiro",
      justification: "Esta opção foi incluída por apresentar aderência ao caso em Experiência Profissional.",
      relationToWeights: "Em relação ao Perfil validado: Continuidade do Cuidado atende plenamente.",
      favorablePoints: ["Formação específica para o seu caso."],
      attentionPoints: ["Histórico Profissional atende parcialmente ao que este caso exige."],
      suggestedQuestions: ["Como funciona o acompanhamento após a primeira consulta?"],
    },
  ],
  decision: null,
};

describe("PatientCuradoriaView — a narrativa do Relatório, literal", () => {
  it("mostra 'O que encontramos' com o texto exato do Relatório", () => {
    render(<PatientCuradoriaView curadoria={CURADORIA} />);
    expect(screen.getByText("O que encontramos")).toBeInTheDocument();
    expect(screen.getByText("Formação específica para o seu caso.")).toBeInTheDocument();
    // O ponto de atenção é o do Relatório, palavra por palavra.
    expect(
      screen.getByText("Histórico Profissional atende parcialmente ao que este caso exige."),
    ).toBeInTheDocument();
  });

  it("nenhuma linguagem de posição ou nota — e a ordem se declara como apresentação", () => {
    const { container } = render(<PatientCuradoriaView curadoria={CURADORIA} />);
    expect(screen.getByText(/ordem abaixo é de apresentação, não de preferência/)).toBeInTheDocument();
    expect(violatesPatientVocabulary(container.textContent ?? "")).toBeNull();
  });
});
