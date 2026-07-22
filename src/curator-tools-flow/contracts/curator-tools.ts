export type CuratorSearchEntityType =
  | "PACIENTE"
  | "JORNADA"
  | "MEDICO"
  | "DOCUMENTO"
  | "PROTOCOLO"
  | "NUMERO_JORNADA";

export interface CuratorSearchResultItem {
  entity_type: CuratorSearchEntityType;
  entity_id: string;
  titulo: string;
  subtitulo: string;
  href: string;
}

export interface CuratorSearchResult {
  query: string;
  resultados: CuratorSearchResultItem[];
  total: number;
}

export type CuratorFavoriteEntityType = "JORNADA" | "MEDICO" | "DOCUMENTO";

export interface CuratorFavoriteView {
  entity_type: CuratorFavoriteEntityType;
  entity_id: string;
  label: string;
  created_at: string;
}

export interface CuratorPrivateNoteView {
  id: string;
  jornada_id: string | null;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
}

export interface CuratorChecklistItemView {
  id: string;
  label: string;
  concluido: boolean;
}

export interface CuratorChecklistView {
  jornada_id: string;
  items: CuratorChecklistItemView[];
  atualizado_em: string;
}

export type CuratorTemplateCategory = "MENSAGEM" | "JUSTIFICATIVA" | "OBSERVACAO";

export interface CuratorTemplateView {
  id: string;
  categoria: CuratorTemplateCategory;
  titulo: string;
  conteudo: string;
  atualizado_em: string;
}

export interface CuratorHistoricoItemView {
  id: string;
  tipo: "ACAO" | "DOCUMENTO" | "COMENTARIO" | "AUDITORIA" | "JORNADA";
  titulo: string;
  descricao: string;
  responsavel: string | null;
  ocorrido_em: string;
}

export interface CuratorHistoricoConsolidadoView {
  jornada_id: string;
  itens: CuratorHistoricoItemView[];
}

export interface CuratorProdutividadeView {
  tempo_medio_caso_horas: number;
  casos_em_andamento: number;
  tempo_medio_revisao_horas: number;
  tempo_medio_ate_entrega_horas: number;
  amostras: number;
  gerado_em: string;
}

export const DEFAULT_CHECKLIST_ITEMS: readonly string[] = [
  "Documentação completa",
  "Exames revisados",
  "Critérios conferidos",
  "Entrega revisada",
] as const;
