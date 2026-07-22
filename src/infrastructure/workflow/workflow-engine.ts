import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { EstadoWorkflowCaso } from "@/workflow-flow/contracts/workflow-engine";
import { resolverEstadoWorkflowCaso } from "@/infrastructure/workflow/derivar-fase-workflow";

export interface ContextoWorkflowCaso {
  view: JornadaDoPacienteView;
  curador_id: string | null;
  entrega_publicada: boolean;
}

export function resolverWorkflowCaso(contexto: ContextoWorkflowCaso): EstadoWorkflowCaso {
  return resolverEstadoWorkflowCaso({
    view: contexto.view,
    curadorAtribuido: contexto.curador_id !== null,
  });
}

export function workflowRequerCurador(contexto: ContextoWorkflowCaso): boolean {
  const estado = resolverWorkflowCaso(contexto);
  return estado.fase_atual === "CURADOR_ATIVO" && estado.ator_com_acao === "CURADOR";
}

export function workflowRequerOperacao(contexto: ContextoWorkflowCaso): boolean {
  const estado = resolverWorkflowCaso(contexto);
  return estado.ator_com_acao === "OPERACAO";
}

export function workflowRequerPaciente(contexto: ContextoWorkflowCaso): boolean {
  const estado = resolverWorkflowCaso(contexto);
  return estado.ator_com_acao === "PACIENTE";
}
