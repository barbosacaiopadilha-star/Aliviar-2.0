import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MesaEstadoProvider,
  useMesaEstado,
} from "@/components/curadoria/mesa/mesa-estado";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";

/**
 * D-6 · O RASCUNHO SOBREVIVE À TROCA DE ETAPA, E MORRE COM A MESA.
 *
 * A causa nunca foi banco. A rota monta `conteudo: Record<MesaEtapaId,
 * ReactNode>`, `MesaShell` renderiza **apenas** `conteudo[etapaAtual]`, e
 * `MesaWorkspace` mora dentro de um desses slots: trocar de etapa o
 * **desmonta**, e o `useReducer` local morria junto. Três pareceres escritos
 * evaporavam sem uma linha de erro.
 *
 * Por isso o harness abaixo **desmonta de verdade**. Esconder o componente por
 * CSS, ou mantê-lo montado e só ocultá-lo, não reproduz a D-6 — e um teste que
 * não reproduz o defeito não prova a correção.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/modules/curadoria/actions", () => ({
  saveReportAction: vi.fn(),
  saveSelectionAction: vi.fn(),
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

afterEach(cleanup);

const CASE_A = "00000000-0000-0000-0000-0000000000a1";
const CASE_B = "00000000-0000-0000-0000-0000000000b2";
const PERFIL = "00000000-0000-0000-0000-0000000000f1";

function candidato(n: number) {
  return {
    professionalProfileId: `00000000-0000-0000-0000-00000000000${n}`,
    nome: `Profissional ${n}`,
    resumo: `${n} altas · ${n + 1} médias`,
    celulas: [],
  };
}

const CANDIDATOS = [candidato(1), candidato(2), candidato(3), candidato(4)];

/**
 * O harness reproduz a composição real: o estado mora ACIMA, e só a etapa
 * corrente é montada. É `mesa-shell.tsx:199` em miniatura.
 */
function MesaSimulada({ caseId = CASE_A }: { caseId?: string }) {
  const [etapa, setEtapa] = useState<"curadoria" | "outra">("curadoria");
  return (
    <>
      <button type="button" onClick={() => setEtapa(etapa === "curadoria" ? "outra" : "curadoria")}>
        Trocar de etapa
      </button>
      {etapa === "curadoria" ? (
        <MesaWorkspace
          caseId={caseId}
          candidatos={CANDIDATOS}
          excluidos={[]}
          curatorName="Dr. Curador"
          patientFirstName="Maria"
          priorityProfileId={PERFIL}
          reportHref="/relatorio"
        />
      ) : (
        <p>Outra etapa</p>
      )}
    </>
  );
}

function selecionar(n: number) {
  return screen.getAllByRole("button", { name: "Selecionar" })[n - 1]!;
}

