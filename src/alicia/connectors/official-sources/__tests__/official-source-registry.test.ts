import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  OfficialSourceRegistry,
  computeImpactRanking,
  formatOfficialSourceRoadmapMarkdown,
  OFFICIAL_SOURCE_SEED,
  selectFirstIntegration,
} from "../index";

describe("OfficialSourceRegistry", () => {
  it("lista todas as fontes do programa", () => {
    const registry = new OfficialSourceRegistry();
    expect(registry.list()).toHaveLength(9);
    expect(registry.filterMocked().length).toBeGreaterThan(0);
  });

  it("localiza fonte por connectorId", () => {
    const registry = new OfficialSourceRegistry();
    const source = registry.getByConnectorId("academic-residency");
    expect(source?.nome).toContain("Residência");
  });

  it("atualiza estágio de homologação", () => {
    const registry = new OfficialSourceRegistry();
    const updated = registry.updateStage("cfm-portal", "homologacao");
    expect(updated?.homologacao).toBe(true);
    expect(updated?.mock).toBe(false);
  });

  it("registra sincronização com métricas", () => {
    const registry = new OfficialSourceRegistry();
    const synced = registry.recordSync("graduacao-mec", {
      coberturaObtida: 25,
      latenciaMs: 95,
    });
    expect(synced?.ultimaSincronizacao).toBeTruthy();
    expect(synced?.coberturaObtida).toBe(25);
  });

  it("computa ranking de impacto", () => {
    const ranking = computeImpactRanking(OFFICIAL_SOURCE_SEED);
    expect(ranking.maiorGanhoCobertura.ganhoCoberturaEstimado).toBeGreaterThanOrEqual(22);
    expect(ranking.maiorReducaoReview.id).toBe("residencia-cnrm");
    expect(ranking.primeiraIntegracao.id).toBe("crm-estadual-es");
  });

  it("prioriza CRM como primeira integração", () => {
    const first = selectFirstIntegration(OFFICIAL_SOURCE_SEED);
    expect(first.id).toBe("crm-estadual-es");
  });

  it("gera snapshot com ranking", () => {
    const registry = new OfficialSourceRegistry();
    const snapshot = registry.snapshot();
    expect(snapshot.sources).toHaveLength(9);
    expect(snapshot.ranking.maiorGanhoAutoPublish).toBeDefined();
  });

  it("grava roadmap operacional", () => {
    const registry = new OfficialSourceRegistry();
    const markdown = formatOfficialSourceRoadmapMarkdown(registry.snapshot());
    const outputPath = path.resolve(process.cwd(), "docs/alicia/ROADMAP_FONTES_OFICIAIS.md");

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${markdown}\n`, "utf8");

    expect(markdown).toContain("Official Source Program");
    expect(markdown).toContain("CRM Estadual ES");
    expect(markdown).toContain("Residência CNRM");
    expect(fs.existsSync(outputPath)).toBe(true);
  });
});
