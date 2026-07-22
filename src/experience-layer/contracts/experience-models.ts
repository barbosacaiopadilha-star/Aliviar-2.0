import type {
  EtapaCodigoView,
  EstadoVisivelJornada,
  JornadaDoPacienteView,
  ProximoPassoView,
  ResponsavelView,
  TimelineItemView,
} from "@/experience-flow/contracts/jornada-view";

export interface ConviteView {
  titulo: string;
  descricao: string;
  acao: string;
}

export interface ConteudoView {
  titulo: string;
  descricao: string;
}

export interface LandingExperienceModel {
  promessa: string;
  convite_contato: ConviteView;
  conteudos_confianca: ConteudoView[];
  etapa_dominio: null;
  proximo_passo: ProximoPassoView;
}

export interface ProgressoOnboardingView {
  etapas_concluidas: number;
  etapas_totais: number;
  percentual: number;
}

export interface PedidoDocumentoView {
  titulo: string;
  descricao: string;
}

export interface OnboardingExperienceModel {
  jornada: JornadaDoPacienteView;
  etapa_atual_legivel: string;
  progresso: ProgressoOnboardingView;
  gestor: ResponsavelView | null;
  proximo_passo: ProximoPassoView;
  pedido_atual: PedidoDocumentoView | null;
  etapas_fluxo: EtapaFluxoOnboardingView[];
}

export interface EtapaFluxoOnboardingView {
  codigo: EtapaCodigoView;
  label: string;
  status: "CONCLUIDA" | "ATUAL" | "FUTURA";
}

export interface MapaEtapaView {
  codigo: EtapaCodigoView;
  label: string;
  status: "CONCLUIDA" | "ATUAL" | "FUTURA" | "BLOQUEADA";
}

export interface MinhaJornadaExperienceModel {
  jornada: JornadaDoPacienteView;
  estado_visivel: EstadoVisivelJornada;
  timeline: TimelineItemView[];
  proximo_passo: ProximoPassoView;
  responsavel: ResponsavelView;
  bloqueio: JornadaDoPacienteView["bloqueio"];
  mapa_etapas: MapaEtapaView[];
  ace_disponivel: boolean;
}

export type AceVisibilidade = "PRESENTE" | "SILENCIOSO" | "AUSENTE";

export interface AceExperienceModel {
  jornada_id: string;
  ativo: boolean;
  visibilidade: AceVisibilidade;
  mensagem_contextual: string | null;
  pode_interagir: boolean;
  ultima_atualizacao: string | null;
  responsavel: ResponsavelView;
}

export interface CanonicalExperienceSnapshot {
  landing: LandingExperienceModel;
  onboarding: OnboardingExperienceModel | null;
  minhaJornada: MinhaJornadaExperienceModel | null;
  ace: AceExperienceModel | null;
}
