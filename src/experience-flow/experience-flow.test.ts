import { describe, expect, it } from "vitest";
import { NAVIGATION_GRAPH, transicaoPermitida } from "@/experience-flow/navigation-graph";
import { resolverEstadoFluxo } from "@/experience-flow/state-machine";
import { resolverExperienceFlow } from "@/experience-flow";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

function criarView(
  overrides: Partial<JornadaDoPacienteView> = {},
): JornadaDoPacienteView {
  return {
    jornada_id: "j-1",
    paciente_id: "p-1",
    etapa_atual: "HISTORIA",
    etapas_concluidas: ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO", "CADASTRO"],
    estado_visivel: "COMPARTILHANDO_HISTORIA",
    proximo_passo: null,
    responsavel: { tipo: "ACE", nome_exibicao: "Ana", canal: "ACE" },
    bloqueio: null,
    timeline: [],
    iniciada_em: "2026-01-01T00:00:00Z",
    atualizada_em: "2026-01-02T00:00:00Z",
    concluida_em: null,
    extensoes: {
      tempo_estimado: null,
      documentos: [],
      entrega: null,
      escolha_registrada: null,
      ace_analise: null,
      dossie: null,
    },
    ...overrides,
  };
}

describe("Navigation Graph", () => {
  it("possui 14 arestas oficiais (T0–T13)", () => {
    expect(NAVIGATION_GRAPH.arestas).toHaveLength(14);
  });

  it("valida transição CADASTRO → HISTORIA via API", () => {
    const aresta = transicaoPermitida("CADASTRO", "HISTORIA");
    expect(aresta?.evento_disparador).toBe("REGISTRAR_CASO_API");
    expect(aresta?.responsavel).toBe("SISTEMA");
  });
});

describe("State Machine", () => {
  it("resolve ENCERRADO quando jornada concluída", () => {
    const view = criarView({ concluida_em: "2026-06-01T00:00:00Z" });
    expect(resolverEstadoFluxo(view)).toBe("ENCERRADO");
  });

  it("resolve HISTORIA para estado HISTORIA", () => {
    expect(resolverEstadoFluxo(criarView())).toBe("HISTORIA");
  });
});

describe("Experience Flow resolver", () => {
  it("sem jornada ativa apenas LandingFlow", () => {
    const snapshot = resolverExperienceFlow(null);
    expect(snapshot.sem_jornada).toBe(true);
    expect(snapshot.landing.ativo).toBe(true);
    expect(snapshot.onboarding).toBeNull();
  });

  it("com jornada resolve onboarding e journey", () => {
    const snapshot = resolverExperienceFlow(criarView());
    expect(snapshot.onboarding?.ativo).toBe(true);
    expect(snapshot.journey?.ativo).toBe(true);
  });
});
