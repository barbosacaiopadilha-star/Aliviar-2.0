/**
 * BLOCO 11 · T-11-3..T-11-8 — os quatro itens de apresentação.
 *
 * Nenhum deles muda uma regra: todos corrigem o que a tela DIZ sobre regras que
 * já existiam. É por isso que cada teste aqui tem a mesma forma — a guarda de
 * domínio continua no lugar, e o que se prova é que a interface parou de deixar
 * o Curador descobrir a regra por erro devolvido.
 *
 *  - T-11-3 · C7    — encerrar sempre visível, desabilitado, nomeando o que falta;
 *  - T-11-4 · C6    — eliminar sem justificativa é recusado no cliente;
 *  - T-11-6 · C8    — Relatório congelado ⇒ ações indisponíveis, com motivo;
 *  - T-11-7 · C4    — contador e frase saem de UMA derivação;
 *  - T-11-8 · D2-4  — a justificativa do conjunto é nomeada uma vez.
 *
 * T-11-5 (a guarda do SERVIDOR do C6) é de integração e vive fora daqui — o
 * ponto do C6 é que as duas existem, não que uma substituiu a outra.
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MesaEstadoProvider } from "@/components/curadoria/mesa/mesa-estado";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { MesaHeader } from "@/components/curadoria/mesa/mesa-header";
import { ReportEditor } from "@/components/curadoria/report-editor";
import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";
import { estadoDaMesa, buildMesaEtapas } from "@/modules/curadoria/mesa-etapas";

const { saveSelectionActionMock, saveReportActionMock, declareAreaMock } = vi.hoisted(() => ({
  saveSelectionActionMock: vi.fn(),
  saveReportActionMock: vi.fn(),
  declareAreaMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/modules/curadoria/actions", () => ({
  saveSelectionAction: saveSelectionActionMock,
  saveReportAction: saveReportActionMock,
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

vi.mock("@/modules/curadoria/cruzamento-actions", () => ({
  declareAreaAction: declareAreaMock,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const CASE_ID = "00000000-0000-0000-0000-00000000b110";
const PROF_A = "00000000-0000-0000-0000-0000000000a1";
const PROF_B = "00000000-0000-0000-0000-0000000000a2";
const PROF_C = "00000000-0000-0000-0000-0000000000a3";

function candidato(id: string, nome: string) {
  return { professionalProfileId: id, nome, resumo: "3 fortes · 0 parciais", celulas: [] };
}

function renderMesa() {
  saveSelectionActionMock.mockResolvedValue({ success: true });
  return render(
    <MesaEstadoProvider caseId={CASE_ID}>
      <MesaWorkspace
        caseId={CASE_ID}
        candidatos={[
          candidato(PROF_A, "Dra. Fixture A"),
          candidato(PROF_B, "Dr. Fixture B"),
          candidato(PROF_C, "Dra. Fixture C"),
        ]}
        excluidos={[]}
        curatorName="Curador Fixture"
        patientFirstName="Maria"
        priorityProfileId="00000000-0000-0000-0000-0000000000b1"
        locked={false}
        reportHref="/portal-curador"
      />
    </MesaEstadoProvider>,
  );
}

// ---------------------------------------------------------------------------
// T-11-3 · C7 — o destino existe antes de estar alcançável
// ---------------------------------------------------------------------------

describe("T-11-3 · C7 — encerrar está sempre à vista", () => {
  it("com a Mesa vazia, o botão existe, está desabilitado e diz o que falta", () => {
    renderMesa();

    const botao = screen.getByRole("button", { name: "Encerrar e gerar o Relatório" });
    expect(botao).toBeDisabled();

    // O que falta não é um aviso genérico: é a lista que o próprio
    // `validateMesaClosure` devolve, a mesma que decide o clique.
    const pendencias = document.getElementById("encerrar-pendencias");
    expect(pendencias, "a lista de pendências some, e o botão fica mudo").not.toBeNull();
    expect(pendencias!.textContent).toMatch(/Selecione exatamente três|três/i);

    // E o motivo é lido junto com o controle, não só visto ao lado dele.
    expect(botao.getAttribute("aria-describedby")).toBe("encerrar-pendencias");
  });

  it("selecionar sem terminar mantém o botão visível — ele nunca desaparece", async () => {
    const user = userEvent.setup();
    renderMesa();

    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);

    expect(screen.getByRole("button", { name: "Encerrar e gerar o Relatório" })).toBeDisabled();
    expect(document.getElementById("encerrar-pendencias")).not.toBeNull();
  });

  it("nenhuma escrita acontece enquanto há pendência", async () => {
    const user = userEvent.setup();
    renderMesa();

    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);
    await user.click(screen.getByRole("button", { name: "Encerrar e gerar o Relatório" }));

    expect(
      saveSelectionActionMock,
      "rascunho parcial virou fato gravado — a Mesa escreveu antes da confirmação",
    ).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Isolamento entre campos — o que a M-11-7 tenta quebrar
// ---------------------------------------------------------------------------

describe("os campos da Mesa não se contaminam", () => {
  it("escrever a justificativa do conjunto não toca em nenhum parecer", async () => {
    const user = userEvent.setup();
    renderMesa();

    const selecionar = screen.getAllByRole("button", { name: "Selecionar" });
    await user.click(selecionar[0]!);
    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);

    const parecer = document.getElementById(`whyIncluded-${PROF_A}`) as HTMLTextAreaElement;
    await user.type(parecer, "Responde à continuidade que ela pediu.");

    const conjunto = screen.getByLabelText("Por que estas três, juntas");
    await user.type(conjunto, "Três trocas diferentes.");

    // A justificativa do conjunto e o parecer de cada profissional respondem a
    // perguntas distintas. Se compartilharem estado, escrever numa apaga a
    // outra — e o Curador só descobre lendo o Relatório pronto.
    expect(
      parecer.value,
      "o parecer foi sobrescrito pela justificativa do conjunto",
    ).toBe("Responde à continuidade que ela pediu.");
    expect((conjunto as HTMLTextAreaElement).value).toBe("Três trocas diferentes.");
  });

  it("o parecer de um profissional não vaza para o do outro", async () => {
    const user = userEvent.setup();
    renderMesa();

    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);

    const primeiro = document.getElementById(`whyIncluded-${PROF_A}`) as HTMLTextAreaElement;
    const segundo = document.getElementById(`whyIncluded-${PROF_B}`) as HTMLTextAreaElement;
    await user.type(primeiro, "Motivo da primeira.");

    expect(segundo.value, "o parecer atravessou de um profissional para o outro").toBe("");
  });
});

// ---------------------------------------------------------------------------
// T-11-8 · D2-4 — um campo, um nome
// ---------------------------------------------------------------------------

describe("T-11-8 · D2-4 — a justificativa do conjunto é nomeada uma vez", () => {
  function renderRelatorio(marcos: { emittedAt?: string | null; deliveredAt?: string | null } = {}) {
    saveReportActionMock.mockResolvedValue({ success: true });
    render(
      <ReportEditor
        priorityProfileId="00000000-0000-0000-0000-0000000000b1"
        curatedSelectionId="00000000-0000-0000-0000-0000000000c1"
        patientFirstName="Maria"
        initialOptions={[
          {
            professionalProfileId: PROF_A,
            professionalName: "Dra. Fixture A",
            justification: "Responde ao critério de continuidade.",
            relationToWeights: "Converge com o peso maior.",
            relationalReading: "Leitura relacional registrada.",
            attentionPoints: [],
            favorablePoints: [],
            suggestedQuestions: [],
            curatorObservations: "",
          },
        ]}
        initialComposition="O que diferencia os três caminhos."
        emittedAt={marcos.emittedAt ?? null}
        deliveredAt={marcos.deliveredAt ?? null}
        nextStepHref="/portal-curador"
      />,
    );
  }

  it("existe UMA superfície para a justificativa do conjunto", () => {
    renderRelatorio();

    // O nome visível e o nome acessível são o MESMO. Antes eram dois textos
    // concorrentes: título "Por que estas três, juntas" + aria-label
    // "Justificativa da composição".
    const campo = screen.getByLabelText("Por que estas três, juntas");
    expect(campo.tagName).toBe("TEXTAREA");
    expect(screen.queryByLabelText("Justificativa da composição")).toBeNull();

    // E o valor digitado aparece uma vez só.
    expect(screen.getAllByDisplayValue("O que diferencia os três caminhos.")).toHaveLength(1);
  });

  it("o valor visível é exatamente o que a submissão envia", async () => {
    const user = userEvent.setup();
    renderRelatorio();

    const campo = screen.getByLabelText("Por que estas três, juntas");
    await user.clear(campo);
    await user.type(campo, "Três trocas diferentes para a mesma pergunta.");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    const payload = saveReportActionMock.mock.calls.at(-1)![0] as { compositionRationale: string };
    expect(payload.compositionRationale).toBe("Três trocas diferentes para a mesma pergunta.");
  });

  // ---------------------------------------------------------------------------
  // T-11-6 · C8 — congelado é dito antes, não descoberto no erro
  // ---------------------------------------------------------------------------

  it("T-11-6 · emitido ⇒ campos e salvar indisponíveis, com motivo textual", () => {
    renderRelatorio({ emittedAt: "2026-08-11T12:00:00.000Z" });

    const campo = screen.getByLabelText("Por que estas três, juntas");
    const salvar = screen.getByRole("button", { name: "Salvar rascunho" });

    expect(campo).toBeDisabled();
    expect(salvar).toBeDisabled();

    // O motivo é TEXTO, e é o mesmo texto que os dois controles apontam —
    // não é a cor do desabilitado, que não diz nada a quem não a distingue.
    const motivo = document.getElementById("relatorio-congelado");
    expect(motivo, "o motivo do congelamento não está escrito em lugar nenhum").not.toBeNull();
    expect(motivo!.textContent).toMatch(/emitido e está congelado/i);
    expect(campo.getAttribute("aria-describedby")).toBe("relatorio-congelado");
    expect(salvar.getAttribute("aria-describedby")).toBe("relatorio-congelado");
  });

  it("T-11-6 · o teclado não contorna o bloqueio — nenhuma action dispara", async () => {
    const user = userEvent.setup();
    renderRelatorio({ emittedAt: "2026-08-11T12:00:00.000Z" });

    const campo = screen.getByLabelText("Por que estas três, juntas");
    await user.type(campo, "texto que não deveria entrar");
    await user.keyboard("{Tab}{Enter}");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    expect((campo as HTMLTextAreaElement).value).toBe("O que diferencia os três caminhos.");
    expect(
      saveReportActionMock,
      "documento congelado aceitou gravação vinda do teclado",
    ).not.toHaveBeenCalled();
  });

  it("T-11-6 · entregue diz o motivo próprio — os dois marcos não se confundem", () => {
    renderRelatorio({
      emittedAt: "2026-08-11T12:00:00.000Z",
      deliveredAt: "2026-08-11T18:00:00.000Z",
    });

    expect(document.getElementById("relatorio-congelado")!.textContent).toMatch(
      /já foi entregue/i,
    );
  });
});

// ---------------------------------------------------------------------------
// T-11-4 · C6 — eliminar exige motivo, e a tela sabe disso antes de enviar
// ---------------------------------------------------------------------------

describe("T-11-4 · C6 — eliminação sem justificativa é recusada no cliente", () => {
  const view = {
    areaRequirement: "Coluna",
    profileAcknowledged: true,
    counts: { found: 1, selected: 0 },
    mapaPendentes: 0,
    comparison: [],
    professionals: [
      {
        professionalProfileId: PROF_A,
        displayName: "Dra. Fixture A",
        areaRawText: "Ortopedia geral",
        areaTags: [],
        areaSource: "cadastro",
        areaVerificationStatus: "não verificado",
        areaVerifiedAt: null,
        cityUf: "SP",
        declaration: null,
        eligibility: {
          state: "AGUARDANDO_DECLARACAO",
          reason: "Área ainda não declarada pelo Curador.",
          filters: [],
        },
      },
    ],
  };

  async function abrirDeclaracao() {
    const user = userEvent.setup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<EligibilityPanel view={view as any} />);
    await user.click(screen.getByRole("button", { name: "Declarar área" }));
    return user;
  }

  it("escolher ELIMINADO sem escrever o motivo mantém o registro indisponível", async () => {
    const user = await abrirDeclaracao();

    await user.click(screen.getByRole("button", { name: "Incompatível" }));

    const registrar = screen.getByRole("button", { name: "Registrar declaração" });
    expect(registrar, "o cliente ainda deixa eliminar sem motivo").toBeDisabled();

    const aviso = document.getElementById(`falta-justificativa-${PROF_A}`);
    expect(aviso, "a tela não diz por que o registro está indisponível").not.toBeNull();
    expect(aviso!.textContent).toMatch(/Eliminar exige justificativa/i);
    expect(registrar.getAttribute("aria-describedby")).toBe(`falta-justificativa-${PROF_A}`);
  });

  it("nenhuma action é chamada enquanto o motivo estiver vazio", async () => {
    const user = await abrirDeclaracao();
    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.click(screen.getByRole("button", { name: "Registrar declaração" }));

    expect(
      declareAreaMock,
      "o cliente enviou uma eliminação sem motivo e deixou o servidor recusar",
    ).not.toHaveBeenCalled();
  });

  it("escrever o motivo libera o registro — a exigência é do conteúdo, não do clique", async () => {
    const user = await abrirDeclaracao();
    declareAreaMock.mockResolvedValue({ success: true });

    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.type(
      screen.getByLabelText("Justificativa"),
      "A área declarada não alcança o quadro deste caso.",
    );

    const registrar = screen.getByRole("button", { name: "Registrar declaração" });
    expect(registrar).toBeEnabled();

    await user.click(registrar);
    expect(declareAreaMock).toHaveBeenCalledTimes(1);
    expect(declareAreaMock.mock.calls[0]![0]).toMatchObject({
      compatibility: "INCOMPATIVEL",
      rationale: "A área declarada não alcança o quadro deste caso.",
    });
  });

  it("espaço em branco não é justificativa", async () => {
    const user = await abrirDeclaracao();

    await user.click(screen.getByRole("button", { name: "Incompatível" }));
    await user.type(screen.getByLabelText("Justificativa"), "    ");

    expect(screen.getByRole("button", { name: "Registrar declaração" })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// T-11-7 · C4 — uma derivação, duas apresentações
// ---------------------------------------------------------------------------

describe("T-11-7 · C4 — contador e frase têm a mesma origem", () => {
  const etapasBase = () =>
    buildMesaEtapas({
      profileAcknowledged: true,
      mapPending: 0,
      professionalsFound: 3,
      awaitingAreaDeclaration: 0,
      eligible: 3,
      criteriaAwaiting: 0,
      julgamentosAguardando: 0,
      regimeDaAvaliacao: "JUIZO",
      selected: 0,
      reportExists: false,
      reportApproved: false,
      reportEmitted: false,
    });

  it("a mesma lista de etapas produz contador e frase, numa chamada só", () => {
    const etapas = etapasBase();
    const estado = estadoDaMesa(etapas, true);

    expect(estado.total).toBe(etapas.length);
    expect(estado.done).toBe(etapas.filter((e) => e.status === "PRONTA").length);
    expect(estado.decisao.etapa).toBeTruthy();
  });

  it("o cabeçalho recebe UM fato e o apresenta de duas formas", () => {
    const estado = estadoDaMesa(etapasBase(), true);
    render(
      <MesaHeader
        patientName="Maria Fixture"
        areaRequirement="Coluna"
        curatorName="Curador Fixture"
        estado={estado}
        alerts={[]}
      />,
    );

    expect(screen.getByText(new RegExp(`${estado.done} de ${estado.total} etapas`))).toBeTruthy();
    // A frase é a do mesmo estado — nunca uma segunda contagem em palavras.
    const frase = screen.getByText(
      estado.decisao.blocked
        ? estado.decisao.label
        : `Sua vez: ${estado.decisao.label.toLowerCase()}`,
    );
    expect(frase).toBeTruthy();
  });

  it("mudar o fato move as duas apresentações juntas", () => {
    const bloqueado = estadoDaMesa(etapasBase(), false);
    const liberado = estadoDaMesa(etapasBase(), true);

    // O reconhecimento da paciente é o mesmo fato que move a frase; o contador
    // segue a mesma lista. Não existe caminho em que um mude e o outro não.
    expect(bloqueado.decisao.blocked).toBe(true);
    expect(liberado.decisao.blocked).toBe(false);
    expect(bloqueado.total).toBe(liberado.total);
  });

  it("não existe segunda contagem fora do módulo das etapas", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const path = await import("node:path");
    const raiz = process.cwd();

    function varrer(dir: string): string[] {
      return readdirSync(dir).flatMap((entrada) => {
        const completo = path.join(dir, entrada);
        if (statSync(completo).isDirectory()) return varrer(completo);
        return /\.tsx?$/.test(entrada) ? [completo] : [];
      });
    }

    const suspeitos = [
      ...varrer(path.join(raiz, "src/app")),
      ...varrer(path.join(raiz, "src/components")),
    ].filter((arquivo) => /status\s*===\s*"PRONTA"/.test(readFileSync(arquivo, "utf8")));

    expect(
      suspeitos.map((f) => path.relative(raiz, f)),
      "alguém voltou a contar etapas prontas fora de `mesa-etapas` — é assim que " +
        "a barra e os contadores passam a discordar",
    ).toEqual([]);
  });
});
