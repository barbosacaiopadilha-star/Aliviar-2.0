/**
 * RELEASE GATE 2 — o Editor do Relatório acompanha o estado real do servidor.
 *
 * O defeito certificado aqui: o editor copia as props para estado local no
 * primeiro render (useState) e, após regenerar o rascunho assistido, o
 * router.refresh() entregava props novas a um estado que as ignorava — o
 * Curador via o texto antigo até recarregar a página na mão.
 *
 * O contrato corrigido: a PÁGINA dá ao editor uma key derivada de
 * `assisted_generated_at` (escrito num único lugar, o gerador). O harness
 * abaixo replica exatamente esse contrato, porque é nele que a correção vive:
 *  - key muda (regeneração)      → remonta → a tela exibe o recém-gerado;
 *  - key não muda (salvar/editar) → não remonta → edições em tela preservadas.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportEditor, type ReportOptionDraft } from "@/components/curadoria/report-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/modules/curadoria/actions", () => ({
  saveReportAction: vi.fn(),
  saveSelectionAction: vi.fn(),
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

afterEach(cleanup);

const OPTION_ID = "00000000-0000-0000-0000-0000000000b1";

function opcao(extra: Partial<ReportOptionDraft> = {}): ReportOptionDraft {
  return {
    professionalProfileId: OPTION_ID,
    professionalName: "Dra. Fixture A",
    justification: "Escrita na Mesa pelo Curador.",
    relationToWeights: "Também escrita na Mesa.",
    relationalReading: "",
    attentionPoints: ["Agenda concorrida."],
    favorablePoints: [],
    suggestedQuestions: [],
    curatorObservations: "",
    ...extra,
  };
}

/** O contrato da página, reproduzido à letra (portal-curador/casos/[id]/[etapa]). */
function Pagina({
  assistedGeneratedAt,
  options,
  composition,
}: {
  assistedGeneratedAt: string | null;
  options: ReportOptionDraft[];
  composition: string;
}) {
  return (
    <ReportEditor
      key={assistedGeneratedAt ?? "relatorio-nascido-na-mesa"}
      priorityProfileId="00000000-0000-0000-0000-0000000000c1"
      curatedSelectionId="00000000-0000-0000-0000-0000000000d1"
      patientFirstName="Paciente"
      emittedAt={null}
      deliveredAt={null}
      assistedGeneratedAt={assistedGeneratedAt}
      nextStepHref="/proximo"
      initialComposition={composition}
      initialOptions={options}
    />
  );
}

function campoComposicao(): HTMLTextAreaElement {
  return screen.getByLabelText("Justificativa da composição");
}

describe("Editor do Relatório — sincronização com o servidor (Release Gate 2)", () => {
  it("geração inicial: o rascunho nascido da Mesa vira rascunho assistido na tela, sem reload", () => {
    const { rerender } = render(
      <Pagina assistedGeneratedAt={null} options={[opcao()]} composition="Frase da Mesa." />,
    );
    expect(campoComposicao().value).toBe("Frase da Mesa.");

    // O gerador gravou; o refresh da página entrega props novas + key nova.
    rerender(
      <Pagina
        assistedGeneratedAt="2026-08-03T12:00:00.000Z"
        options={[opcao({ justification: "Gerada pelo rascunho assistido." })]}
        composition="Abertura escrita pelo gerador."
      />,
    );

    expect(campoComposicao().value).toBe("Abertura escrita pelo gerador.");
    expect(
      (screen.getByLabelText(/Por que esta opção está aqui/i, { exact: false }) as HTMLTextAreaElement)
        .value,
    ).toBe("Gerada pelo rascunho assistido.");
  });

  it("regeneração: uma segunda geração substitui a tela de novo — inclusive a leitura relacional da auditoria", () => {
    const { rerender } = render(
      <Pagina
        assistedGeneratedAt="2026-08-03T12:00:00.000Z"
        options={[opcao({ relationalReading: "Leitura da primeira geração." })]}
        composition="Primeira geração."
      />,
    );

    rerender(
      <Pagina
        assistedGeneratedAt="2026-08-03T12:05:00.000Z"
        options={[opcao({ relationalReading: "Leitura da SEGUNDA geração." })]}
        composition="Segunda geração."
      />,
    );

    expect(campoComposicao().value).toBe("Segunda geração.");
    expect(
      (
        screen.getByLabelText("Como conversa com a forma como ela quer ser cuidada", {
          exact: false,
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Leitura da SEGUNDA geração.");
  });

  it("preservação: sem regeneração (key estável), o que o Curador digitou sobrevive ao refresh", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Pagina
        assistedGeneratedAt="2026-08-03T12:00:00.000Z"
        options={[opcao()]}
        composition="Abertura escrita pelo gerador."
      />,
    );

    await user.clear(campoComposicao());
    await user.type(campoComposicao(), "Frase que o Curador está escrevendo agora.");

    // Salvar/emitir/entregar disparam refresh SEM tocar assisted_generated_at:
    // mesma key, sem remontagem — a tela não pode descartar o trabalho dele.
    rerender(
      <Pagina
        assistedGeneratedAt="2026-08-03T12:00:00.000Z"
        options={[opcao()]}
        composition="Abertura escrita pelo gerador."
      />,
    );

    expect(campoComposicao().value).toBe("Frase que o Curador está escrevendo agora.");
  });

  it("regressão: sem a key, o cenário da auditoria volta — este harness é o contrato da página", () => {
    // Prova negativa: renderizar o editor SEM a key (como a página fazia)
    // deixa a tela presa na primeira geração mesmo com props novas. Se este
    // caso um dia PASSAR a sincronizar sem key, o mecanismo do React mudou e o
    // contrato da página merece revisão — os dois lados ficam vigiados.
    const { rerender } = render(
      <ReportEditor
        priorityProfileId="00000000-0000-0000-0000-0000000000c1"
        curatedSelectionId="00000000-0000-0000-0000-0000000000d1"
        patientFirstName="Paciente"
        emittedAt={null}
        deliveredAt={null}
        assistedGeneratedAt={null}
        nextStepHref="/proximo"
        initialComposition="Frase da Mesa."
        initialOptions={[opcao()]}
      />,
    );
    rerender(
      <ReportEditor
        priorityProfileId="00000000-0000-0000-0000-0000000000c1"
        curatedSelectionId="00000000-0000-0000-0000-0000000000d1"
        patientFirstName="Paciente"
        emittedAt={null}
        deliveredAt={null}
        assistedGeneratedAt="2026-08-03T12:00:00.000Z"
        nextStepHref="/proximo"
        initialComposition="Abertura escrita pelo gerador."
        initialOptions={[opcao()]}
      />,
    );
    expect(campoComposicao().value).toBe("Frase da Mesa.");
  });
});
