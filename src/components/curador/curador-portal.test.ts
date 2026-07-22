import { describe, expect, it } from "vitest";

import {
  derivarEstadoOperacionalCurador,
  prioridadeOrdemEstado,
} from "@/infrastructure/curador/curador-estado-operacional";
import { buildJornadaViewCuradoria, buildJornadaViewEntrega } from "@/test/build-jornada-view";
import {
  mapCasoCuradorExperience,
  mapFilaCuradorExperience,
  resolveCuratorCaseSurface,
} from "@/curator-layer/resolve-curator-experience";
import {
  opcoesEstaoCompletas,
  registrarOpcoes,
  WORKSPACE_VAZIO,
} from "@/infrastructure/curador/curador-workspace";
import type { OpcaoRegistradaView } from "@/curator-flow/contracts/curador-view";

const TRES_OPCOES: OpcaoRegistradaView[] = [0, 1, 2].map((indice) => ({
  indice,
  nome: `Prof ${indice + 1}`,
  especialidade: "Cardiologia",
  por_que_esta_aqui: "Trajetória",
  por_que_pode_fazer_sentido: "Forças",
  o_que_esperar: "Expectativa",
  limitacoes: "Limitações",
  evidencias_resumo: "Evidências",
}));

describe("Estado operacional do curador", () => {
  it("deriva EM_ANALISE na curadoria", () => {
    const view = buildJornadaViewCuradoria();
    expect(derivarEstadoOperacionalCurador(view, false, false)).toBe("EM_ANALISE");
  });

  it("deriva BLOQUEADO com bloqueio ativo", () => {
    const view = { ...buildJornadaViewCuradoria(), bloqueio: { motivo_humano: "Doc", desde: "x", etapa: "HISTORIA" as const } };
    expect(derivarEstadoOperacionalCurador(view, false, false)).toBe("BLOQUEADO");
  });

  it("ordena fila por prioridade de estado", () => {
    expect(prioridadeOrdemEstado("BLOQUEADO")).toBeLessThan(prioridadeOrdemEstado("AGUARDANDO"));
    expect(prioridadeOrdemEstado("EM_ANALISE")).toBeLessThan(prioridadeOrdemEstado("ENTREGUE"));
  });
});

describe("Workspace do curador", () => {
  it("registra exatamente três opções sem ranking", () => {
    const workspace = registrarOpcoes(WORKSPACE_VAZIO, TRES_OPCOES);
    expect(opcoesEstaoCompletas(workspace.opcoes_registradas)).toBe(true);
    expect(workspace.rascunho_entrega?.entrega?.opcoes).toHaveLength(3);
    expect(workspace.rascunho_entrega?.modo).toBe("RASCUNHO");
  });
});

describe("Experience layer do curador", () => {
  it("mapeia fila sem reordenar localmente", () => {
    const fila = mapFilaCuradorExperience([
      {
        jornada_id: "j-1",
        paciente_id: "p-1",
        paciente_nome: "Ana",
        titulo_jornada: "Jornada",
        estado_operacional: "EM_ANALISE",
        etapa_atual: "CURADORIA",
        curador_id: null,
        curador_nome: null,
        atualizado_em: "2026-01-01T00:00:00Z",
        prioridade_ordem: 2,
      },
    ]);
    expect(fila.itens).toHaveLength(1);
  });

  it("resolve superfície de entrega após opções", () => {
    const view = buildJornadaViewEntrega();
    const caso = {
      jornada_id: view.jornada_id,
      paciente_id: view.paciente_id,
      paciente_nome: "Ana",
      titulo_jornada: "Jornada",
      jornada: view,
      estado_operacional: "PRONTO_PARA_ENTREGA" as const,
      curador_id: "c-1",
      curador_nome: "Curador",
      assumido_em: null,
      sessao: { sessao_id: "s-1", status: "ABERTA" as const, curador_id: "c-1", aberta_em: "x" },
      conjunto_elegivel: null,
      opcoes_registradas: TRES_OPCOES,
      rascunho_entrega: {
        modo: "RASCUNHO" as const,
        entrega: view.extensoes.entrega,
        comparativo: [],
        atualizado_em: "x",
        aprovado_em: null,
        aprovado_por: null,
      },
      documentos: [],
      bloqueio: null,
      responsavel: view.responsavel,
      timeline_jornada: view.timeline,
      timeline_operacional: [],
      comentarios: [],
    };
    const model = mapCasoCuradorExperience(caso);
    expect(model.pode_publicar_entrega).toBe(false);
    expect(resolveCuratorCaseSurface(caso)).toBe("entrega");
  });
});
