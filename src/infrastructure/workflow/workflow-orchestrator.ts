import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { EstadoWorkflowCaso } from "@/workflow-flow/contracts/workflow-engine";
import { resolverWorkflowCaso } from "@/infrastructure/workflow/workflow-engine";
import { classificarCasoNaFila } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { derivarSlaEtapa } from "@/infrastructure/workflow/derivar-sla-operacional";
import { derivarNotificacoesCaso } from "@/infrastructure/workflow/derivar-notificacoes-operacionais";
import { entregaEstaPublicada } from "@/infrastructure/workflow/workflow-helpers";

export interface SnapshotWorkflowCaso {
  workflow: EstadoWorkflowCaso;
  fila: ReturnType<typeof classificarCasoNaFila>;
  sla: ReturnType<typeof derivarSlaEtapa>;
  notificacoes: ReturnType<typeof derivarNotificacoesCaso>;
}

export function projetarSnapshotWorkflow(params: {
  jornada_id: string;
  paciente_id: string;
  paciente_nome: string;
  titulo_jornada: string;
  view: JornadaDoPacienteView;
  curador_id: string | null;
  curador_nome: string | null;
  atualizado_em: string;
  workspace_data?: unknown;
}): SnapshotWorkflowCaso {
  const publicada = entregaEstaPublicada(params.view, params.workspace_data);
  const workflow = resolverWorkflowCaso({
    view: params.view,
    curador_id: params.curador_id,
    entrega_publicada: publicada,
  });

  return {
    workflow,
    fila: classificarCasoNaFila(params),
    sla: derivarSlaEtapa({ jornadaId: params.jornada_id, view: params.view }),
    notificacoes: derivarNotificacoesCaso({
      jornada_id: params.jornada_id,
      paciente_nome: params.paciente_nome,
      view: params.view,
      curador_atribuido: params.curador_id !== null,
      entrega_publicada: publicada,
    }),
  };
}

export const TRANSICOES_FLUXO_COMPLETO = [
  "PACIENTE_INICIA",
  "DOCUMENTOS_CHEGAM",
  "CURADOR_ASSUME",
  "ENTREGA_PUBLICADA",
  "PACIENTE_ESCOLHE",
  "RELACIONAMENTO",
] as const;

export type MarcoFluxoCompleto = (typeof TRANSICOES_FLUXO_COMPLETO)[number];

export function validarMarcoFluxo(view: JornadaDoPacienteView, marco: MarcoFluxoCompleto): boolean {
  switch (marco) {
    case "PACIENTE_INICIA":
      return view.etapa_atual === "PRIMEIRA_DUVIDA" || view.etapas_concluidas.includes("PRIMEIRA_DUVIDA");
    case "DOCUMENTOS_CHEGAM":
      return view.extensoes.documentos.length > 0;
    case "CURADOR_ASSUME":
      return view.etapa_atual === "CURADORIA" || view.etapas_concluidas.includes("CURADORIA");
    case "ENTREGA_PUBLICADA":
      return view.extensoes.entrega !== null || view.etapa_atual === "ENTREGA";
    case "PACIENTE_ESCOLHE":
      return view.extensoes.escolha_registrada !== null || view.etapa_atual === "ESCOLHA";
    case "RELACIONAMENTO":
      return (
        view.etapa_atual === "ACOMPANHAMENTO" ||
        view.etapa_atual === "RELACIONAMENTO" ||
        view.etapas_concluidas.includes("ACOMPANHAMENTO")
      );
  }
}
