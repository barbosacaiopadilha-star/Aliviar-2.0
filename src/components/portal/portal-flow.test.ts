import { describe, expect, it } from "vitest";

import { avancarProjecaoOnboarding } from "@/infrastructure/jornada/jornada-onboarding-projection";
import {
  avancarProjecaoAposEscolha,
  prepararProjecaoParaEscolha,
} from "@/infrastructure/jornada/jornada-escolha-projection";
import {
  criarProjecaoInicial,
  readModelToView,
} from "@/infrastructure/jornada/jornada-view-projection";
import { resolvePortalSurface } from "@/experience-layer/resolve-canonical-experience";
import { mapEscolhaExperienceModel } from "@/experience-layer/mappers/escolha";
import { mapEntregaExperienceModel } from "@/experience-layer/mappers/entrega";

function criarEntregaExtensoes() {
  return {
    tempo_estimado: null,
    documentos: [],
    escolha_registrada: null,
    ace_analise: null,
    entrega: {
      entrega_id: "e-1",
      curador_disponivel: true,
      comparativo: [{ dimensao: "Visão", narrativa: "Narrativa comparativa." }],
      opcoes: [0, 1, 2].map((indice) => ({
        indice,
        nome: `Prof ${indice + 1}`,
        especialidade: "Cardiologia",
        por_que_esta_aqui: "Trajetória",
        por_que_pode_fazer_sentido: "Forças",
        o_que_esperar: "Expectativa",
        limitacoes: "Limitações",
        evidencias_resumo: "Evidências",
      })),
    },
  };
}

describe("Portal patient flow projections", () => {
  it("avança onboarding etapa a etapa", () => {
    const inicial = {
      ...criarProjecaoInicial({
        jornadaId: "j-1",
        pacienteId: "p-1",
        iniciadaEm: "2026-01-01T00:00:00Z",
      }),
      etapaAtual: "PRIMEIRO_CONTATO" as const,
      etapasConcluidas: ["PRIMEIRA_DUVIDA"] as ("PRIMEIRA_DUVIDA")[],
      estadoVisivel: "EXPLORANDO" as const,
    };

    const avancada = avancarProjecaoOnboarding(inicial, "2026-01-02T00:00:00Z");
    expect(avancada.etapaAtual).toBe("DESCOBERTA");
    expect(avancada.etapasConcluidas).toContain("PRIMEIRO_CONTATO");
  });

  it("registra escolha e avança para acompanhamento", () => {
    const base = criarProjecaoInicial({
      jornadaId: "j-1",
      pacienteId: "p-1",
      iniciadaEm: "2026-01-01T00:00:00Z",
    });

    const escolhaModel = prepararProjecaoParaEscolha(
      { ...base, extensoes: criarEntregaExtensoes() },
      "2026-01-05T00:00:00Z",
    );
    const escolhaView = readModelToView(escolhaModel);

    expect(mapEscolhaExperienceModel(escolhaView)).not.toBeNull();
    expect(resolvePortalSurface(escolhaView)).toBe("escolha");

    const aposEscolha = avancarProjecaoAposEscolha(escolhaModel, 1, "2026-01-06T00:00:00Z", null);
    expect(aposEscolha.etapaAtual).toBe("ACOMPANHAMENTO");
    expect(aposEscolha.extensoes.escolha_registrada?.opcao_indice).toBe(1);
    expect(resolvePortalSurface(readModelToView(aposEscolha))).toBe("acompanhamento");
  });

  it("mapeia entrega com três opções na etapa ENTREGA", () => {
    const view = readModelToView({
      ...criarProjecaoInicial({
        jornadaId: "j-1",
        pacienteId: "p-1",
        iniciadaEm: "2026-01-01T00:00:00Z",
      }),
      etapaAtual: "ENTREGA",
      estadoVisivel: "ENTREGA_DISPONIVEL",
      extensoes: criarEntregaExtensoes(),
    });

    const entrega = mapEntregaExperienceModel(view);
    expect(entrega?.entrega.opcoes).toHaveLength(3);
    expect(resolvePortalSurface(view)).toBe("entrega");
  });
});
