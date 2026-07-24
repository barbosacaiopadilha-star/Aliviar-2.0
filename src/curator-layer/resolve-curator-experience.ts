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
  pode_validar_perfil: boolean;
  pode_iniciar_dossie: boolean;
  pode_salvar_rascunho_dossie: boolean;
  pode_criar_versao_dossie: boolean;
  pode_aprovar_dossie: boolean;
  pode_publicar_dossie: boolean;
  pode_concluir_devolutiva: boolean;
}

export interface CuratorExperienceSnapshot {
  fila: FilaCuradorExperienceModel | null;
  caso: CasoCuradorExperienceModel | null;
}

export function mapFilaCuradorExperience(itens: FilaCasoItemView[]): FilaCuradorExperienceModel {
  return { itens };
}

export function mapCasoCuradorExperience(caso: CasoDeCuradoriaView): CasoCuradorExperienceModel {
  const cc = caso.caso_curadoria;
  const dossie = cc?.dossie;
  const versaoAtual = caso.dossie_versao_atual;
  const devolutiva = cc?.devolutiva;

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
    pode_validar_perfil: Boolean(cc && !cc.perfil_prioridades?.validado),
    pode_iniciar_dossie: Boolean(
      cc?.perfil_prioridades?.validado &&
        cc.curadoria_tecnica?.status === "CONCLUIDA" &&
        !dossie,
    ),
    pode_salvar_rascunho_dossie: Boolean(
      dossie && versaoAtual && ["RASCUNHO", "EM_REVISAO"].includes(versaoAtual.status),
    ),
    pode_criar_versao_dossie: Boolean(
      dossie && versaoAtual && versaoAtual.status === "RASCUNHO",
    ),
    pode_aprovar_dossie: Boolean(
      dossie && versaoAtual && ["RASCUNHO", "EM_REVISAO"].includes(versaoAtual.status),
    ),
    pode_publicar_dossie: Boolean(dossie?.status === "APROVADO"),
    pode_concluir_devolutiva: Boolean(devolutiva && !devolutiva.concluida),
  };
}

export type CuratorCaseSurface =
  | "resumo"
  | "workspace"
  | "opcoes"
  | "entrega"
  | "dossie"
  | "devolutiva"
  | "timeline";

export function resolveCuratorCaseSurface(caso: CasoDeCuradoriaView): CuratorCaseSurface {
  const cc = caso.caso_curadoria;

  if (cc?.devolutiva && !cc.devolutiva.concluida && cc.dossie?.status === "PUBLICADO") {
    return "devolutiva";
  }

  if (
    cc &&
    (cc.status === "MESA" ||
      cc.status === "DOSSIE" ||
      cc.status === "PUBLICADO" ||
      cc.dossie !== null)
  ) {
    return "dossie";
  }

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
