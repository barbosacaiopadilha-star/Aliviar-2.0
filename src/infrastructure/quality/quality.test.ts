import { describe, expect, it } from "vitest";

import { calcularIndicadoresQualidade } from "@/infrastructure/quality/quality-service";
import { governanceRoleHasPermission } from "@/lib/auth/rbac";

describe("Qualidade operacional", () => {
  it("calcula indicadores sem ranking de pessoas", () => {
    const indicadores = calcularIndicadoresQualidade({
      incidentes: [
        {
          categoria: "PLATAFORMA",
          criado_em: "2026-01-01T00:00:00Z",
          resolvido_em: "2026-01-01T12:00:00Z",
        },
        {
          categoria: "COMUNICACAO",
          criado_em: "2026-01-02T00:00:00Z",
          resolvido_em: null,
        },
      ],
      feedbacks: [
        { satisfacao_geral: 5, clareza_informacoes: 4, facilidade_uso: 5 },
        { satisfacao_geral: 3, clareza_informacoes: 3, facilidade_uso: 4 },
      ],
      incidentesAbertos: 1,
    });

    expect(indicadores.tempo_medio_resolucao_horas).toBe(12);
    expect(indicadores.satisfacao_media).toBe(4);
    expect(indicadores.feedback_pendente).toBe(1);
    expect(indicadores.incidentes_por_categoria).toHaveLength(2);
    expect(indicadores).not.toHaveProperty("ranking");
    expect(indicadores).not.toHaveProperty("curadores");
  });

  it("autoriza admin e auditor para leitura de qualidade", () => {
    expect(governanceRoleHasPermission("ADMIN", "admin.quality.read")).toBe(true);
    expect(governanceRoleHasPermission("AUDITOR", "admin.quality.read")).toBe(true);
    expect(governanceRoleHasPermission("CURADOR", "admin.quality.read")).toBe(false);
  });

  it("autoriza admin e operador para escrita de qualidade", () => {
    expect(governanceRoleHasPermission("ADMIN", "admin.quality.write")).toBe(true);
    expect(governanceRoleHasPermission("OPERADOR", "admin.quality.write")).toBe(true);
    expect(governanceRoleHasPermission("AUDITOR", "admin.quality.write")).toBe(false);
  });

  it("não inclui categorias clínicas nos contratos de incidente", () => {
    const categorias = ["PLATAFORMA", "PROCESSO", "COMUNICACAO", "DOCUMENTACAO", "OPERACIONAL"];
    expect(categorias).not.toContain("CLINICO");
    expect(categorias).not.toContain("DIAGNOSTICO");
  });
});
