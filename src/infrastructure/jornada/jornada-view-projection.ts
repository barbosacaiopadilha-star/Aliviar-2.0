import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import type { EntregaDetalheView, JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import {
  criarEntregaDetalhePadrao,
  parseEntregaDetalhe,
} from "./jornada-projection-helpers";
import { EXTENSOES_VAZIAS, normalizarExtensoes } from "./jornada-view-extensoes";

export function readModelToView(model: JornadaDoPacienteReadModel): JornadaDoPacienteView {
  return {
    jornada_id: model.jornadaId,
    paciente_id: model.pacienteId,
    etapa_atual: model.etapaAtual,
    etapas_concluidas: model.etapasConcluidas,
    estado_visivel: model.estadoVisivel,
    proximo_passo: model.proximoPasso,
    responsavel: model.responsavel,
    bloqueio: model.bloqueio,
    timeline: model.timeline,
    iniciada_em: model.iniciadaEm,
    atualizada_em: model.atualizadaEm,
    concluida_em: model.concluidaEm,
    extensoes: model.extensoes,
  };
}

export function viewToReadModel(view: JornadaDoPacienteView): JornadaDoPacienteReadModel {
  return {
    jornadaId: view.jornada_id,
    pacienteId: view.paciente_id,
    etapaAtual: view.etapa_atual,
    etapasConcluidas: view.etapas_concluidas,
    estadoVisivel: view.estado_visivel,
    proximoPasso: view.proximo_passo,
    responsavel: view.responsavel,
    bloqueio: view.bloqueio,
    timeline: view.timeline,
    iniciadaEm: view.iniciada_em,
    atualizadaEm: view.atualizada_em,
    concluidaEm: view.concluida_em,
    extensoes: normalizarExtensoes(view.extensoes),
  };
}

export function criarProjecaoInicial(params: {
  jornadaId: string;
  pacienteId: string;
  iniciadaEm: string;
}): JornadaDoPacienteReadModel {
  const etapasConcluidas = [
    "PRIMEIRA_DUVIDA",
    "PRIMEIRO_CONTATO",
    "DESCOBERTA",
    "ENTENDIMENTO_METODO",
    "CONFIANCA",
    "CADASTRO",
  ] as const;

  return {
    jornadaId: params.jornadaId,
    pacienteId: params.pacienteId,
    etapaAtual: "HISTORIA",
    etapasConcluidas: [...etapasConcluidas],
    estadoVisivel: "COMPARTILHANDO_HISTORIA",
    proximoPasso: {
      titulo: "Sua história",
      descricao: "Conte o que está acontecendo — no seu ritmo.",
      dono: "PACIENTE",
      acao_disponivel: true,
    },
    responsavel: {
      tipo: "EQUIPE_ALIVIAR",
      nome_exibicao: "Equipe Aliviar",
      canal: "HUMANO",
    },
    bloqueio: null,
    timeline: [
      {
        id: `${params.jornadaId}-inicio`,
        tipo: "INICIO",
        titulo: "Cadastro e jornada iniciados",
        descricao: "Sua jornada na Aliviar começou.",
        ocorrido_em: params.iniciadaEm,
        etapa: "CADASTRO",
        visibilidade: "PUBLICO",
      },
    ],
    iniciadaEm: params.iniciadaEm,
    atualizadaEm: params.iniciadaEm,
    concluidaEm: null,
    extensoes: {
      ...EXTENSOES_VAZIAS,
      tempo_estimado: "Alguns dias para conhecer sua história",
    },
  };
}

export function avancarProjecaoAposAnaliseInicial(
  atual: JornadaDoPacienteReadModel,
  ocorridoEm: string,
): JornadaDoPacienteReadModel {
  return {
    ...atual,
    etapaAtual: "ACE",
    etapasConcluidas: [...atual.etapasConcluidas, "HISTORIA"],
    estadoVisivel: "ACOMPANHADO_PELO_ACE",
    proximoPasso: {
      titulo: "Seu acompanhante",
      descricao: "A ACE está disponível para orientar você.",
      dono: "ALIVIAR",
      acao_disponivel: true,
    },
    responsavel: {
      tipo: "ACE",
      nome_exibicao: "ACE Aliviar",
      canal: "ACE",
    },
    timeline: [
      ...atual.timeline,
      {
        id: `${atual.jornadaId}-analise`,
        tipo: "PROGRESSO",
        titulo: "Análise inicial realizada",
        descricao: "Sua história foi analisada com cuidado.",
        ocorrido_em: ocorridoEm,
        etapa: "HISTORIA",
        visibilidade: "PUBLICO",
      },
    ],
    atualizadaEm: ocorridoEm,
  };
}

export function avancarProjecaoAposSessaoCuradoria(
  atual: JornadaDoPacienteReadModel,
  ocorridoEm: string,
): JornadaDoPacienteReadModel {
  return {
    ...atual,
    etapaAtual: "CURADORIA",
    etapasConcluidas: [...atual.etapasConcluidas, "ACE"],
    estadoVisivel: "EM_CURADORIA",
    proximoPasso: {
      titulo: "Curadoria em andamento",
      descricao: "Estamos analisando com cuidado.",
      dono: "ALIVIAR",
      acao_disponivel: false,
    },
    responsavel: {
      tipo: "CURADOR",
      nome_exibicao: "Curador Aliviar",
      canal: "HUMANO",
    },
    timeline: [
      ...atual.timeline,
      {
        id: `${atual.jornadaId}-curadoria`,
        tipo: "PROGRESSO",
        titulo: "Curadoria iniciada",
        descricao: "Sua curadoria começou.",
        ocorrido_em: ocorridoEm,
        etapa: "CURADORIA",
        visibilidade: "PUBLICO",
      },
    ],
    atualizadaEm: ocorridoEm,
  };
}

export function avancarProjecaoAposEntrega(
  atual: JornadaDoPacienteReadModel,
  ocorridoEm: string,
  entregaId: string,
  conteudo: string,
): JornadaDoPacienteReadModel {
  const entregaDetalhe: EntregaDetalheView =
    parseEntregaDetalhe(entregaId, conteudo) ?? criarEntregaDetalhePadrao(entregaId, conteudo);

  return {
    ...atual,
    etapaAtual: "ENTREGA",
    etapasConcluidas: [...atual.etapasConcluidas, "CURADORIA"],
    estadoVisivel: "ENTREGA_DISPONIVEL",
    proximoPasso: {
      titulo: "Sua curadoria está pronta",
      descricao: "Conheça as três opções preparadas para você.",
      dono: "PACIENTE",
      acao_disponivel: true,
    },
    extensoes: {
      ...atual.extensoes,
      entrega: entregaDetalhe,
      tempo_estimado: "Reserve um momento tranquilo para revisar",
    },
    timeline: [
      ...atual.timeline,
      {
        id: `${atual.jornadaId}-entrega`,
        tipo: "PROGRESSO",
        titulo: "Orientação da Aliviar disponível",
        descricao: "Sua entrega está pronta.",
        ocorrido_em: ocorridoEm,
        etapa: "ENTREGA",
        visibilidade: "PUBLICO",
      },
    ],
    atualizadaEm: ocorridoEm,
  };
}
