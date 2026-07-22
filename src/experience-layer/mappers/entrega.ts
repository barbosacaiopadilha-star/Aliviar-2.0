import { resolverEntregaFlow } from "@/experience-flow/flows/entrega-flow";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { EntregaExperienceModel } from "../contracts/experience-models";

export function mapEntregaExperienceModel(
  view: JornadaDoPacienteView,
): EntregaExperienceModel | null {
  const entrega = view.extensoes.entrega;
  if (!entrega || entrega.opcoes.length !== 3 || view.etapa_atual !== "ENTREGA") {
    return null;
  }

  const flow = resolverEntregaFlow(view);
  if (!flow.ativo) {
    return null;
  }

  return {
    jornada_id: view.jornada_id,
    entrega,
    proximo_passo:
      view.proximo_passo ?? {
        titulo: "Conheça as opções",
        descricao: "Três caminhos possíveis — sem ranking, com narrativa.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
  };
}
