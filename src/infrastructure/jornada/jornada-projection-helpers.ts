import type {
  EntregaDetalheView,
  EstadoVisivelJornada,
  EtapaCodigoView,
  OpcaoProfissionalView,
  ProximoPassoView,
  ResponsavelView,
} from "@/experience-flow/contracts/jornada-view";

export const ESTADO_POR_ETAPA_ONBOARDING: Partial<Record<EtapaCodigoView, EstadoVisivelJornada>> = {
  PRIMEIRO_CONTATO: "EXPLORANDO",
  DESCOBERTA: "EXPLORANDO",
  ENTENDIMENTO_METODO: "ENTENDENDO_METODO",
  CONFIANCA: "CONSTRUINDO_CONFIANCA",
  CADASTRO: "CADASTRANDO",
  HISTORIA: "COMPARTILHANDO_HISTORIA",
};

export const PROXIMO_PASSO_POR_ETAPA: Partial<Record<EtapaCodigoView, ProximoPassoView>> = {
  PRIMEIRO_CONTATO: {
    titulo: "Primeira conversa",
    descricao: "Conte o que te trouxe até aqui.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
  DESCOBERTA: {
    titulo: "Conhecendo a Aliviar",
    descricao: "Entenda como podemos ajudar.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
  ENTENDIMENTO_METODO: {
    titulo: "Como trabalhamos",
    descricao: "Conheça nosso método de curadoria.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
  CONFIANCA: {
    titulo: "Construindo confiança",
    descricao: "Tire suas dúvidas com tranquilidade.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
  CADASTRO: {
    titulo: "Seu cadastro",
    descricao: "Confirme seus dados para iniciar.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
  HISTORIA: {
    titulo: "Sua história",
    descricao: "Conte o que está acontecendo — no seu ritmo.",
    dono: "PACIENTE",
    acao_disponivel: true,
  },
};

export const RESPONSAVEL_POR_ETAPA: Partial<Record<EtapaCodigoView, ResponsavelView>> = {
  CONFIANCA: { tipo: "GESTOR", nome_exibicao: "Equipe Aliviar", canal: "HUMANO" },
  CADASTRO: { tipo: "GESTOR", nome_exibicao: "Equipe Aliviar", canal: "HUMANO" },
  HISTORIA: { tipo: "EQUIPE_ALIVIAR", nome_exibicao: "Equipe Aliviar", canal: "HUMANO" },
};

const SEQUENCIA_ONBOARDING: EtapaCodigoView[] = [
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
];

export function proximaEtapaOnboarding(atual: EtapaCodigoView): EtapaCodigoView | null {
  const index = SEQUENCIA_ONBOARDING.indexOf(atual);
  if (index === -1 || index >= SEQUENCIA_ONBOARDING.length - 1) {
    return null;
  }
  return SEQUENCIA_ONBOARDING[index + 1] ?? null;
}

export function parseEntregaDetalhe(
  entregaId: string,
  conteudo: string,
): EntregaDetalheView | null {
  try {
    const parsed = JSON.parse(conteudo) as Partial<EntregaDetalheView>;
    if (parsed.opcoes && parsed.opcoes.length === 3) {
      return {
        entrega_id: entregaId,
        opcoes: parsed.opcoes,
        comparativo: parsed.comparativo ?? [],
        curador_disponivel: parsed.curador_disponivel ?? true,
      };
    }
  } catch {
    // conteúdo legado em texto
  }
  return null;
}

export function criarEntregaDetalhePadrao(entregaId: string, conteudo: string): EntregaDetalheView {
  const opcoes: OpcaoProfissionalView[] = [0, 1, 2].map((indice) => ({
    indice,
    nome: `Opção ${indice + 1}`,
    especialidade: "A definir com curador",
    por_que_esta_aqui: conteudo,
    por_que_pode_fazer_sentido: "Esta opção foi considerada pela curadoria com base na sua história.",
    o_que_esperar: "Um acompanhamento alinhado ao seu momento.",
    limitacoes: "Converse com o curador para entender detalhes específicos.",
    evidencias_resumo: "Baseado na análise da equipe Aliviar.",
  }));

  return {
    entrega_id: entregaId,
    opcoes,
    comparativo: [
      {
        dimensao: "Visão geral",
        narrativa:
          "As três opções foram selecionadas com cuidado. Não há ranking — cada uma representa um caminho possível.",
      },
    ],
    curador_disponivel: true,
  };
}
