import type { EtapaCodigoView } from "./jornada-view";

export const ESTADOS_FLUXO = [
  "EXPLORANDO",
  "PRIMEIRO_CONTATO",
  "CADASTRO",
  "HISTORIA",
  "ACE",
  "CURADORIA",
  "ENTREGA",
  "ESCOLHA",
  "RELACIONAMENTO",
  "ENCERRADO",
] as const;

export type EstadoFluxo = (typeof ESTADOS_FLUXO)[number];

export type MutadorEstado =
  | "DOMINIO_JORNADA"
  | "APPLICATION_STAFF"
  | "API_CANONICA"
  | "EVENTO_EXTERNO";

export interface TransicaoEstadoFluxo {
  de: EstadoFluxo;
  para: EstadoFluxo;
  evento: string;
  mutador: MutadorEstado;
}

export interface EstadoFluxoRegra {
  estado: EstadoFluxo;
  etapas_dominio: EtapaCodigoView[];
  pode_alterar: MutadorEstado[];
  nunca_altera: ("INTERFACE" | "EXPERIENCE_LAYER" | "EXPERIENCE_FLOW")[];
}
