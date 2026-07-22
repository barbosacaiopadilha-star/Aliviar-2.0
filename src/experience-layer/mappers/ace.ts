import { resolverAceFlow } from "@/experience-flow/flows/ace-flow";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { AceExperienceModel, AceVisibilidade } from "../contracts/experience-models";

function mapVisibilidade(
  flowVisibilidade: "ATIVO" | "SILENCIOSO" | "AUSENTE",
  view: JornadaDoPacienteView,
): AceVisibilidade {
  if (flowVisibilidade === "AUSENTE") {
    return "AUSENTE";
  }
  if (flowVisibilidade === "SILENCIOSO") {
    return "SILENCIOSO";
  }
  if (view.bloqueio) {
    return "PRESENTE";
  }
  return "PRESENTE";
}

export function mapAceExperienceModel(view: JornadaDoPacienteView): AceExperienceModel | null {
  const flow = resolverAceFlow(view);
  const etapasComAce = [
    "ACE",
    "CURADORIA",
    "ENTREGA",
    "ESCOLHA",
    "ACOMPANHAMENTO",
    "RELACIONAMENTO",
  ] as const;

  const ativo =
    etapasComAce.includes(view.etapa_atual as (typeof etapasComAce)[number]) &&
    !view.concluida_em;

  if (!ativo && !flow.ativo) {
    return null;
  }

  const visibilidade = mapVisibilidade(flow.visibilidade, view);
  const ausente = visibilidade === "AUSENTE";

  return {
    jornada_id: view.jornada_id,
    ativo,
    visibilidade,
    mensagem_contextual: ausente ? null : (view.proximo_passo?.descricao ?? flow.proximo_passo.descricao),
    pode_interagir: !ausente && visibilidade === "PRESENTE" && (view.proximo_passo?.acao_disponivel ?? true),
    ultima_atualizacao: view.atualizada_em,
    responsavel: view.responsavel,
  };
}
