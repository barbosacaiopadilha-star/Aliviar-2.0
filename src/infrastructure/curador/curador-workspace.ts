import type {
  ComentarioOperacionalView,
  ConjuntoElegivelView,
  CuratorWorkspaceData,
  EntregaRascunhoView,
  OpcaoRegistradaView,
} from "@/curator-flow/contracts/curador-view";

export const WORKSPACE_VAZIO: CuratorWorkspaceData = {
  sessao: {
    sessao_id: null,
    status: "NAO_INICIADA",
    curador_id: null,
    aberta_em: null,
  },
  conjunto_elegivel: null,
  opcoes_registradas: null,
  rascunho_entrega: null,
  comentarios: [],
};

export function normalizarWorkspace(raw: unknown): CuratorWorkspaceData {
  const data = (raw ?? {}) as Partial<CuratorWorkspaceData>;
  return {
    sessao: data.sessao ?? WORKSPACE_VAZIO.sessao,
    conjunto_elegivel: data.conjunto_elegivel ?? null,
    opcoes_registradas: data.opcoes_registradas ?? null,
    rascunho_entrega: data.rascunho_entrega ?? null,
    comentarios: data.comentarios ?? [],
  };
}

export function opcoesEstaoCompletas(opcoes: OpcaoRegistradaView[] | null): boolean {
  return opcoes !== null && opcoes.length === 3;
}

export function entregaEstaAprovada(rascunho: EntregaRascunhoView | null): boolean {
  return rascunho?.modo === "APROVADO" || rascunho?.modo === "PUBLICADO";
}

export function construirRascunhoDeOpcoes(
  opcoes: OpcaoRegistradaView[],
  comparativo: EntregaRascunhoView["comparativo"],
): EntregaRascunhoView {
  return {
    modo: "RASCUNHO",
    entrega: {
      entrega_id: "rascunho",
      opcoes: opcoes.map((o) => ({
        indice: o.indice,
        nome: o.nome,
        especialidade: o.especialidade,
        por_que_esta_aqui: o.por_que_esta_aqui,
        por_que_pode_fazer_sentido: o.por_que_pode_fazer_sentido,
        o_que_esperar: o.o_que_esperar,
        limitacoes: o.limitacoes,
        evidencias_resumo: o.evidencias_resumo,
      })),
      comparativo,
      curador_disponivel: true,
    },
    comparativo,
    atualizado_em: new Date().toISOString(),
    aprovado_em: null,
    aprovado_por: null,
  };
}

export function anexarComentario(
  workspace: CuratorWorkspaceData,
  comentario: ComentarioOperacionalView,
): CuratorWorkspaceData {
  return {
    ...workspace,
    comentarios: [...workspace.comentarios, comentario],
  };
}

export function atualizarConjuntoElegivel(
  workspace: CuratorWorkspaceData,
  conjunto: ConjuntoElegivelView,
): CuratorWorkspaceData {
  return { ...workspace, conjunto_elegivel: conjunto };
}

export function registrarOpcoes(
  workspace: CuratorWorkspaceData,
  opcoes: OpcaoRegistradaView[],
): CuratorWorkspaceData {
  const comparativo = [
    {
      dimensao: "Visão geral",
      narrativa:
        "As três opções foram registradas sem ranking. Cada caminho possui justificativa, forças, limitações e evidências.",
    },
  ];
  return {
    ...workspace,
    opcoes_registradas: opcoes,
    rascunho_entrega: construirRascunhoDeOpcoes(opcoes, comparativo),
  };
}

export function abrirSessaoWorkspace(
  workspace: CuratorWorkspaceData,
  sessaoId: string,
  curadorId: string,
  abertaEm: string,
): CuratorWorkspaceData {
  return {
    ...workspace,
    sessao: {
      sessao_id: sessaoId,
      status: "ABERTA",
      curador_id: curadorId,
      aberta_em: abertaEm,
    },
  };
}
