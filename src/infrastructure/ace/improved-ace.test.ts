import { describe, expect, it } from "vitest";

import { ACE_MELHORADO_VERSION } from "@/ace-flow/contracts/ace-analysis";
import { executarAceMelhorado } from "@/infrastructure/ace/improved-ace-engine";
import { buildJornadaViewHistorico } from "@/test/build-jornada-view";

describe("ACE Melhorado", () => {
  it("produz análise estruturada sem decisão clínica", () => {
    const view = {
      ...buildJornadaViewHistorico(),
      extensoes: {
        ...buildJornadaViewHistorico().extensoes,
        documentos: [
          {
            id: "doc-1",
            nome_arquivo: "exame.pdf",
            status: "RECEBIDO" as const,
            recebido_em: "2026-01-15T10:00:00Z",
          },
        ],
        ace_analise: null,
      },
    };

    const resultado = executarAceMelhorado({
      view,
      trigger: "UPLOAD",
      observacoesStaff: "Contexto operacional",
    });

    expect(resultado.versao).toBe(ACE_MELHORADO_VERSION);
    expect(resultado.status).toBe("CONCLUIDO");
    expect(resultado.documentos_analisados).toHaveLength(1);
    expect(resultado).not.toHaveProperty("diagnostico");
    expect(resultado).not.toHaveProperty("recomendacao_clinica");
    expect(resultado.resumo_para_curador).toContain("apoio à curadoria");
  });

  it("retorna PARCIAL quando não há documentos", () => {
    const view = {
      ...buildJornadaViewHistorico(),
      extensoes: {
        ...buildJornadaViewHistorico().extensoes,
        documentos: [],
        ace_analise: null,
      },
    };

    const resultado = executarAceMelhorado({ view, trigger: "STAFF" });
    expect(resultado.status).toBe("PARCIAL");
    expect(resultado.lacunas_informacao.length).toBeGreaterThan(0);
  });

  it("não inclui ranking ou decisão automatizada", () => {
    const resultado = executarAceMelhorado({
      view: buildJornadaViewHistorico(),
      trigger: "SISTEMA",
    });

    expect(resultado).not.toHaveProperty("ranking");
    expect(resultado).not.toHaveProperty("decisao");
    expect(resultado.proximos_passos_sugeridos.every((p) => !p.includes("diagnóstico"))).toBe(true);
  });
});
