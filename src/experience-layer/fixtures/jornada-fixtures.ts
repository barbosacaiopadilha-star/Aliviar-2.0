import type {
  EtapaCodigoView,
  JornadaDoPacienteView,
  TimelineItemView,
} from "@/experience-flow/contracts/jornada-view";

function timelineBase(): TimelineItemView[] {
  return [
    {
      id: "tl-1",
      tipo: "INICIO",
      titulo: "Sua jornada começou",
      descricao: "Bem-vindo à Aliviar.",
      ocorrido_em: "2026-01-10T10:00:00Z",
      etapa: "PRIMEIRA_DUVIDA",
      visibilidade: "PUBLICO",
    },
  ];
}

function criarView(
  etapa_atual: EtapaCodigoView,
  etapas_concluidas: EtapaCodigoView[],
  extras: Partial<JornadaDoPacienteView> = {},
): JornadaDoPacienteView {
  return {
    jornada_id: "jornada-demo",
    paciente_id: "paciente-demo",
    etapa_atual,
    etapas_concluidas,
    estado_visivel: extras.estado_visivel ?? "EXPLORANDO",
    proximo_passo: extras.proximo_passo ?? null,
    responsavel: extras.responsavel ?? {
      tipo: "EQUIPE_ALIVIAR",
      nome_exibicao: "Equipe Aliviar",
      canal: "HUMANO",
    },
    bloqueio: extras.bloqueio ?? null,
    timeline: extras.timeline ?? timelineBase(),
    iniciada_em: "2026-01-10T10:00:00Z",
    atualizada_em: "2026-01-15T14:00:00Z",
    concluida_em: extras.concluida_em ?? null,
  };
}

export const FIXTURE_IDS = [
  "primeiro-contato",
  "descoberta",
  "metodo",
  "confianca",
  "cadastro",
  "historia",
  "ace",
  "curadoria",
  "entrega",
  "bloqueio-documento",
] as const;

export type FixtureId = (typeof FIXTURE_IDS)[number];

export const JORNADA_FIXTURES: Record<FixtureId, JornadaDoPacienteView> = {
  "primeiro-contato": criarView("PRIMEIRO_CONTATO", ["PRIMEIRA_DUVIDA"], {
    estado_visivel: "EXPLORANDO",
    proximo_passo: {
      titulo: "Primeira conversa",
      descricao: "Alguém da Aliviar vai responder em breve.",
      dono: "ALIVIAR",
      acao_disponivel: false,
    },
  }),
  descoberta: criarView("DESCOBERTA", ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO"], {
    estado_visivel: "EXPLORANDO",
    proximo_passo: {
      titulo: "Conhecendo a Aliviar",
      descricao: "Estamos entendendo o que você precisa.",
      dono: "ALIVIAR",
      acao_disponivel: false,
    },
  }),
  metodo: criarView(
    "ENTENDIMENTO_METODO",
    ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO", "DESCOBERTA"],
    {
      estado_visivel: "ENTENDENDO_METODO",
      proximo_passo: {
        titulo: "Como trabalhamos",
        descricao: "História → curadoria → três opções → sua escolha.",
        dono: "ALIVIAR",
        acao_disponivel: false,
      },
    },
  ),
  confianca: criarView(
    "CONFIANCA",
    ["PRIMEIRA_DUVIDA", "PRIMEIRO_CONTATO", "DESCOBERTA", "ENTENDIMENTO_METODO"],
    {
      estado_visivel: "CONSTRUINDO_CONFIANCA",
      responsavel: { tipo: "GESTOR", nome_exibicao: "Marina", canal: "HUMANO" },
      proximo_passo: {
        titulo: "Construindo confiança",
        descricao: "Conheça quem vai coordenar sua jornada.",
        dono: "ALIVIAR",
        acao_disponivel: false,
      },
    },
  ),
  cadastro: criarView(
    "CADASTRO",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
    ],
    {
      estado_visivel: "CADASTRANDO",
      proximo_passo: {
        titulo: "Seu cadastro",
        descricao: "Preencha seus dados para continuar.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
    },
  ),
  historia: criarView(
    "HISTORIA",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
      "CADASTRO",
    ],
    {
      estado_visivel: "COMPARTILHANDO_HISTORIA",
      proximo_passo: {
        titulo: "Sua história",
        descricao: "Conte o que está acontecendo — no seu ritmo.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
    },
  ),
  ace: criarView(
    "ACE",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
      "CADASTRO",
      "HISTORIA",
    ],
    {
      estado_visivel: "ACOMPANHADO_PELO_ACE",
      responsavel: { tipo: "ACE", nome_exibicao: "Ana", canal: "ACE" },
      proximo_passo: {
        titulo: "Seu acompanhante",
        descricao: "A ACE está disponível para orientar você.",
        dono: "ALIVIAR",
        acao_disponivel: true,
      },
      timeline: [
        ...timelineBase(),
        {
          id: "tl-2",
          tipo: "PROGRESSO",
          titulo: "História recebida",
          descricao: "Sua história foi registrada com cuidado.",
          ocorrido_em: "2026-01-14T11:00:00Z",
          etapa: "HISTORIA",
          visibilidade: "PUBLICO",
        },
      ],
    },
  ),
  curadoria: criarView(
    "CURADORIA",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
      "CADASTRO",
      "HISTORIA",
      "ACE",
    ],
    {
      estado_visivel: "EM_CURADORIA",
      responsavel: { tipo: "CURADOR", nome_exibicao: "Dr. Silva", canal: "HUMANO" },
      proximo_passo: {
        titulo: "Curadoria em andamento",
        descricao: "Estamos analisando com cuidado.",
        dono: "ALIVIAR",
        acao_disponivel: false,
      },
    },
  ),
  entrega: criarView(
    "ENTREGA",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
      "CADASTRO",
      "HISTORIA",
      "ACE",
      "CURADORIA",
    ],
    {
      estado_visivel: "ENTREGA_DISPONIVEL",
      responsavel: { tipo: "CURADOR", nome_exibicao: "Dr. Silva", canal: "HUMANO" },
      proximo_passo: {
        titulo: "Sua curadoria está pronta",
        descricao: "Agende o momento para conhecer as opções.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
    },
  ),
  "bloqueio-documento": criarView(
    "HISTORIA",
    [
      "PRIMEIRA_DUVIDA",
      "PRIMEIRO_CONTATO",
      "DESCOBERTA",
      "ENTENDIMENTO_METODO",
      "CONFIANCA",
      "CADASTRO",
    ],
    {
      estado_visivel: "AGUARDANDO_DOCUMENTOS",
      bloqueio: {
        motivo_humano: "Precisamos de um documento para continuar a análise.",
        desde: "2026-01-15T09:00:00Z",
        etapa: "HISTORIA",
      },
      proximo_passo: {
        titulo: "Documento pendente",
        descricao: "Envie o documento solicitado quando puder.",
        dono: "PACIENTE",
        acao_disponivel: true,
      },
    },
  ),
};

export function loadJornadaView(fixtureId?: string | null): JornadaDoPacienteView | null {
  if (!fixtureId) {
    return null;
  }
  if (fixtureId in JORNADA_FIXTURES) {
    return JORNADA_FIXTURES[fixtureId as FixtureId];
  }
  return null;
}

export function isFixtureId(value: string): value is FixtureId {
  return (FIXTURE_IDS as readonly string[]).includes(value);
}
