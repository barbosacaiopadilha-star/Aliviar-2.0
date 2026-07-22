import type {
  BloqueioView,
  EntregaDetalheView,
  EstadoVisivelJornada,
  EtapaCodigoView,
  JornadaViewExtensoes,
  ProximoPassoView,
  ResponsavelView,
  TimelineItemView,
} from "@/experience-flow/contracts/jornada-view";

export interface JornadaDoPacienteReadModel {
  jornadaId: string;
  pacienteId: string;
  etapaAtual: EtapaCodigoView;
  etapasConcluidas: EtapaCodigoView[];
  estadoVisivel: EstadoVisivelJornada;
  proximoPasso: ProximoPassoView | null;
  responsavel: ResponsavelView;
  bloqueio: BloqueioView | null;
  timeline: TimelineItemView[];
  iniciadaEm: string;
  atualizadaEm: string;
  concluidaEm: string | null;
  extensoes: JornadaViewExtensoes;
}

export type { EntregaDetalheView };
