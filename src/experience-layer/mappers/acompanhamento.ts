import { resolverRelacionamentoFlow } from "@/experience-flow/flows/relacionamento-flow";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { AcompanhamentoExperienceModel } from "../contracts/experience-models";

export function mapAcompanhamentoExperienceModel(
  view: JornadaDoPacienteView,
): AcompanhamentoExperienceModel | null {
  const flow = resolverRelacionamentoFlow(view);
  if (!flow.ativo) {
    return null;
  }

  const futuros = view.timeline.filter((item) => item.tipo !== "CONCLUSAO").slice(-3);

  return {
    jornada_id: view.jornada_id,
    timeline: view.timeline,
    proximos_eventos: futuros,
    responsavel: view.responsavel,
    escolha: view.extensoes.escolha_registrada,
    tempo_estimado: view.extensoes.tempo_estimado,
  };
}
