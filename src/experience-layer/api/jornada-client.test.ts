import { describe, expect, it, vi } from "vitest";

import {
  avancarProjecaoAposAnaliseInicial,
  criarProjecaoInicial,
} from "@/infrastructure/jornada/jornada-view-projection";
import { fetchJornadaView } from "@/experience-layer/api/jornada-client";

describe("jornada-client", () => {
  it("fetchJornadaView retorna data da API", async () => {
    const view = {
      jornada_id: "j-1",
      paciente_id: "p-1",
      etapa_atual: "HISTORIA",
      etapas_concluidas: [],
      estado_visivel: "COMPARTILHANDO_HISTORIA",
      proximo_passo: null,
      responsavel: { tipo: "EQUIPE_ALIVIAR", nome_exibicao: null, canal: "HUMANO" },
      bloqueio: null,
      timeline: [],
      iniciada_em: "2026-01-01T00:00:00Z",
      atualizada_em: "2026-01-01T00:00:00Z",
      concluida_em: null,
      extensoes: {
        tempo_estimado: null,
        documentos: [],
        entrega: null,
        escolha_registrada: null,
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: view }),
      }),
    );

    const result = await fetchJornadaView("j-1");
    expect(result.jornada_id).toBe("j-1");
    vi.unstubAllGlobals();
  });
});

describe("projection transitions", () => {
  it("avança para ACE após análise inicial", () => {
    const inicial = criarProjecaoInicial({
      jornadaId: "j-1",
      pacienteId: "p-1",
      iniciadaEm: "2026-01-01T00:00:00Z",
    });
    const avancada = avancarProjecaoAposAnaliseInicial(inicial, "2026-01-02T00:00:00Z");
    expect(avancada.etapaAtual).toBe("ACE");
    expect(avancada.etapasConcluidas).toContain("HISTORIA");
  });
});
