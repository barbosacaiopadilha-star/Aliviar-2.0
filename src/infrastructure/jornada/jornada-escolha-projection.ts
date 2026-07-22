import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";

export function avancarProjecaoAposEscolha(
  atual: JornadaDoPacienteReadModel,
  opcaoIndice: number,
  ocorridoEm: string,
  observacao: string | null,
): JornadaDoPacienteReadModel {
  return {
    ...atual,
    etapaAtual: "ACOMPANHAMENTO",
    etapasConcluidas: [...atual.etapasConcluidas, "ENTREGA", "ESCOLHA"],
    estadoVisivel: "EM_ACOMPANHAMENTO",
    proximoPasso: {
      titulo: "Sua escolha foi registrada",
      descricao: "A ACE explica os próximos passos e acompanha você.",
      dono: "ALIVIAR",
      acao_disponivel: false,
    },
    responsavel: {
      tipo: "ACE",
      nome_exibicao: "ACE Aliviar",
      canal: "ACE",
    },
    extensoes: {
      ...atual.extensoes,
      escolha_registrada: {
        opcao_indice: opcaoIndice,
        registrada_em: ocorridoEm,
        observacao,
      },
    },
    timeline: [
      ...atual.timeline,
      {
        id: `${atual.jornadaId}-escolha`,
        tipo: "PROGRESSO",
        titulo: "Escolha registrada",
        descricao: `Você escolheu a opção ${opcaoIndice + 1}.`,
        ocorrido_em: ocorridoEm,
        etapa: "ESCOLHA",
        visibilidade: "PUBLICO",
      },
    ],
    atualizadaEm: ocorridoEm,
  };
}

export function prepararProjecaoParaEscolha(
  atual: JornadaDoPacienteReadModel,
  ocorridoEm: string,
): JornadaDoPacienteReadModel {
  if (atual.etapaAtual === "ESCOLHA") {
    return atual;
  }

  return {
    ...atual,
    etapaAtual: "ESCOLHA",
    etapasConcluidas: atual.etapasConcluidas.includes("ENTREGA")
      ? atual.etapasConcluidas
      : [...atual.etapasConcluidas, "ENTREGA"],
    estadoVisivel: "ESCOLHA_PENDENTE",
    proximoPasso: {
      titulo: "Sua escolha",
      descricao: "Revise as opções e confirme com calma.",
      dono: "PACIENTE",
      acao_disponivel: true,
    },
    atualizadaEm: ocorridoEm,
  };
}
