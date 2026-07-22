import type { EtapaCodigoView } from "./jornada-view";

export type NavigationNodeId =
  | "LANDING"
  | EtapaCodigoView
  | "ENCERRADO";

export type NavigationActor =
  | "PACIENTE"
  | "STAFF"
  | "ACE"
  | "CURADOR"
  | "SISTEMA"
  | "RELACIONAMENTO";

export type NavigationTrigger =
  | "INTENCAO_CONTATO"
  | "CONTATO_INICIADO"
  | "ETAPA_CONCLUIDA_STAFF"
  | "CADASTRO_CONFIRMADO"
  | "REGISTRAR_CASO_API"
  | "HISTORIA_COMPARTILHADA"
  | "ANALISE_INICIAL_API"
  | "ACE_ATIVADO"
  | "SESSAO_CURADORIA_API"
  | "ENTREGA_API"
  | "ESCOLHA_REGISTRADA"
  | "ACOMPANHAMENTO_SINALIZADO"
  | "VINCULO_ESTABELECIDO"
  | "BLOQUEIO_REGISTRADO"
  | "RETOMADA_REGISTRADA"
  | "JORNADA_CONCLUIDA";

export interface NavigationEdge {
  de: NavigationNodeId;
  para: NavigationNodeId;
  condicao: string;
  responsavel: NavigationActor;
  evento_disparador: NavigationTrigger;
  bloqueios_possiveis: string[];
  fallback: string;
}

export interface NavigationGraph {
  nos: NavigationNodeId[];
  arestas: NavigationEdge[];
}
