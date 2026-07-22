import type { ResponsavelView } from "@/experience-flow/contracts/jornada-view";
import type { FilaOperacionalCodigo } from "@/workflow-flow/contracts/filas-operacionais";

export type StatusSla = "NO_PRAZO" | "PROXIMO_VENCIMENTO" | "VENCIDO";

export interface PoliticaSlaFila {
  fila: FilaOperacionalCodigo;
  tempo_esperado_horas: number;
  tempo_limite_horas: number;
  responsavel: ResponsavelView["tipo"];
}

export interface SlaEtapaOperacional {
  jornada_id: string;
  fila: FilaOperacionalCodigo;
  tempo_esperado_horas: number;
  tempo_limite_horas: number;
  responsavel: ResponsavelView["tipo"];
  status: StatusSla;
  inicio_em: string;
  limite_em: string;
  horas_decorridas: number;
}

export const POLITICAS_SLA: readonly PoliticaSlaFila[] = [
  {
    fila: "PRIMEIRO_CONTATO",
    tempo_esperado_horas: 24,
    tempo_limite_horas: 48,
    responsavel: "EQUIPE_ALIVIAR",
  },
  {
    fila: "DOCUMENTACAO",
    tempo_esperado_horas: 48,
    tempo_limite_horas: 72,
    responsavel: "ACE",
  },
  {
    fila: "CURADORIA",
    tempo_esperado_horas: 72,
    tempo_limite_horas: 120,
    responsavel: "CURADOR",
  },
  {
    fila: "ENTREGA",
    tempo_esperado_horas: 24,
    tempo_limite_horas: 48,
    responsavel: "PACIENTE",
  },
  {
    fila: "ACOMPANHAMENTO",
    tempo_esperado_horas: 168,
    tempo_limite_horas: 336,
    responsavel: "EQUIPE_ALIVIAR",
  },
] as const;
