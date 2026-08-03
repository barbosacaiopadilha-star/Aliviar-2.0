/**
 * FRENTE D3 (Bloco D) — round-trip das coleções do Relatório pelo editor.
 *
 * O contrato certificado aqui:
 *  - array persiste como array: o que foi gravado como dois itens volta e
 *    reenvia como dois itens — nunca colados por espaço nem por "\n";
 *  - a transformação para textarea tem inversa definida (um item por linha);
 *  - campo NÃO tocado reenvia o array carregado byte a byte — inclusive item
 *    legado com quebra de linha interna;
 *  - esvaziar um campo e salvar é o ato deliberado de limpar ([] explícito);
 *  - pontos favoráveis não têm campo no editor: são transportados intactos
 *    (rota do editor) ou enviados AUSENTES (rota da Mesa) — nunca `[]` de
 *    fallback apagando o que o rascunho assistido escreveu;
 *  - recusa da action continua recusa: nada vira vazio nem "salvo".
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportEditor, type ReportOptionDraft } from "@/components/curadoria/report-editor";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";

const {
  saveReportActionMock,
  saveSelectionActionMock,
} = vi.hoisted(() => ({
  saveReportActionMock: vi.fn(),
  saveSelectionActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/modules/curadoria/actions", () => ({
  saveReportAction: saveReportActionMock,
  saveSelectionAction: saveSelectionActionMock,
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const OPTION_ID = "00000000-0000-0000-0000-0000000000a1";

const GRAVADO = {
  attentionPoints: ["Agenda bastante concorrida — o início pode demorar.", "Não atende online."],
  favorablePoints: ["Longa trajetória em cirurgia de coluna.", "Escuta reconhecida por pacientes."],
  suggestedQuestions: ["Qual a frequência das sessões?", "Como funciona o acompanhamento?"],
};

function opcaoCarregada(extra: Partial<ReportOptionDraft> = {}): ReportOptionDraft {
  return {
    professionalProfileId: OPTION_ID,
    professionalName: "Dra. Fixture A",
    justification: "Responde ao critério de continuidade que a paciente validou.",
    relationToWeights: "Conversa com as prioridades que ela reconheceu como suas.",
    relationalReading: "",
    attentionPoints: GRAVADO.attentionPoints,
    favorablePoints: GRAVADO.favorablePoints,
    suggestedQuestions: GRAVADO.suggestedQuestions,
    curatorObservations: "",
    ...extra,
  };
}

type PayloadOption = {
  professionalProfileId: string;
  justification: string;
  relationToWeights: string;
  attentionPoints: string[];
  favorablePoints: string[];
  suggestedQuestions: string[];
  curatorObservations: string | null;
};

function renderEditor(option: ReportOptionDraft = opcaoCarregada()) {
  saveReportActionMock.mockResolvedValue({ success: true });
  render(
    <ReportEditor
      priorityProfileId="00000000-0000-0000-0000-0000000000b1"
      curatedSelectionId="00000000-0000-0000-0000-0000000000c1"
      patientFirstName="Maria"
      initialOptions={[option]}
      initialComposition="Por que estas três, juntas, servem a esta pessoa."
      emittedAt={null}
      deliveredAt={null}
      nextStepHref="/portal-curador"
    />,
  );
}

async function salvar(): Promise<PayloadOption> {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  expect(saveReportActionMock).toHaveBeenCalled();
  const payload = saveReportActionMock.mock.calls.at(-1)![0] as { options: PayloadOption[] };
  return payload.options[0]!;
}

function textareaDe(field: string): HTMLTextAreaElement {
  return document.getElementById(`${field}-${OPTION_ID}`) as HTMLTextAreaElement;
}

describe("FRENTE D3 — o editor do Relatório preserva coleções item a item", () => {
  it("dois pontos de atenção carregados continuam dois no payload (salvar sem editar)", async () => {
    renderEditor();
    const enviado = await salvar();
    expect(enviado.attentionPoints).toEqual(GRAVADO.attentionPoints);
    expect(enviado.suggestedQuestions).toEqual(GRAVADO.suggestedQuestions);
  });

  it("editar OUTRO campo (texto corrido) preserva todas as coleções", async () => {
    renderEditor();
    fireEvent.change(textareaDe("justification"), {
      target: { value: "Justificativa revisada pelo Curador." },
    });
    const enviado = await salvar();
    expect(enviado.justification).toBe("Justificativa revisada pelo Curador.");
    expect(enviado.attentionPoints).toEqual(GRAVADO.attentionPoints);
    expect(enviado.favorablePoints).toEqual(GRAVADO.favorablePoints);
    expect(enviado.suggestedQuestions).toEqual(GRAVADO.suggestedQuestions);
  });

  it("pontos favoráveis não têm campo no editor — o payload os transporta intactos", async () => {
    renderEditor();
    expect(document.getElementById(`favorablePoints-${OPTION_ID}`)).toBeNull();
    const enviado = await salvar();
    expect(enviado.favorablePoints).toEqual(GRAVADO.favorablePoints);
  });

  it("esvaziar um campo opcional e salvar é limpeza deliberada: [] explícito", async () => {
    renderEditor();
    fireEvent.change(textareaDe("suggestedQuestions"), { target: { value: "" } });
    const enviado = await salvar();
    expect(enviado.suggestedQuestions).toEqual([]);
    // As demais coleções não foram tocadas — seguem inteiras.
    expect(enviado.attentionPoints).toEqual(GRAVADO.attentionPoints);
    expect(enviado.favorablePoints).toEqual(GRAVADO.favorablePoints);
  });

  it("salvar e reabrir (payload → página → editor) é semanticamente idêntico, com ordem preservada", async () => {
    renderEditor();
    fireEvent.change(textareaDe("attentionPoints"), {
      target: { value: "Primeiro ponto.\nSegundo ponto.\nTerceiro ponto." },
    });
    const primeiro = await salvar();
    expect(primeiro.attentionPoints).toEqual(["Primeiro ponto.", "Segundo ponto.", "Terceiro ponto."]);

    cleanup();
    // A reabertura: a página monta o editor com o que ficou gravado (arrays).
    renderEditor(
      opcaoCarregada({
        attentionPoints: primeiro.attentionPoints,
        suggestedQuestions: primeiro.suggestedQuestions,
        favorablePoints: primeiro.favorablePoints,
      }),
    );
    const segundo = await salvar();
    expect(segundo.attentionPoints).toEqual(primeiro.attentionPoints);
    expect(segundo.favorablePoints).toEqual(primeiro.favorablePoints);
    expect(segundo.suggestedQuestions).toEqual(primeiro.suggestedQuestions);
  });

  it("espaços internos de um item sobrevivem à edição — só a quebra de linha separa", async () => {
    renderEditor(opcaoCarregada({ attentionPoints: ["Ponto com  dois  espaços internos."] }));
    const textarea = textareaDe("attentionPoints");
    fireEvent.change(textarea, {
      target: { value: `${textarea.value}\nNovo ponto acrescentado.` },
    });
    const enviado = await salvar();
    expect(enviado.attentionPoints).toEqual([
      "Ponto com  dois  espaços internos.",
      "Novo ponto acrescentado.",
    ]);
  });

  it("pontuação nunca funde nem separa itens", async () => {
    renderEditor(
      opcaoCarregada({
        attentionPoints: ["Agenda cheia, com espera. Retorno só em março.", "Não atende online."],
      }),
    );
    // O Curador toca o campo (reescreve o mesmo conteúdo linha a linha).
    fireEvent.change(textareaDe("attentionPoints"), {
      target: { value: "Agenda cheia, com espera. Retorno só em março.\nNão atende online." },
    });
    const enviado = await salvar();
    expect(enviado.attentionPoints).toEqual([
      "Agenda cheia, com espera. Retorno só em março.",
      "Não atende online.",
    ]);
  });

  it("item legado com \\n interno: campo intocado atravessa byte a byte; campo editado segue a regra uma-linha-por-item", async () => {
    const legado = ["Primeira linha\ncontinuação do mesmo item.", "Outro item."];
    renderEditor(opcaoCarregada({ attentionPoints: legado }));

    // (a) Sem tocar o campo: o array carregado é reenviado idêntico.
    const intocado = await salvar();
    expect(intocado.attentionPoints).toEqual(legado);

    // (b) Tocando o campo: vale o que o Curador vê — cada linha vira um item
    // (a re-tokenização definida; nunca fusão).
    fireEvent.change(textareaDe("attentionPoints"), {
      target: { value: "Primeira linha\ncontinuação do mesmo item.\nOutro item, revisto." },
    });
    const editado = await salvar();
    expect(editado.attentionPoints).toEqual([
      "Primeira linha",
      "continuação do mesmo item.",
      "Outro item, revisto.",
    ]);
  });

  it("recusa da action continua recusa: erro dito, e nada vira vazio no reenvio", async () => {
    renderEditor();
    saveReportActionMock.mockResolvedValueOnce({
      success: false,
      error: "Não foi possível salvar o Relatório agora.",
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar o Relatório agora.",
    );
    expect(screen.queryByText("Relatório salvo. Você pode continuar revisando.")).toBeNull();

    // O estado não foi corrompido pela recusa: o reenvio leva os mesmos itens.
    const reenviado = await salvar();
    expect(reenviado.attentionPoints).toEqual(GRAVADO.attentionPoints);
    expect(reenviado.favorablePoints).toEqual(GRAVADO.favorablePoints);
  });

  it("legado já fundido (um item colado pela versão antiga) não sofre perda ADICIONAL", async () => {
    const fundido = ["Agenda bastante concorrida — o início pode demorar. Não atende online."];
    renderEditor(opcaoCarregada({ attentionPoints: fundido }));
    const enviado = await salvar();
    // Continua UM item, exatamente como está gravado — o editor não tenta
    // adivinhar onde o item foi colado, nem cola mais nada por cima.
    expect(enviado.attentionPoints).toEqual(fundido);
  });
});

// ---------------------------------------------------------------------------
// A MESMA regra na rota da Mesa (curadoria_tecnica → MesaWorkspace).
// ---------------------------------------------------------------------------

describe("FRENTE D3 — a Mesa fala o mesmo contrato ao encerrar", () => {
  const IDS = [
    "00000000-0000-0000-0000-0000000000d1",
    "00000000-0000-0000-0000-0000000000d2",
    "00000000-0000-0000-0000-0000000000d3",
  ] as const;

  function candidato(id: string, nome: string) {
    return { professionalProfileId: id, nome, resumo: "Leitura do Motor.", celulas: [] };
  }

  function parecer(professionalId: string) {
    return {
      professionalId,
      whyIncluded: "Responde ao critério dela.",
      prioritiesServed: "Cobre a continuidade que ela pediu.",
      // Como a página monta hoje: itensParaTextarea — um item por linha.
      limitations: "Ponto de atenção um.\nPonto de atenção dois.",
      questions: "",
      observations: "",
    };
  }

  it("dois itens exibidos como duas linhas voltam como DOIS itens — e favorablePoints vai AUSENTE, nunca []", async () => {
    saveSelectionActionMock.mockResolvedValue({ success: true });
    saveReportActionMock.mockResolvedValue({ success: true });

    render(
      <MesaWorkspace
        candidatos={IDS.map((id, i) => candidato(id, `Profissional ${i + 1}`))}
        excluidos={[]}
        curatorName="Dr. Curador"
        patientFirstName="Maria"
        priorityProfileId="00000000-0000-0000-0000-0000000000b1"
        persisted={{
          selectedIds: [...IDS],
          pareceres: IDS.map(parecer),
          compositionRationale: "Juntas, cobrem o que ela pediu de formas diferentes.",
          closed: false,
        }}
        reportHref="/relatorio"
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Encerrar e gerar o Relatório" }));

    expect(saveReportActionMock).toHaveBeenCalledTimes(1);
    const payload = saveReportActionMock.mock.calls[0]![0] as {
      options: Record<string, unknown>[];
    };

    for (const option of payload.options) {
      expect(option.attentionPoints).toEqual(["Ponto de atenção um.", "Ponto de atenção dois."]);
      // A Mesa não edita pontos favoráveis: ausência = "não mexi" (D21a) —
      // a gravação preserva o que o rascunho assistido escreveu.
      expect("favorablePoints" in option).toBe(false);
      expect(option.suggestedQuestions).toEqual([]);
    }
  });
});
