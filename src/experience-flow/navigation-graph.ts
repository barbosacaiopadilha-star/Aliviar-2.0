import type { NavigationEdge, NavigationGraph } from "./contracts/navigation";

export const NAVIGATION_GRAPH: NavigationGraph = {
  nos: [
    "LANDING",
    "PRIMEIRA_DUVIDA",
    "PRIMEIRO_CONTATO",
    "DESCOBERTA",
    "ENTENDIMENTO_METODO",
    "CONFIANCA",
    "CADASTRO",
    "HISTORIA",
    "ACE",
    "CURADORIA",
    "ENTREGA",
    "ESCOLHA",
    "ACOMPANHAMENTO",
    "RELACIONAMENTO",
    "ENCERRADO",
  ],
  arestas: [
    {
      de: "LANDING",
      para: "PRIMEIRO_CONTATO",
      condicao: "Visitante manifesta intenção de contato (sem jornada ainda)",
      responsavel: "PACIENTE",
      evento_disparador: "INTENCAO_CONTATO",
      bloqueios_possiveis: [],
      fallback: "Permanecer em LANDING até nova intenção",
    },
    {
      de: "PRIMEIRA_DUVIDA",
      para: "PRIMEIRO_CONTATO",
      condicao: "Jornada iniciada e etapa PRIMEIRA_DUVIDA concluída",
      responsavel: "STAFF",
      evento_disparador: "ETAPA_CONCLUIDA_STAFF",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "Manter PRIMEIRA_DUVIDA; ACE comunica pausa se bloqueio",
    },
    {
      de: "PRIMEIRO_CONTATO",
      para: "DESCOBERTA",
      condicao: "Contato humano registrado (CONTATO_INICIADO)",
      responsavel: "STAFF",
      evento_disparador: "CONTATO_INICIADO",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "Permanecer em PRIMEIRO_CONTATO aguardando escuta",
    },
    {
      de: "DESCOBERTA",
      para: "ENTENDIMENTO_METODO",
      condicao: "Paciente compreendeu o que é a Aliviar",
      responsavel: "STAFF",
      evento_disparador: "ETAPA_CONCLUIDA_STAFF",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "Permanecer em DESCOBERTA com conteúdo de confiança",
    },
    {
      de: "ENTENDIMENTO_METODO",
      para: "CONFIANCA",
      condicao: "Método explicado e compreendido",
      responsavel: "STAFF",
      evento_disparador: "ETAPA_CONCLUIDA_STAFF",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "Reapresentar método de forma assíncrona",
    },
    {
      de: "CONFIANCA",
      para: "CADASTRO",
      condicao: "Gestor apresentado; confiança estabelecida",
      responsavel: "STAFF",
      evento_disparador: "ETAPA_CONCLUIDA_STAFF",
      bloqueios_possiveis: ["Jornada bloqueada", "Paciente pede tempo"],
      fallback: "Permanecer em CONFIANCA sem pressão",
    },
    {
      de: "CADASTRO",
      para: "HISTORIA",
      condicao: "Caso declarado via API e cadastro confirmado",
      responsavel: "SISTEMA",
      evento_disparador: "REGISTRAR_CASO_API",
      bloqueios_possiveis: ["Dados incompletos", "Erro de API"],
      fallback: "Permanecer em CADASTRO; exibir ApiErrorResponse traduzido",
    },
    {
      de: "HISTORIA",
      para: "ACE",
      condicao: "História compartilhada e análise inicial executada",
      responsavel: "STAFF",
      evento_disparador: "ANALISE_INICIAL_API",
      bloqueios_possiveis: ["Documento pendente", "Jornada bloqueada"],
      fallback: "Bloquear etapa com motivo humanizado; ACE envia lembrete",
    },
    {
      de: "ACE",
      para: "CURADORIA",
      condicao: "ACE ativado e sessão de curadoria aberta",
      responsavel: "SISTEMA",
      evento_disparador: "SESSAO_CURADORIA_API",
      bloqueios_possiveis: ["Elegibilidade em análise", "Curador indisponível"],
      fallback: "Permanecer em ACE; ACE comunica previsão realista",
    },
    {
      de: "CURADORIA",
      para: "ENTREGA",
      condicao: "Entrega produzida via API",
      responsavel: "SISTEMA",
      evento_disparador: "ENTREGA_API",
      bloqueios_possiveis: ["Curadoria incompleta", "Jornada bloqueada"],
      fallback: "Permanecer em CURADORIA; ACE traduz andamento",
    },
    {
      de: "ENTREGA",
      para: "ESCOLHA",
      condicao: "Opções apresentadas ao paciente (humano + entrega disponível)",
      responsavel: "CURADOR",
      evento_disparador: "ETAPA_CONCLUIDA_STAFF",
      bloqueios_possiveis: ["Paciente pediu tempo"],
      fallback: "Permanecer em ENTREGA; interface silenciosa",
    },
    {
      de: "ESCOLHA",
      para: "ACOMPANHAMENTO",
      condicao: "Escolha registrada pelo paciente",
      responsavel: "PACIENTE",
      evento_disparador: "ESCOLHA_REGISTRADA",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "Permanecer em ESCOLHA sem pressão",
    },
    {
      de: "ACOMPANHAMENTO",
      para: "RELACIONAMENTO",
      condicao: "Primeiro contato com profissional sinalizado",
      responsavel: "PACIENTE",
      evento_disparador: "ACOMPANHAMENTO_SINALIZADO",
      bloqueios_possiveis: ["Jornada bloqueada"],
      fallback: "ACE oferece apoio logístico",
    },
    {
      de: "RELACIONAMENTO",
      para: "ENCERRADO",
      condicao: "Todas etapas concluídas; jornada encerrada",
      responsavel: "STAFF",
      evento_disparador: "JORNADA_CONCLUIDA",
      bloqueios_possiveis: ["Etapas obrigatórias pendentes"],
      fallback: "Permanecer em RELACIONAMENTO até critérios de encerramento",
    },
  ],
};

export function arestasDe(no: NavigationEdge["de"]): NavigationEdge[] {
  return NAVIGATION_GRAPH.arestas.filter((aresta) => aresta.de === no);
}

export function arestasPara(no: NavigationEdge["para"]): NavigationEdge[] {
  return NAVIGATION_GRAPH.arestas.filter((aresta) => aresta.para === no);
}

export function transicaoPermitida(
  de: NavigationEdge["de"],
  para: NavigationEdge["para"],
): NavigationEdge | null {
  return (
    NAVIGATION_GRAPH.arestas.find((aresta) => aresta.de === de && aresta.para === para) ?? null
  );
}
