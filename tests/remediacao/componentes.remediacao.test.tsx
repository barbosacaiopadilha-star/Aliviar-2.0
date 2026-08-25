/**
 * @vitest-environment jsdom
 *
 * =============================================================================
 * GATES DO BLOCO D — CAMADA DE COMPONENTES (falso sucesso na interface)
 * =============================================================================
 *
 * 21b. Round-trip dos pareceres pelo editor do Relatório: o que foi gravado
 *      como lista volta como string colada (join) e reenvia como item único —
 *      e os pontos favoráveis somem por completo do payload.
 * 22.  Autosave da história: quando a action RECUSA a gravação, o estado
 *      exposto pelo Provider é idêntico ao de um salvamento bem-sucedido —
 *      a pessoa segue digitando achando que está salvo.
 *
 * Ambos asseveram o comportamento correto pós-remediação: DEVEM estar
 * VERMELHOS hoje.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AutosaveIndicator } from "@/components/story/autosave-indicator";
import { ReportEditor, type ReportOptionDraft } from "@/components/curadoria/report-editor";
import { StoryDraftProvider, useStoryDraft } from "@/modules/story/use-story-draft";
import type { PatientStory } from "@/modules/story/types";

const {
  saveReportActionMock,
  saveStoryDraftActionMock,
  submitStoryActionMock,
  usePathnameMock,
} = vi.hoisted(() => ({
  saveReportActionMock: vi.fn(),
  saveStoryDraftActionMock: vi.fn(),
  submitStoryActionMock: vi.fn(),
  usePathnameMock: vi.fn(() => "/sua-historia/motivo"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/modules/curadoria/actions", () => ({
  saveReportAction: saveReportActionMock,
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

vi.mock("@/modules/story/actions", () => ({
  saveStoryDraftAction: saveStoryDraftActionMock,
  submitStoryAction: submitStoryActionMock,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// GATE-D21b — round-trip do parecer pelo ReportEditor
// ---------------------------------------------------------------------------

/** O que está GRAVADO no banco para uma opção (curadoria_report_options). */
const ARMAZENADO = {
  attentionPoints: ["Agenda bastante concorrida — o início pode demorar.", "Não atende online."],
  favorablePoints: ["Longa trajetória em cirurgia de coluna."],
};

/**
 * A MESMA deserialização que a página faz ao montar o editor
 * (src/app/portal-curador/casos/[id]/[etapa]/page.tsx). FRENTE D3: as
 * coleções atravessam como ARRAY — nada de `join`; favorablePoints é
 * carregado e transportado. Este espelho acompanha a página; o oráculo
 * (ARMAZENADO e os expects abaixo) permanece o mesmo.
 */
function opcaoComoAPaginaMonta(): ReportOptionDraft {
  return {
    professionalProfileId: "00000000-0000-0000-0000-0000000000a1",
    professionalName: "Dra. Fixture A",
    justification: "Responde ao critério de continuidade que a paciente validou.",
    relationToWeights: "Conversa com o peso que ela deu ao acompanhamento contínuo.",
    relationalReading: "",
    attentionPoints: ARMAZENADO.attentionPoints,
    favorablePoints: ARMAZENADO.favorablePoints,
    suggestedQuestions: ["O que perguntar na primeira consulta?"],
    curatorObservations: "",
  };
}

async function salvarPeloEditor(): Promise<{
  attentionPoints: string[];
  favorablePoints: string[];
}> {
  saveReportActionMock.mockReset();
  saveReportActionMock.mockResolvedValue({ success: true });

  render(
    <ReportEditor
      priorityProfileId="00000000-0000-0000-0000-0000000000b1"
      curatedSelectionId="00000000-0000-0000-0000-0000000000c1"
      patientFirstName="Maria"
      initialOptions={[opcaoComoAPaginaMonta()]}
      initialComposition="Por que estas três, juntas, servem a esta pessoa."
      emittedAt={null}
      deliveredAt={null}
      nextStepHref="/portal-curador"
    />,
  );

  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

  expect(saveReportActionMock).toHaveBeenCalledTimes(1);
  const payload = saveReportActionMock.mock.calls[0]![0] as {
    options: { attentionPoints: string[]; favorablePoints: string[] }[];
  };
  return payload.options[0]!;
}

