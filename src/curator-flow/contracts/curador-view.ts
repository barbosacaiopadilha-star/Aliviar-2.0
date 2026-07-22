import type {
  BloqueioView,
  DocumentoItemView,
  EntregaDetalheView,
  JornadaDoPacienteView,
  ResponsavelView,
  TimelineItemView,
} from "@/experience-flow/contracts/jornada-view";

export type EstadoOperacionalCurador =
  | "AGUARDANDO"
  | "EM_ANALISE"
  | "BLOQUEADO"
  | "PRONTO_PARA_ENTREGA"
  | "ENTREGUE"
  | "ACOMPANHAMENTO";

export interface FilaCasoItemView {
  jornada_id: string;
  paciente_id: string;
  paciente_nome: string;
  titulo_jornada: string;
  estado_operacional: EstadoOperacionalCurador;
  etapa_atual: JornadaDoPacienteView["etapa_atual"];
  curador_id: string | null;
  curador_nome: string | null;
  atualizado_em: string;
  prioridade_ordem: number;
}

export interface CandidatoElegivelView {
  id: string;
  nome: string;
  especialidade: string;
  nota_curador: string | null;
}

export interface ConjuntoElegivelView {
  candidatos: CandidatoElegivelView[];
  atualizado_em: string;
}

export interface SessaoDeCuradoriaView {
  sessao_id: string | null;
  status: "NAO_INICIADA" | "ABERTA" | "ENCERRADA";
  curador_id: string | null;
  aberta_em: string | null;
}

export interface OpcaoRegistradaView {
  indice: number;
  nome: string;
  especialidade: string;
  por_que_esta_aqui: string;
  por_que_pode_fazer_sentido: string;
  o_que_esperar: string;
  limitacoes: string;
  evidencias_resumo: string;
}

export type ModoEntregaCurador = "RASCUNHO" | "REVISAO" | "APROVADO" | "PUBLICADO";

export interface EntregaRascunhoView {
  modo: ModoEntregaCurador;
  entrega: EntregaDetalheView | null;
  comparativo: EntregaDetalheView["comparativo"];
  atualizado_em: string;
  aprovado_em: string | null;
  aprovado_por: string | null;
}

export interface ComentarioOperacionalView {
  id: string;
  autor_id: string;
  autor_nome: string;
  conteudo: string;
  criado_em: string;
}

export interface TimelineOperacionalItemView {
  id: string;
  tipo: "EVENTO" | "COMENTARIO" | "TRANSICAO";
  titulo: string;
  descricao: string;
  responsavel: ResponsavelView | null;
  ocorrido_em: string;
}

export interface CasoDeCuradoriaView {
  jornada_id: string;
  paciente_id: string;
  paciente_nome: string;
  titulo_jornada: string;
  jornada: JornadaDoPacienteView;
  estado_operacional: EstadoOperacionalCurador;
  curador_id: string | null;
  curador_nome: string | null;
  assumido_em: string | null;
  sessao: SessaoDeCuradoriaView;
  conjunto_elegivel: ConjuntoElegivelView | null;
  opcoes_registradas: OpcaoRegistradaView[] | null;
  rascunho_entrega: EntregaRascunhoView | null;
  documentos: DocumentoItemView[];
  bloqueio: BloqueioView | null;
  responsavel: ResponsavelView;
  timeline_jornada: TimelineItemView[];
  timeline_operacional: TimelineOperacionalItemView[];
  comentarios: ComentarioOperacionalView[];
}

export interface CuratorWorkspaceData {
  sessao: SessaoDeCuradoriaView;
  conjunto_elegivel: ConjuntoElegivelView | null;
  opcoes_registradas: OpcaoRegistradaView[] | null;
  rascunho_entrega: EntregaRascunhoView | null;
  comentarios: ComentarioOperacionalView[];
}
