/**
 * Contratos de leitura consumidos pela Experience Flow.
 * Espelham ALIVIAR_EXPERIENCE_LAYER.md — sem importar domínio.
 */

export const ETAPAS_VIEW = [
  "PRIMEIRA_DUVIDA",
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
  "ACE",
  "CURADORIA",
  "ENTREGA",
  "ESCOLHA",
  "ACOMPANHAMENTO",
  "RELACIONAMENTO",
] as const;

export type EtapaCodigoView = (typeof ETAPAS_VIEW)[number];

export type EstadoVisivelJornada =
  | "EXPLORANDO"
  | "ENTENDENDO_METODO"
  | "CONSTRUINDO_CONFIANCA"
  | "CADASTRANDO"
  | "COMPARTILHANDO_HISTORIA"
  | "ACOMPANHADO_PELO_ACE"
  | "EM_CURADORIA"
  | "AGUARDANDO_DOCUMENTOS"
  | "ENTREGA_DISPONIVEL"
  | "ESCOLHA_PENDENTE"
  | "EM_ACOMPANHAMENTO"
  | "JORNADA_ENCERRADA"
  | "RELACIONAMENTO_ATIVO";

export interface ProximoPassoView {
  titulo: string;
  descricao: string;
  dono: "PACIENTE" | "ALIVIAR" | "NENHUM";
  acao_disponivel: boolean;
}

export interface ResponsavelView {
  tipo: "ACE" | "GESTOR" | "CURADOR" | "EQUIPE_ALIVIAR" | "PACIENTE" | "NENHUM";
  nome_exibicao: string | null;
  canal: "ACE" | "HUMANO" | "NENHUM";
}

export interface BloqueioView {
  motivo_humano: string;
  desde: string;
  etapa: EtapaCodigoView;
}

export type TimelineItemTipo =
  | "INICIO"
  | "PROGRESSO"
  | "PAUSA"
  | "RETOMADA"
  | "ATUALIZACAO"
  | "CONCLUSAO";

export interface TimelineItemView {
  id: string;
  tipo: TimelineItemTipo;
  titulo: string;
  descricao: string;
  ocorrido_em: string;
  etapa: EtapaCodigoView | null;
  visibilidade: "PUBLICO" | "RESUMIDO";
}

export interface JornadaDoPacienteView {
  jornada_id: string;
  paciente_id: string;
  etapa_atual: EtapaCodigoView;
  etapas_concluidas: EtapaCodigoView[];
  estado_visivel: EstadoVisivelJornada;
  proximo_passo: ProximoPassoView | null;
  responsavel: ResponsavelView;
  bloqueio: BloqueioView | null;
  timeline: TimelineItemView[];
  iniciada_em: string;
  atualizada_em: string;
  concluida_em: string | null;
  extensoes: JornadaViewExtensoes;
}

export interface DocumentoItemView {
  id: string;
  nome_arquivo: string;
  status: "RECEBIDO" | "EM_ANALISE" | "ACEITO" | "REJEITADO";
  recebido_em: string;
}

export interface OpcaoProfissionalView {
  indice: number;
  nome: string;
  especialidade: string;
  por_que_esta_aqui: string;
  por_que_pode_fazer_sentido: string;
  o_que_esperar: string;
  limitacoes: string;
  evidencias_resumo: string;
}

export interface ComparativoDimensaoView {
  dimensao: string;
  narrativa: string;
}

export interface EntregaDetalheView {
  entrega_id: string;
  opcoes: OpcaoProfissionalView[];
  comparativo: ComparativoDimensaoView[];
  curador_disponivel: boolean;
}

export interface EscolhaResumoView {
  opcao_indice: number;
  registrada_em: string;
  observacao: string | null;
}

export interface JornadaViewExtensoes {
  tempo_estimado: string | null;
  documentos: DocumentoItemView[];
  entrega: EntregaDetalheView | null;
  escolha_registrada: EscolhaResumoView | null;
}
