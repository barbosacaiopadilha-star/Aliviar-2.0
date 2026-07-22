import type { FilaOperacionalCodigo } from "@/workflow-flow/contracts/filas-operacionais";
import type { StatusSla } from "@/workflow-flow/contracts/sla-operacional";
import type { AtorWorkflow } from "@/workflow-flow/contracts/workflow-engine";

export interface AcaoPendenteItem {
  jornada_id: string;
  paciente_nome: string;
  fila: FilaOperacionalCodigo;
  ator_com_acao: AtorWorkflow;
  descricao: string;
  atualizado_em: string;
}

export interface EsperaItem {
  jornada_id: string;
  paciente_nome: string;
  fila: FilaOperacionalCodigo;
  aguardando_desde: string;
  responsavel_esperado: string;
}

export interface CasoBloqueadoItem {
  jornada_id: string;
  paciente_nome: string;
  motivo: string;
  bloqueado_desde: string;
  etapa: string;
}

export interface SlaVencendoItem {
  jornada_id: string;
  paciente_nome: string;
  fila: FilaOperacionalCodigo;
  status: StatusSla;
  limite_em: string;
  horas_restantes: number;
}

export interface PainelOperacionalModel {
  quem_precisa_agir: AcaoPendenteItem[];
  quem_esta_esperando: EsperaItem[];
  casos_bloqueados: CasoBloqueadoItem[];
  slas_vencendo: SlaVencendoItem[];
  gerado_em: string;
}
