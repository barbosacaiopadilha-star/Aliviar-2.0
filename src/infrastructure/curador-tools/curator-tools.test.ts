import { describe, expect, it } from "vitest";

import { DEFAULT_CHECKLIST_ITEMS } from "@/curator-tools-flow/contracts/curator-tools";
import {
  aggregateProdutividade,
  dedupeSearchResults,
  sanitizeSearchTerm,
} from "@/infrastructure/curador-tools/curator-tools-helpers";

describe("Ferramentas operacionais do curador", () => {
  it("define checklist padrão sem bloquear fluxo", () => {
    expect(DEFAULT_CHECKLIST_ITEMS).toHaveLength(4);
    expect(DEFAULT_CHECKLIST_ITEMS).toContain("Documentação completa");
    expect(DEFAULT_CHECKLIST_ITEMS).toContain("Entrega revisada");
  });

  it("sanitiza termos de pesquisa com caracteres especiais", () => {
    expect(sanitizeSearchTerm("  ana%_test  ")).toBe("ana\\%\\_test");
  });

  it("deduplica resultados de pesquisa por tipo e id", () => {
    const resultados = dedupeSearchResults([
      {
        entity_type: "JORNADA",
        entity_id: "j-1",
        titulo: "A",
        subtitulo: "B",
        href: "/curador/casos/j-1",
      },
      {
        entity_type: "JORNADA",
        entity_id: "j-1",
        titulo: "A duplicado",
        subtitulo: "B",
        href: "/curador/casos/j-1",
      },
      {
        entity_type: "PACIENTE",
        entity_id: "p-1",
        titulo: "Ana",
        subtitulo: "Paciente",
        href: "/patients/p-1",
      },
    ]);

    expect(resultados).toHaveLength(2);
    expect(resultados[0].titulo).toBe("A");
  });

  it("agrega produtividade sem ranking de pessoas", () => {
    const metricas = aggregateProdutividade([
      { estado: "EM_ANALISE", horasDesdeAtualizacao: 10 },
      { estado: "PRONTO_PARA_ENTREGA", horasDesdeAtualizacao: 20 },
      { estado: "ENTREGUE", horasDesdeAtualizacao: 30 },
    ]);

    expect(metricas.amostras).toBe(3);
    expect(metricas.casos_em_andamento).toBe(2);
    expect(metricas.tempo_medio_caso_horas).toBe(20);
    expect(metricas.tempo_medio_revisao_horas).toBe(15);
    expect(metricas.tempo_medio_ate_entrega_horas).toBe(30);
  });

  it("não inclui campos de ranking individual nas métricas", () => {
    const metricas = aggregateProdutividade([]);
    expect(metricas).not.toHaveProperty("ranking");
    expect(metricas).not.toHaveProperty("curadores");
    expect(metricas).not.toHaveProperty("avaliacao_individual");
  });
});
