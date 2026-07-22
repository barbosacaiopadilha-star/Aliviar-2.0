import { resolverCuradoriaFlow } from "@/experience-flow/flows/curadoria-flow";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { CuradoriaExperienceModel } from "../contracts/experience-models";

export function mapCuradoriaExperienceModel(
  view: JornadaDoPacienteView,
): CuradoriaExperienceModel | null {
  const flow = resolverCuradoriaFlow(view);
  if (!flow.ativo) {
    return null;
  }

  return {
    jornada_id: view.jornada_id,
    status: flow.status,
    proximo_passo: view.proximo_passo ?? flow.proximo_passo,
    responsavel: view.responsavel,
    explicacao:
      flow.status === "AGUARDANDO"
        ? "Estamos aguardando informações para continuar a curadoria."
        : "Nossa equipe está analisando seu caso com cuidado. Nenhuma decisão é automática.",
  };
}
