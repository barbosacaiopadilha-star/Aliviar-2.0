import { computeImpactRanking } from "./impact-analysis";
import { OFFICIAL_SOURCE_SEED } from "./official-source-seed";
import type {
  HomologationStage,
  OfficialSourceRecord,
  OfficialSourceRegistrySnapshot,
} from "./types";

export class OfficialSourceRegistry {
  private sources: OfficialSourceRecord[];

  constructor(seed: OfficialSourceRecord[] = OFFICIAL_SOURCE_SEED) {
    this.sources = seed.map((source) => ({ ...source }));
  }

  list(): OfficialSourceRecord[] {
    return this.sources.map((source) => ({ ...source }));
  }

  get(id: string): OfficialSourceRecord | undefined {
    const source = this.sources.find((item) => item.id === id);
    return source ? { ...source } : undefined;
  }

  getByConnectorId(connectorId: string): OfficialSourceRecord | undefined {
    const source = this.sources.find((item) => item.connectorIds.includes(connectorId));
    return source ? { ...source } : undefined;
  }

  filterByStage(stage: HomologationStage): OfficialSourceRecord[] {
    return this.sources
      .filter((source) => source.status === stage)
      .map((source) => ({ ...source }));
  }

  filterMocked(): OfficialSourceRecord[] {
    return this.sources.filter((s) => s.mock).map((s) => ({ ...s }));
  }

  filterOfficial(): OfficialSourceRecord[] {
    return this.sources.filter((s) => !s.mock || s.homologacao).map((s) => ({ ...s }));
  }

  updateStage(id: string, stage: HomologationStage): OfficialSourceRecord | null {
    const source = this.sources.find((item) => item.id === id);
    if (!source) {
      return null;
    }

    source.status = stage;
    source.mock = stage === "mock";
    source.homologacao = stage === "homologacao" || stage === "staging" || stage === "producao";
    source.staging = stage === "staging" || stage === "producao";
    source.producao = stage === "producao";

    return { ...source };
  }

  recordSync(id: string, metrics: Partial<Pick<OfficialSourceRecord, "coberturaObtida" | "confiabilidade" | "latenciaMs">>): OfficialSourceRecord | null {
    const source = this.sources.find((item) => item.id === id);
    if (!source) {
      return null;
    }

    source.ultimaSincronizacao = new Date().toISOString();
    if (metrics.coberturaObtida !== undefined) {
      source.coberturaObtida = metrics.coberturaObtida;
    }
    if (metrics.confiabilidade !== undefined) {
      source.confiabilidade = metrics.confiabilidade;
    }
    if (metrics.latenciaMs !== undefined) {
      source.latenciaMs = metrics.latenciaMs;
    }

    return { ...source };
  }

  snapshot(pilotScope = "ES — Ortopedia, Neurocirurgia"): OfficialSourceRegistrySnapshot {
    const sources = this.list();
    return {
      generatedAt: new Date().toISOString(),
      pilotScope,
      sources,
      ranking: computeImpactRanking(sources),
    };
  }
}

export const defaultOfficialSourceRegistry = new OfficialSourceRegistry();
