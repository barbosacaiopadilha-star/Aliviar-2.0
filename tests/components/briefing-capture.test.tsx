import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AlignmentCapture } from "@/components/curadoria/alignment-capture";
import { ObservationCapture } from "@/components/curadoria/observation-capture";
import { ProfessionalDeclarations } from "@/components/profissional/professional-declarations";
import type {
  CuratorObservation,
  PatientAlignmentAnswer,
  ProfessionalAlignmentAnswer,
} from "@/modules/briefing/types";

// As superfícies só registram — nenhum teste aqui grava de verdade.
vi.mock("@/modules/briefing/actions", () => ({
  recordPatientAnswerAction: vi.fn(async () => ({ success: true })),
  removePatientAnswerAction: vi.fn(async () => ({ success: true })),
  recordObservationAction: vi.fn(async () => ({ success: true })),
  reviseObservationAction: vi.fn(async () => ({ success: true })),
  removeObservationAction: vi.fn(async () => ({ success: true })),
  declareProfessionalAnswerAction: vi.fn(async () => ({ success: true })),
}));

afterEach(cleanup);

const CASE_ID = "11111111-1111-1111-1111-111111111111";

function patientAnswer(): PatientAlignmentAnswer {
  return {
    questionId: "PA1",
    option: "LER_SOZINHO",
    verbatim: "Eu preciso ler com calma antes de responder.",
    answeredAt: "2026-07-20T10:00:00.000Z",
    dataClass: "PREFERENCIA",
    origin: "PACIENTE",
  };
}

function observation(authorId: string): CuratorObservation {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    caseId: CASE_ID,
    kind: "CU1",
    note: "Ela pediu para incluir a filha na conversa.",
    authorId,
    authorName: "Curadora de Demonstração",
    observedAt: "2026-07-20T11:00:00.000Z",
    dataClass: "INTERPRETACAO",
    origin: "CURADOR",
  };
}

function professionalAnswer(): ProfessionalAlignmentAnswer {
  return {
    questionId: "ME1",
    option: "TAMBEM_POR_ESCRITO",
    declaredText: null,
    declaredAt: "2026-06-01T12:00:00.000Z",
    dataClass: "FATO",
    origin: "MEDICO",
  };
}

// ---------------------------------------------------------------------------
// PACIENTE — as 5 perguntas aprovadas, nenhuma a mais
// ---------------------------------------------------------------------------

describe("captura do Perfil de Alinhamento (paciente)", () => {
  it("apresenta exatamente as 5 perguntas aprovadas", () => {
    render(<AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[]} />);
    expect(screen.getAllByRole("group")).toHaveLength(5);
    expect(screen.getByText(/o que ajuda mais você a decidir/i)).toBeInTheDocument();
    expect(screen.getByText(/Alguém mais participa dessa decisão/i)).toBeInTheDocument();
  });

  it("toda pergunta oferece 'prefiro não dizer' — nenhuma é obrigatória", () => {
    render(<AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[]} />);
    expect(screen.getAllByLabelText("Prefiro não dizer")).toHaveLength(5);
  });

  it("guarda a fala com as próprias palavras, sem pedir resumo", () => {
    render(<AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[]} />);
    expect(screen.getAllByPlaceholderText(/Palavras dela, sem resumir/)).toHaveLength(5);
    expect(screen.getAllByText(/ela vale mais que a opção/)).toHaveLength(5);
  });

  it("uma resposta já registrada pode ser retirada (P8)", () => {
    render(<AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[patientAnswer()]} />);
    expect(screen.getByRole("button", { name: "Retirar resposta" })).toBeInTheDocument();
  });

  it("declara que a Curadoria segue sem nenhuma resposta (P16)", () => {
    render(<AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[]} />);
    expect(screen.getByText(/Nenhuma pergunta é obrigatória/)).toBeInTheDocument();
  });

  it("estado vazio é 'Ainda não registrado' — nunca contagem ou percentual", () => {
    const { container } = render(
      <AlignmentCapture caseId={CASE_ID} patientFirstName="Ana" answers={[]} />,
    );
    expect(screen.getByText("Ainda não registrado")).toBeInTheDocument();
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/\d\s*%/);
    expect(texto).not.toMatch(/\b\d\s+de\s+\d\b/);
  });
});