describe("GATE-D21b [Bloco D] round-trip do parecer pelo editor do Relatório", () => {
  it("os pontos de atenção gravados como LISTA voltam como lista — nunca colados num item só", async () => {
    const enviado = await salvarPeloEditor();

    // Hoje: a página junta com "\n" e o editor reenvia `[string única]` —
    // dois pontos de atenção viram um; a página da Mesa
    // junta com " " e nem o "\n" sobrevive à segunda passada.
    expect(
      enviado.attentionPoints,
      `salvar sem editar precisa devolver exatamente o que estava gravado ` +
        `(gravado: ${JSON.stringify(ARMAZENADO.attentionPoints)}; ` +
        `enviado: ${JSON.stringify(enviado.attentionPoints)})`,
    ).toEqual(ARMAZENADO.attentionPoints);
  });

  it("salvar sem tocar nos pontos favoráveis NÃO pode apagá-los", async () => {
    const enviado = await salvarPeloEditor();

    // Hoje: o editor envia `favorablePoints: []` SEMPRE (report-editor.tsx,
    // linha ~150) — um clique em "Salvar rascunho" apaga silenciosamente os
    // pontos favoráveis do rascunho assistido que a paciente veria.
    expect(
      enviado.favorablePoints,
      `o payload precisa preservar os pontos favoráveis já gravados ` +
        `(gravado: ${JSON.stringify(ARMAZENADO.favorablePoints)}; ` +
        `enviado: ${JSON.stringify(enviado.favorablePoints)})`,
    ).toEqual(ARMAZENADO.favorablePoints);
  });
});

// ---------------------------------------------------------------------------
// GATE-D22 — autosave recusado não pode parecer "salvo"
// ---------------------------------------------------------------------------

const BASE_STORY: PatientStory = {
  id: "story-gate-22",
  status: "rascunho",
  currentStep: "motivo",
  data: {},
  revision: 1,
  submittedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type EstadoObservavel = Record<string, string | number | boolean>;

/** Tudo que o Provider expõe à UI e que é exibível (primitivos). */
function primitivos(contexto: Record<string, unknown>): EstadoObservavel {
  return Object.fromEntries(
    Object.entries(contexto).filter(([, valor]) =>
      ["string", "number", "boolean"].includes(typeof valor),
    ),
  ) as EstadoObservavel;
}

function HarnessDeEstado({ onEstado }: { onEstado: (estado: EstadoObservavel) => void }) {
  const contexto = useStoryDraft();
  onEstado(primitivos(contexto as unknown as Record<string, unknown>));
  return (
    <input
      aria-label="motivo"
      value={contexto.data.motivo ?? ""}
      onChange={(event) => contexto.update({ motivo: event.target.value })}
    />
  );
}

async function estadoAposAutosave(resultado: unknown): Promise<EstadoObservavel> {
  saveStoryDraftActionMock.mockReset();
  saveStoryDraftActionMock.mockResolvedValue(resultado);
  window.localStorage.clear();

  let estado: EstadoObservavel = {};
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const { unmount } = render(
    <StoryDraftProvider story={BASE_STORY}>
      <HarnessDeEstado onEstado={(atual) => (estado = atual)} />
    </StoryDraftProvider>,
  );

  await user.type(screen.getByLabelText("motivo"), "a");
  await vi.advanceTimersByTimeAsync(700); // dispara e conclui o autosave
  expect(saveStoryDraftActionMock).toHaveBeenCalled();

  unmount();
  return estado;
}

describe("GATE-D22 [Bloco D] autosave recusado não pode exibir estado de 'salvo'", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePathnameMock.mockReturnValue("/sua-historia/motivo");
  });

  it("com a action recusando a gravação, o Provider precisa expor um sinal de falha distinto do sucesso", async () => {
    const aposSucesso = await estadoAposAutosave({
      outcome: "saved",
      story: { ...BASE_STORY, data: { motivo: "a" }, revision: 2 },
    });

    const aposFalha = await estadoAposAutosave({
      outcome: "error",
      error: "Não foi possível salvar agora.",
    });

    // Hoje os dois estados observáveis são IDÊNTICOS ({isSaving:false,
    // hasConflict:false, status:'rascunho', ...}): nenhuma superfície tem como
    // dizer à pessoa que a última gravação FALHOU — ela fecha a aba achando
    // que está tudo salvo. O contrato pós-remediação: existe um sinal exposto
    // (ex.: saveError / lastSaveFailed) que diferencia recusa de sucesso.
    expect(
      aposFalha,
      `o estado exposto após a RECUSA (${JSON.stringify(aposFalha)}) precisa ser ` +
        `distinguível do estado após o SUCESSO (${JSON.stringify(aposSucesso)}); ` +
        `hoje são idênticos — falso "salvo"`,
    ).not.toEqual(aposSucesso);
  });
});

