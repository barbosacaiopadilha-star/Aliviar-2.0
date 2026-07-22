import type { EtapaCodigoView } from "@/experience-flow/contracts/jornada-view";

/**
 * Atores do ciclo operacional Paciente → Operação → Curador → Paciente.
 * Sem lógica clínica — apenas coordenação.
 */
export type AtorWorkflow = "PACIENTE" | "OPERACAO" | "CURADOR";

export type FaseWorkflow =
  | "PACIENTE_ATIVO"
  | "OPERACAO_PROCESSANDO"
  | "CURADOR_ATIVO"
  | "PACIENTE_RETORNO";

export interface TransicaoWorkflow {
  de: FaseWorkflow;
  para: FaseWorkflow;
  gatilho: string;
  ator_origem: AtorWorkflow;
  ator_destino: AtorWorkflow;
}

export interface EstadoWorkflowCaso {
  jornada_id: string;
  etapa_atual: EtapaCodigoView;
  fase_atual: FaseWorkflow;
  ator_com_acao: AtorWorkflow | "NENHUM";
  bloqueado: boolean;
  transicoes_permitidas: TransicaoWorkflow[];
}

export const CICLO_WORKFLOW: readonly FaseWorkflow[] = [
  "PACIENTE_ATIVO",
  "OPERACAO_PROCESSANDO",
  "CURADOR_ATIVO",
  "PACIENTE_RETORNO",
] as const;

export const TRANSICOES_CANONICAS: readonly TransicaoWorkflow[] = [
  {
    de: "PACIENTE_ATIVO",
    para: "OPERACAO_PROCESSANDO",
    gatilho: "PACIENTE_CONCLUIU_ACAO",
    ator_origem: "PACIENTE",
    ator_destino: "OPERACAO",
  },
  {
    de: "OPERACAO_PROCESSANDO",
    para: "CURADOR_ATIVO",
    gatilho: "CASO_PRONTO_PARA_CURADORIA",
    ator_origem: "OPERACAO",
    ator_destino: "CURADOR",
  },
  {
    de: "CURADOR_ATIVO",
    para: "PACIENTE_RETORNO",
    gatilho: "ENTREGA_PUBLICADA",
    ator_origem: "CURADOR",
    ator_destino: "PACIENTE",
  },
  {
    de: "PACIENTE_RETORNO",
    para: "OPERACAO_PROCESSANDO",
    gatilho: "PACIENTE_SOLICITOU_SUPORTE",
    ator_origem: "PACIENTE",
    ator_destino: "OPERACAO",
  },
  {
    de: "PACIENTE_RETORNO",
    para: "PACIENTE_ATIVO",
    gatilho: "NOVO_CICLO_PACIENTE",
    ator_origem: "PACIENTE",
    ator_destino: "PACIENTE",
  },
] as const;
