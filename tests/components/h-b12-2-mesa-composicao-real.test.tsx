import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MesaComEstado } from "@/components/curadoria/mesa/mesa-com-estado";
import { MesaWorkspace } from "@/components/curadoria/mesa-workspace";
import { buildMesaEtapas, estadoDaMesa } from "@/modules/curadoria/mesa-etapas";

/**
 * V-B12-2 · O D-6 PROVADO PELA COMPOSIÇÃO REAL.
 *
 * A prova anterior (`d6-rascunho-da-mesa`) montava `MesaEstadoProvider` por
 * conta própria, num harness. Ela prova que o provider **funciona** — e é cega
 * para a única coisa que pode dar errado de novo: o provider estar no lugar
 * errado. Rebaixá-lo para dentro de `conteudo[etapaAtual]` na rota reproduz o
 * defeito original inteiro, e aquela suíte continuaria verde.
 *
 * Aqui a montagem é a mesma que a rota usa — `MesaComEstado` —, com o
 * `MesaShell` de verdade fazendo a troca de etapa que desmonta o slot. Nada de
 * CSS escondendo, nada de provider montado à mão, nada de estado mockado já
 * preenchido. O que se afirma é o comportamento: escrever, sair, voltar,
 * encontrar; e desmontar a Mesa inteira e não encontrar mais.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/modules/curadoria/actions", () => ({
  saveSelectionAction: vi.fn(async () => ({ success: true })),
  saveReportAction: vi.fn(),
  emitReportAction: vi.fn(),
  deliverSelectionAction: vi.fn(),
  generateAssistedDraftAction: vi.fn(),
}));

afterEach(cleanup);

const CASO_A = "aaaaaaaa-0000-4000-8000-000000000001";
const CASO_B = "bbbbbbbb-0000-4000-8000-000000000002";
const PROF_A = "11111111-0000-4000-8000-000000000001";
const PROF_B = "22222222-0000-4000-8000-000000000002";
const PROF_C = "33333333-0000-4000-8000-000000000003";

function candidato(id: string, nome: string) {
  return { professionalProfileId: id, nome, resumo: "3 fortes · 0 parciais", celulas: [] };
}

/** Os fatos que abrem a Mesa direto em CAMINHOS, onde vive o rascunho. */
const ETAPAS = buildMesaEtapas({
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

/**
 * A MESA, montada como a rota a monta. O `conteudo` é o mesmo mapa de etapas —
 * e é ele que o Shell desmonta ao trocar de etapa.
 */
function montarMesa(caseId: string) {
  const estado = { ...estadoDaMesa(ETAPAS, true), decisao: { etapa: "CAMINHOS" as const, label: "Selecionar os três caminhos", blocked: false } };

  return render(
    <MesaComEstado
      caseId={caseId}
      patientName="Paciente Sintética"
      areaRequirement="Coluna"
      curatorName="Curador Sintético"
      estado={estado}
      alerts={[]}
      etapas={ETAPAS}
      contexto={<p>contexto</p>}
      timeline={<p>linha do tempo</p>}
      conteudo={{
        PERFIL: <p>Etapa do Perfil</p>,
        REDE: <p>Etapa da Rede</p>,
        AVALIACAO: <p>Etapa da Avaliação</p>,
        COMPATIBILIDADE: <p>Etapa da Compatibilidade</p>,
        CAMINHOS: (
          <MesaWorkspace
            caseId={caseId}
            candidatos={[
              candidato(PROF_A, "Dra. Fixture A"),
              candidato(PROF_B, "Dr. Fixture B"),
              candidato(PROF_C, "Dra. Fixture C"),
            ]}
            excluidos={[]}
            curatorName="Curador Sintético"
            patientFirstName="Paciente"
            priorityProfileId="99999999-0000-4000-8000-000000000009"
            locked={false}
            reportHref="/portal-curador"
          />
        ),
        RELATORIO: <p>Etapa do Relatório</p>,
      }}
    />,
  );
}

const irPara = async (user: ReturnType<typeof userEvent.setup>, etapa: RegExp) =>
  user.click(screen.getAllByRole("button", { name: etapa })[0]!);

/** Escreve os três tipos de rascunho que a D-6 fazia evaporar. */
async function escreverRascunho(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 3; i += 1) {
    await user.click(screen.getAllByRole("button", { name: "Selecionar" })[0]!);
  }
  await user.type(
    document.getElementById(`whyIncluded-${PROF_A}`) as HTMLTextAreaElement,
    "Responde à continuidade que ela nomeou.",
  );
  await user.type(
    screen.getByLabelText("Por que estas três, juntas"),
    "Três trocas diferentes para a mesma pergunta.",
  );
}

function lerRascunho() {
  const parecer = document.getElementById(`whyIncluded-${PROF_A}`) as HTMLTextAreaElement | null;
  const conjunto = document.getElementById("composicao-rationale") as HTMLTextAreaElement | null;
  return {
    // "Montado" é o workspace, não o campo: a justificativa do conjunto só
    // nasce depois da primeira seleção, e usá-la como sonda confundiria
    // "workspace desmontado" com "nada selecionado ainda".
    montado: screen.queryByRole("heading", { name: "Seu parecer técnico" }) !== null,
    selecionados: screen.queryAllByRole("button", { name: "Remover da seleção" }).length,
    parecer: parecer?.value ?? null,
    conjunto: conjunto?.value ?? null,
  };
}

describe("V-B12-2 · o rascunho sobrevive à troca de etapa, na composição da rota", () => {
  it("escrever, sair da etapa, voltar — os três valores continuam lá", async () => {
    const user = userEvent.setup();
    montarMesa(CASO_A);

    await escreverRascunho(user);
    const antes = lerRascunho();
    expect(antes.selecionados).toBe(3);
    expect(antes.parecer).toBe("Responde à continuidade que ela nomeou.");
    expect(antes.conjunto).toBe("Três trocas diferentes para a mesma pergunta.");

    // Sair da etapa DESMONTA o workspace — é o fato que causava a D-6, e ele
    // continua acontecendo: o que mudou é onde o estado mora.
    await irPara(user, /Rede elegível/);
    expect(lerRascunho().montado, "o workspace não desmontou — a prova seria vazia").toBe(false);
    expect(screen.getByText("Etapa da Rede")).toBeTruthy();

    await irPara(user, /Três caminhos/);
    const depois = lerRascunho();
    expect(depois.montado).toBe(true);
    expect(depois.selecionados, "a seleção evaporou ao trocar de etapa").toBe(3);
    expect(depois.parecer, "o parecer evaporou ao trocar de etapa").toBe(antes.parecer);
    expect(depois.conjunto, "a justificativa evaporou ao trocar de etapa").toBe(antes.conjunto);
  });

  it("passar por várias etapas e voltar preserva igual", async () => {
    const user = userEvent.setup();
    montarMesa(CASO_A);
    await escreverRascunho(user);
    const antes = lerRascunho();

    for (const etapa of [/Mapa de Prioridades/, /Avaliação técnica/, /Compatibilidade/, /Relatório/]) {
      await irPara(user, etapa);
    }
    await irPara(user, /Três caminhos/);

    expect(lerRascunho()).toEqual(antes);
  });

  it("desmontar a Mesa inteira descarta o rascunho — o limite honesto, provado", async () => {
    const user = userEvent.setup();
    const { unmount } = montarMesa(CASO_A);
    await escreverRascunho(user);
    expect(lerRascunho().conjunto).toBe("Três trocas diferentes para a mesma pergunta.");

    // Sair da rota (ou recarregar) é outro ato: o estado vive em memória de
    // propósito, e a Mesa diz isso em vez de fingir persistência.
    unmount();
    cleanup();
    montarMesa(CASO_A);

    const novo = lerRascunho();
    expect(novo.montado).toBe(true);
    expect(novo.selecionados, "a seleção sobreviveu ao desmonte total").toBe(0);
    // Sem seleção, nem o parecer nem a justificativa do conjunto existem —
    // que é exatamente o estado de uma Mesa recém-aberta.
    expect(novo.parecer, "o parecer sobreviveu ao desmonte total").toBe(null);
    expect(novo.conjunto, "a justificativa sobreviveu ao desmonte total").toBe(null);
  });

  it("o rascunho de um Case não atravessa para outro", async () => {
    const user = userEvent.setup();
    const { unmount } = montarMesa(CASO_A);
    await escreverRascunho(user);
    expect(lerRascunho().selecionados).toBe(3);

    unmount();
    cleanup();
    montarMesa(CASO_B);

    const outro = lerRascunho();
    expect(outro.selecionados, "o rascunho do Case A apareceu no Case B").toBe(0);
    expect(outro.conjunto, "a justificativa atravessou de um Case para outro").toBe(null);
    expect(outro.montado, "o workspace do Case B não montou").toBe(true);
  });
});