describe("T-11-1 · a ida e volta preserva o rascunho", () => {
  it("selecionar, trocar de etapa e voltar: a seleção continua lá", async () => {
    const user = userEvent.setup();
    render(
      <MesaEstadoProvider caseId={CASE_A}>
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    await user.click(selecionar(1));
    await user.click(selecionar(1));
    expect(screen.getAllByText("Selecionado")).toHaveLength(2);

    // Desmonte REAL — o mesmo que a troca de etapa provoca na rota.
    await user.click(screen.getByRole("button", { name: "Trocar de etapa" }));
    expect(screen.getByText("Outra etapa")).toBeInTheDocument();
    expect(screen.queryAllByText("Selecionado")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Trocar de etapa" }));
    expect(
      screen.getAllByText("Selecionado"),
      "a seleção evaporou na troca de etapa — o estado voltou para dentro do que desmonta",
    ).toHaveLength(2);
  });

  it("T-11-2 · o texto do conjunto sobrevive à mesma ida e volta", async () => {
    const user = userEvent.setup();
    render(
      <MesaEstadoProvider caseId={CASE_A}>
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    await user.click(selecionar(1));
    const textareas = screen.getAllByRole("textbox");
    const campo = textareas[textareas.length - 1]!;
    await user.type(campo, "Cobrem continuidade de formas diferentes.");

    await user.click(screen.getByRole("button", { name: "Trocar de etapa" }));
    await user.click(screen.getByRole("button", { name: "Trocar de etapa" }));

    const depois = screen.getAllByRole("textbox");
    expect(depois[depois.length - 1]!).toHaveValue("Cobrem continuidade de formas diferentes.");
  });
});

describe("T-11-2 · nova montagem da Mesa NÃO restaura o rascunho", () => {
  it("desmontar o provider e montar de novo começa vazio", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MesaEstadoProvider caseId={CASE_A}>
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    await user.click(selecionar(1));
    expect(screen.getAllByText("Selecionado")).toHaveLength(1);

    // Sair da rota / recarregar: o estado é de MEMÓRIA, e some com a Mesa.
    // É o limite honesto do §3.3 — e é ele que impede rascunho de juízo
    // clínico de sobreviver ao logout num dispositivo compartilhado.
    unmount();
    render(
      <MesaEstadoProvider caseId={CASE_A}>
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    expect(
      screen.queryAllByText("Selecionado"),
      "o rascunho ressuscitou — algo o persistiu fora da memória",
    ).toHaveLength(0);
  });

  it("o que o servidor já gravou continua inicializando a Mesa", () => {
    render(
      <MesaEstadoProvider
        caseId={CASE_A}
        persisted={{
          selectedIds: [CANDIDATOS[0]!.professionalProfileId],
          pareceres: [],
          compositionRationale: "Justificativa que já estava no banco.",
          closed: false,
        }}
      >
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    expect(screen.getAllByText("Selecionado")).toHaveLength(1);
    const campos = screen.getAllByRole("textbox");
    expect(campos[campos.length - 1]!).toHaveValue("Justificativa que já estava no banco.");
  });
});

describe("Isolamento — rascunho não atravessa", () => {
  it("um Case não consome o estado de outro", () => {
    // Silencia o erro que o React imprime ao propagar a exceção do render.
    const silencio = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() =>
        render(
          <MesaEstadoProvider caseId={CASE_A}>
            <MesaSimulada caseId={CASE_B} />
          </MesaEstadoProvider>,
        ),
      ).toThrow(/nunca atravessa para outro/);
    } finally {
      silencio.mockRestore();
    }
  });

  it("consumir fora do provider falha explicitamente, e não em silêncio", () => {
    const silencio = vi.spyOn(console, "error").mockImplementation(() => {});
    function Solto() {
      useMesaEstado(CASE_A);
      return null;
    }
    try {
      expect(() => render(<Solto />)).toThrow(/fora de <MesaEstadoProvider>/);
    } finally {
      silencio.mockRestore();
    }
  });

  it("os pareceres são separados POR PROFISSIONAL, por construção", async () => {
    const user = userEvent.setup();
    render(
      <MesaEstadoProvider caseId={CASE_A}>
        <MesaSimulada />
      </MesaEstadoProvider>,
    );

    await user.click(selecionar(1));
    await user.click(selecionar(1));

    // Cada parecer carrega o próprio `professionalId`, e o reducer só mexe na
    // entrada cujo id bate — escrever num não pode aparecer no outro.
    const campos = screen.getAllByLabelText("Por que esta opção está aqui");
    expect(campos.length).toBeGreaterThanOrEqual(2);
    await user.type(campos[0]!, "Motivo da primeira.");

    expect(campos[0]!).toHaveValue("Motivo da primeira.");
    expect(campos[1]!, "o parecer vazou para o outro profissional").toHaveValue("");
  });
});

describe("Zero persistência — o rascunho não sai da memória", () => {
  it("o provider não toca storage, cookie, rede nem action", () => {
    const fonte = readFileSync(
      path.join(process.cwd(), "src/components/curadoria/mesa/mesa-estado.tsx"),
      "utf8",
    )
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");

    for (const proibido of [
      "localStorage",
      "sessionStorage",
      "indexedDB",
      "document.cookie",
      "fetch(",
      "useSearchParams",
      "router.replace",
      "supabase",
      "Action(",
    ]) {
      expect(
        fonte,
        `o estado da Mesa é de MEMÓRIA: "${proibido}" o tiraria de lá. Rascunho de ` +
          `parecer é juízo clínico — não pode sobreviver ao logout nem sair do dispositivo.`,
      ).not.toContain(proibido);
    }
  });
});
