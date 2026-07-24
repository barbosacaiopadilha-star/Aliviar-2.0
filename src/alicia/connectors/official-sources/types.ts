export type HomologationStage = "mock" | "homologacao" | "staging" | "producao";

export type OfficialSourceType =
  | "registro-profissional"
  | "institucional"
  | "academico"
  | "sociedade";

export type OfficialSourceRecord = {
  /** Identificador do conector associado (pode agrupar múltiplos). */
  id: string;
  nome: string;
  tipo: OfficialSourceType;
  responsavel: string;
  /** Estágio ativo mais avançado alcançado. */
  status: HomologationStage;
  mock: boolean;
  homologacao: boolean;
  staging: boolean;
  producao: boolean;
  ultimaSincronizacao: string | null;
  /** Cobertura média observada no piloto ES (%). */
  coberturaObtida: number;
  /** Confiabilidade observada ou estimada (0–1). */
  confiabilidade: number;
  /** Latência média observada (ms); null se indisponível. */
  latenciaMs: number | null;
  connectorIds: readonly string[];
  categoriasAtendidas: readonly string[];
  regrasProtocoloImpactadas: readonly string[];
  /** Ganho estimado de cobertura média ao substituir mock por fonte oficial (pp). */
  ganhoCoberturaEstimado: number;
  /** % de candidatos do piloto com redução projetada de HUMAN_REVIEW. */
  reducaoReviewEstimada: number;
  /** % de candidatos com caminho projetado para AUTO_PUBLISH Nível B. */
  ganhoAutoPublishEstimado: number;
  notas?: string;
};

export type OfficialSourceImpactRanking = {
  maiorGanhoCobertura: OfficialSourceRecord;
  maiorReducaoReview: OfficialSourceRecord;
  maiorGanhoAutoPublish: OfficialSourceRecord;
  primeiraIntegracao: OfficialSourceRecord;
};

export type OfficialSourceRegistrySnapshot = {
  generatedAt: string;
  pilotScope: string;
  sources: OfficialSourceRecord[];
  ranking: OfficialSourceImpactRanking;
};
