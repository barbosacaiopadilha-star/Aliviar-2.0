import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { DossieExperienceModel } from "../contracts/experience-models";

export function mapDossieExperienceModel(
  view: JornadaDoPacienteView,
): DossieExperienceModel | null {
  const dossie = view.extensoes.dossie;
  if (!dossie || dossie.opcoes.length !== 3) {
    return null;
  }

  return {
    jornada_id: view.jornada_id,
    versao: dossie.versao,
    publicado_em: dossie.publicado_em,
    perfil_prioridades: {
      dimensoes: dossie.dimensoes,
      pesos: dossie.pesos,
    },
    opcoes: dossie.opcoes,
    proximo_passo: view.proximo_passo ?? {
      titulo: "Reunião de devolutiva",
      descricao:
        "Seu curador agendará uma conversa para apresentar o dossiê e esclarecer dúvidas.",
      dono: "ALIVIAR",
      acao_disponivel: false,
    },
  };
}
