import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type {
  AtorWorkflow,
  EstadoWorkflowCaso,
  FaseWorkflow,
  TransicaoWorkflow,
} from "@/workflow-flow/contracts/workflow-engine";
import { TRANSICOES_CANONICAS } from "@/workflow-flow/contracts/workflow-engine";

export function derivarFaseWorkflow(view: JornadaDoPacienteView): FaseWorkflow {
  if (view.concluida_em) {
    return "PACIENTE_RETORNO";
  }

  if (view.bloqueio) {
    if (view.responsavel.tipo === "PACIENTE") {
      return "PACIENTE_ATIVO";
    }
    if (view.etapa_atual === "CURADORIA") {
      return "CURADOR_ATIVO";
    }
    return "OPERACAO_PROCESSANDO";
  }

  switch (view.etapa_atual) {
    case "PRIMEIRA_DUVIDA":
    case "DESCOBERTA":
    case "ENTENDIMENTO_METODO":
    case "CONFIANCA":
    case "CADASTRO":
      return view.proximo_passo?.dono === "PACIENTE" ? "PACIENTE_ATIVO" : "OPERACAO_PROCESSANDO";

    case "HISTORIA":
      return view.estado_visivel === "AGUARDANDO_DOCUMENTOS" ||
        view.estado_visivel === "COMPARTILHANDO_HISTORIA"
        ? "PACIENTE_ATIVO"
        : "OPERACAO_PROCESSANDO";

    case "PRIMEIRO_CONTATO":
    case "ACE":
      return "OPERACAO_PROCESSANDO";

    case "CURADORIA":
      return "CURADOR_ATIVO";

    case "ENTREGA":
    case "ESCOLHA":
    case "ACOMPANHAMENTO":
    case "RELACIONAMENTO":
      return "PACIENTE_RETORNO";

    default:
      return "OPERACAO_PROCESSANDO";
  }
}

export function derivarAtorComAcao(
  view: JornadaDoPacienteView,
  fase: FaseWorkflow,
  curadorAtribuido: boolean,
): AtorWorkflow | "NENHUM" {
  if (view.bloqueio) {
    if (view.responsavel.tipo === "PACIENTE") return "PACIENTE";
    if (view.responsavel.tipo === "CURADOR") return "CURADOR";
    return "OPERACAO";
  }

  switch (fase) {
    case "PACIENTE_ATIVO":
    case "PACIENTE_RETORNO":
      return "PACIENTE";
    case "CURADOR_ATIVO":
      return curadorAtribuido ? "CURADOR" : "OPERACAO";
    case "OPERACAO_PROCESSANDO":
      return "OPERACAO";
    default:
      return "NENHUM";
  }
}

export function derivarTransicoesPermitidas(faseAtual: FaseWorkflow): TransicaoWorkflow[] {
  return TRANSICOES_CANONICAS.filter((t) => t.de === faseAtual);
}

export function resolverEstadoWorkflowCaso(params: {
  view: JornadaDoPacienteView;
  curadorAtribuido: boolean;
}): EstadoWorkflowCaso {
  const fase = derivarFaseWorkflow(params.view);
  return {
    jornada_id: params.view.jornada_id,
    etapa_atual: params.view.etapa_atual,
    fase_atual: fase,
    ator_com_acao: derivarAtorComAcao(params.view, fase, params.curadorAtribuido),
    bloqueado: params.view.bloqueio !== null,
    transicoes_permitidas: derivarTransicoesPermitidas(fase),
  };
}
