import type { EtapaCodigoView } from "@/experience-flow/contracts/jornada-view";
import type { AtorWorkflow } from "@/workflow-flow/contracts/workflow-engine";

export type FilaOperacionalCodigo =
  | "PRIMEIRO_CONTATO"
  | "DOCUMENTACAO"
  | "CURADORIA"
  | "ENTREGA"
  | "ACOMPANHAMENTO";

export const FILAS_OPERACIONAIS: readonly FilaOperacionalCodigo[] = [
  "PRIMEIRO_CONTATO",
  "DOCUMENTACAO",
  "CURADORIA",
  "ENTREGA",
  "ACOMPANHAMENTO",
] as const;

export const FILA_POR_ETAPA: Record<EtapaCodigoView, FilaOperacionalCodigo> = {
  PRIMEIRA_DUVIDA: "PRIMEIRO_CONTATO",
  PRIMEIRO_CONTATO: "PRIMEIRO_CONTATO",
  DESCOBERTA: "PRIMEIRO_CONTATO",
  ENTENDIMENTO_METODO: "PRIMEIRO_CONTATO",
  CONFIANCA: "PRIMEIRO_CONTATO",
  CADASTRO: "PRIMEIRO_CONTATO",
  HISTORIA: "DOCUMENTACAO",
  ACE: "DOCUMENTACAO",
  CURADORIA: "CURADORIA",
  ENTREGA: "ENTREGA",
  ESCOLHA: "ENTREGA",
  ACOMPANHAMENTO: "ACOMPANHAMENTO",
  RELACIONAMENTO: "ACOMPANHAMENTO",
};

export interface ItemFilaOperacional {
  jornada_id: string;
  paciente_id: string;
  paciente_nome: string;
  titulo_jornada: string;
  fila: FilaOperacionalCodigo;
  etapa_atual: EtapaCodigoView;
  ator_com_acao: AtorWorkflow | "NENHUM";
  bloqueado: boolean;
  curador_id: string | null;
  curador_nome: string | null;
  atualizado_em: string;
  ordem_fila: number;
}

export interface FilasOperacionaisView {
  filas: Record<FilaOperacionalCodigo, ItemFilaOperacional[]>;
  total_casos: number;
}
