import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { EscolhaExperienceModel } from "../contracts/experience-models";

export function mapEscolhaExperienceModel(
  view: JornadaDoPacienteView,
): EscolhaExperienceModel | null {
  const entrega = view.extensoes.entrega;
  if (!entrega || view.etapa_atual !== "ESCOLHA") {
    return null;
  }

  return {
    jornada_id: view.jornada_id,
    opcoes: entrega.opcoes,
    comparativo: entrega.comparativo,
    proximo_passo:
      view.proximo_passo ?? {
        titulo: "Confirme sua escolha",
        descricao: "Revise com calma. O curador acompanha sua decisão.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
  };
}