// ---------------------------------------------------------------------------
// AMPLIAÇÃO Bloco D (FRENTE D1) — sessão expirada como estado de 1ª classe.
// Diferente dos gates acima, este teste certifica o comportamento JÁ
// implementado pela remediação: nasce junto com ela, verde.
// ---------------------------------------------------------------------------

describe("Bloco D [FRENTE D1] sessão expirada no autosave é estado de 1ª classe", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePathnameMock.mockReturnValue("/sua-historia/motivo");
  });

  it("outcome discriminado 'unauthenticated' vira frase própria com reentrada — e o texto fica guardado neste dispositivo", async () => {
    saveStoryDraftActionMock.mockReset();
    // O desfecho é um TIPO, nunca uma substring de mensagem: é assim que o
    // Provider distingue sessão expirada de qualquer outra recusa.
    saveStoryDraftActionMock.mockResolvedValue({ outcome: "unauthenticated" });
    window.localStorage.clear();

    let estado: EstadoObservavel = {};
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <StoryDraftProvider story={BASE_STORY}>
        <HarnessDeEstado onEstado={(atual) => (estado = atual)} />
        <AutosaveIndicator />
      </StoryDraftProvider>,
    );

    await user.type(screen.getByLabelText("motivo"), "a");
    await vi.advanceTimersByTimeAsync(700); // dispara e conclui o autosave
    expect(saveStoryDraftActionMock).toHaveBeenCalled();

    // O Provider expõe sessão expirada como estado observável próprio.
    expect(
      estado.sessionExpired,
      "o Provider precisa expor `sessionExpired` quando a action devolve o outcome discriminado",
    ).toBe(true);

    // O indicador NUNCA diz "salvo" com a gravação recusada (ADR-064 §4)...
    expect(screen.queryByText("Sua resposta foi salva.")).not.toBeInTheDocument();

    // ...e diz a verdade específica, com o caminho de reentrada preservando o retorno.
    expect(
      screen.getByText(/Sua sessão expirou\. Entre novamente para continuar/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Entrar novamente" }).getAttribute("href"),
    ).toBe(`/login?next=${encodeURIComponent("/sua-historia/motivo")}`);

    // A promessa da frase é literal: o texto está guardado neste dispositivo,
    // pendente, pronto para a recuperação depois da reentrada.
    const cache = window.localStorage.getItem(`aliviar:sua-historia:cache:${BASE_STORY.id}`);
    expect(cache, "o cache local não pode ser descartado na sessão expirada").not.toBeNull();
    expect(JSON.parse(cache!)).toMatchObject({ pending: true, data: { motivo: "a" } });
  });
});