// ---------------------------------------------------------------------------
// CURADOR — observações do Case
// ---------------------------------------------------------------------------

describe("captura de observações (Curador)", () => {
  it("oferece os 5 tipos aprovados, com CU4 entre eles", () => {
    render(<ObservationCapture caseId={CASE_ID} observations={[]} viewerId="cur-1" />);
    const opcoes = screen.getAllByRole("option").map((o) => o.textContent);
    expect(opcoes).toHaveLength(5);
    expect(opcoes).toContain("Discordo de uma observação do sistema");
  });

  it("discordar é encontrável sem ser cobrado — nenhuma marca de urgência", () => {
    const { container } = render(
      <ObservationCapture caseId={CASE_ID} observations={[]} viewerId="cur-1" />,
    );
    const texto = (container.textContent ?? "").toLowerCase();
    for (const cobranca of ["obrigatório", "pendente", "você precisa", "necessário registrar"]) {
      expect(texto).not.toContain(cobranca);
    }
  });

  it("o autor pode corrigir e remover a própria observação (P8)", () => {
    render(
      <ObservationCapture caseId={CASE_ID} observations={[observation("cur-1")]} viewerId="cur-1" />,
    );
    expect(screen.getByRole("button", { name: "Corrigir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument();
  });

  it("quem não escreveu não vê corrigir nem remover", () => {
    render(
      <ObservationCapture
        caseId={CASE_ID}
        observations={[observation("outro-curador")]}
        viewerId="cur-1"
      />,
    );
    expect(screen.queryByRole("button", { name: "Corrigir" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
    // Mas a observação continua visível, com autor: coexistem.
    expect(screen.getByText(/Curadora de Demonstração/)).toBeInTheDocument();
  });

  it("diz que a observação pertence ao caso, não à pessoa (P11)", () => {
    render(<ObservationCapture caseId={CASE_ID} observations={[]} viewerId="cur-1" />);
    expect(screen.getByText(/Fica no caso,\s+não no histórico da pessoa/)).toBeInTheDocument();
    expect(screen.getByText(/sobre a situação — nunca sobre como ela é/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MÉDICO — declarações sobre si
// ---------------------------------------------------------------------------

describe("declarações do profissional", () => {
  it("apresenta as 5 perguntas aprovadas", () => {
    render(<ProfessionalDeclarations answers={[]} />);
    expect(screen.getAllByRole("group")).toHaveLength(5);
    expect(screen.getByText(/como costuma fazer\?/i)).toBeInTheDocument();
  });

  it("ME3 e ME5 são texto livre — sem opção fechada imposta", () => {
    render(<ProfessionalDeclarations answers={[]} />);
    expect(screen.getAllByText("Escreva com suas palavras.")).toHaveLength(2);
  });

  it("declara que nada vira nota nem comparação (P2, Ontologia §8)", () => {
    render(<ProfessionalDeclarations answers={[]} />);
    expect(screen.getByText(/Nada aqui vira nota ou classificação/)).toBeInTheDocument();
    expect(screen.getByText(/nada é comparado com outro profissional/)).toBeInTheDocument();
  });

  it("nunca exibe score, posição, percentual ou quantas faltam", () => {
    const { container } = render(<ProfessionalDeclarations answers={[professionalAnswer()]} />);
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["score", "%", "ranking", "estrela", "selo", "posição", "pontuaç", "faltam"]) {
      expect(texto, `exibiu vocabulário proibido: ${proibido}`).not.toContain(proibido);
    }
  });

  it("o direito de mudar é dito de forma explícita (P8)", () => {
    render(<ProfessionalDeclarations answers={[]} />);
    expect(screen.getByText(/você pode\s+mudar o que quiser quando quiser/)).toBeInTheDocument();
  });

  it("com uma resposta em preenchimento, o estado é palavra — nunca fração", () => {
    render(<ProfessionalDeclarations answers={[professionalAnswer()]} />);
    expect(screen.getByText("Em preenchimento")).toBeInTheDocument();
  });
});
