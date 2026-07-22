import type { EstadoWorkflowCaso } from "@/workflow-flow/contracts/workflow-engine";
import type { SlaEtapaOperacional } from "@/workflow-flow/contracts/sla-operacional";
import type { NotificacoesPendentesView } from "@/workflow-flow/contracts/notificacoes-operacionais";
import { derivarNotificacoesCaso } from "@/infrastructure/workflow/derivar-notificacoes-operacionais";
import { derivarSlaEtapa } from "@/infrastructure/workflow/derivar-sla-operacional";
import { resolverWorkflowCaso } from "@/infrastructure/workflow/workflow-engine";
import { readModelToView, viewToReadModel } from "@/infrastructure/jornada/jornada-view-projection";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { createClient } from "@/lib/supabase/server";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { err, ok, type Result } from "@/domain/shared/result";
import type { DomainError } from "@/domain/shared/errors";
import { entregaEstaPublicada } from "@/infrastructure/workflow/workflow-helpers";

export interface WorkflowCasoView {
  workflow: EstadoWorkflowCaso;
  sla: SlaEtapaOperacional;
  notificacoes: NotificacoesPendentesView;
}

export class ObterWorkflowCaso {
  async execute(jornadaId: string): Promise<Result<WorkflowCasoView, DomainError>> {
    try {
      const supabase = await createClient();

      const { data: viewRow, error } = await supabase
        .from("patient_journey_views")
        .select("view_data")
        .eq("journey_id", jornadaId)
        .maybeSingle();

      if (error) {
        throw new BusinessRuleError(error.message);
      }
      if (!viewRow?.view_data) {
        return err(new NotFoundError("Jornada não encontrada."));
      }

      const { data: workspace } = await supabase
        .from("curator_case_workspaces")
        .select("curator_id, workspace_data")
        .eq("journey_id", jornadaId)
        .maybeSingle();

      const view = readModelToView(viewToReadModel(viewRow.view_data as JornadaDoPacienteView));
      const curadorId = (workspace?.curator_id as string | null) ?? null;
      const publicada = entregaEstaPublicada(view, workspace?.workspace_data);

      const workflow = resolverWorkflowCaso({
        view,
        curador_id: curadorId,
        entrega_publicada: publicada,
      });

      const sla = derivarSlaEtapa({ jornadaId, view });
      const notificacoes = {
        notificacoes: derivarNotificacoesCaso({
          jornada_id: jornadaId,
          paciente_nome: "Paciente",
          view,
          curador_atribuido: curadorId !== null,
          entrega_publicada: publicada,
        }),
      };

      return ok({ workflow, sla, notificacoes });
    } catch (error) {
      return err(error as DomainError);
    }
  }
}
