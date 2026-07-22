import type {
  CasoDeCuradoriaView,
  EstadoOperacionalCurador,
  FilaCasoItemView,
} from "@/curator-flow/contracts/curador-view";

const LABEL_ESTADO: Record<EstadoOperacionalCurador, string> = {
  AGUARDANDO: "Aguardando",
  EM_ANALISE: "Em análise",
  BLOQUEADO: "Bloqueado",
  PRONTO_PARA_ENTREGA: "Pronto para entrega",
  ENTREGUE: "Entregue",
  ACOMPANHAMENTO: "Acompanhamento",
};

export interface FilaCuradorExperienceModel {
  itens: FilaCasoItemView[];
}

export interface CasoCuradorExperienceModel {
  caso: CasoDeCuradoriaView;
  estado_label: string;
  pode_assumir: boolean;
  pode_abrir_sessao: boolean;
  pode_registrar_opcoes: boolean;
  pode_aprovar_entrega: boolean;
  pode_publicar_entrega: boolean;
}

export interface CuratorExperienceSnapshot {
  fila: FilaCuradorExperienceModel | null;
  caso: CasoCuradorExperienceModel | null;
}

export function mapFilaCuradorExperience(itens: FilaCasoItemView[]): FilaCuradorExperienceModel {
  return { itens };
}

export function mapCasoCuradorExperience(caso: CasoDeCuradoriaView): CasoCuradorExperienceModel {
  return {
    caso,
    estado_label: LABEL_ESTADO[caso.estado_operacional],
    pode_assumir: caso.curador_id === null,
    pode_abrir_sessao: caso.sessao.status === "NAO_INICIADA",
    pode_registrar_opcoes:
      caso.sessao.status === "ABERTA" && caso.opcoes_registradas === null,
    pode_aprovar_entrega:
      caso.rascunho_entrega?.modo === "RASCUNHO" || caso.rascunho_entrega?.modo === "REVISAO",
    pode_publicar_entrega: caso.rascunho_entrega?.modo === "APROVADO",
  };
}

export type CuratorCaseSurface =
  | "resumo"
  | "workspace"
  | "opcoes"
  | "entrega"
  | "timeline";

export function resolveCuratorCaseSurface(caso: CasoDeCuradoriaView): CuratorCaseSurface {
  if (caso.rascunho_entrega?.entrega) {
    return "entrega";
  }

  if (caso.estado_operacional === "ENTREGUE" || caso.estado_operacional === "ACOMPANHAMENTO") {
    return "timeline";
  }

  if (caso.opcoes_registradas) {
    return "entrega";
  }

  if (caso.sessao.status === "ABERTA") {
    return "opcoes";
  }

  return "workspace";
}
