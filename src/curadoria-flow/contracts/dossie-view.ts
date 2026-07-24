import type { CandidatoElegivelView } from "@/curator-flow/contracts/curador-view";
import type { ComparativoDimensaoView } from "@/experience-flow/contracts/jornada-view";

export type CasoCuradoriaStatus =
  | "ABERTO"
  | "MESA"
  | "DOSSIE"
  | "PUBLICADO"
  | "DEVOLUTIVA"
  | "ESCOLHA"
  | "ENCERRADO";

export type CuradoriaTecnicaStatus = "EM_ANDAMENTO" | "CONCLUIDA";

export type DossieStatus = "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "PUBLICADO";

export type DossieVersaoStatus = "RASCUNHO" | "EM_REVISAO" | "APROVADO" | "PUBLICADO";

export type RotuloOpcaoDossie = "A" | "B" | "C";

export interface DimensaoPrioridadeView {
  nome: string;
  descricao?: string;
  valor?: number;
}

export interface PerfilPrioridadesView {
  id: string;
  caso_id: string;
  journey_id: string;
  dimensoes: DimensaoPrioridadeView[];
  pesos: Record<string, number>;
  validado: boolean;
  validado_por: string | null;
  validado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface CuradoriaTecnicaView {
  id: string;
  caso_id: string;
  journey_id: string;
  status: CuradoriaTecnicaStatus;
  candidatos_selecionados: CandidatoElegivelView[];
  concluida_por: string | null;
  concluida_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface DossieOpcaoView {
  id: string;
  indice: number;
  rotulo: RotuloOpcaoDossie;
  nome: string;
  especialidade: string;
  parecer: string;
  pontos_favoraveis: string;
  pontos_atencao: string;
  perguntas_sugeridas: string;
  relation_to_weights?: string;
  o_que_esperar: string;
  evidencias_resumo: string;
  professional_profile_id?: string;
}

export interface DossieVersaoView {
  id: string;
  dossie_id: string;
  versao: number;
  status: DossieVersaoStatus;
  comparativo: ComparativoDimensaoView[];
  opcoes: DossieOpcaoView[];
  criado_por: string;
  criado_em: string;
  aprovado_por: string | null;
  aprovado_em: string | null;
}

export interface DossieView {
  id: string;
  caso_id: string;
  journey_id: string;
  status: DossieStatus;
  versao_atual: number;
  curador_id: string;
  publicado_em: string | null;
  publicado_por: string | null;
  criado_em: string;
  atualizado_em: string;
  versao_publicada: DossieVersaoView | null;
}

export interface DevolutivaView {
  id: string;
  dossie_id: string;
  journey_id: string;
  data_devolutiva: string | null;
  dossie_apresentado: boolean;
  duvidas_relevantes: string[];
  concluida: boolean;
  concluida_por: string | null;
  concluida_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface EscolhaCuradoriaView {
  id: string;
  journey_id: string;
  patient_id: string;
  dossie_id: string;
  dossie_versao_id: string;
  opcao_indice: number;
  profissional_nome: string;
  profissional_especialidade: string;
  proximos_passos: string;
  observacao_paciente: string | null;
  registrada_em: string;
}

export enum EventoCuradoriaTipo {
  CASO_ABERTO = "CASO_ABERTO",
  PERFIL_VALIDADO = "PERFIL_VALIDADO",
  MESA_CONCLUIDA = "MESA_CONCLUIDA",
  DOSSIE_INICIADO = "DOSSIE_INICIADO",
  DOSSIE_VERSAO_CRIADA = "DOSSIE_VERSAO_CRIADA",
  DOSSIE_ALTERADO = "DOSSIE_ALTERADO",
  DOSSIE_REVISADO = "DOSSIE_REVISADO",
  DOSSIE_APROVADO = "DOSSIE_APROVADO",
  DOSSIE_PUBLICADO = "DOSSIE_PUBLICADO",
  DOSSIE_VISUALIZADO_PACIENTE = "DOSSIE_VISUALIZADO_PACIENTE",
  DEVOLUTIVA_REGISTRADA = "DEVOLUTIVA_REGISTRADA",
  DEVOLUTIVA_CONCLUIDA = "DEVOLUTIVA_CONCLUIDA",
  ESCOLHA_REGISTRADA = "ESCOLHA_REGISTRADA",
  PROXIMOS_PASSOS = "PROXIMOS_PASSOS",
}

export interface CasoCuradoriaView {
  id: string;
  journey_id: string;
  patient_id: string;
  curador_id: string | null;
  status: CasoCuradoriaStatus;
  perfil_prioridades: PerfilPrioridadesView | null;
  curadoria_tecnica: CuradoriaTecnicaView | null;
  dossie: DossieView | null;
  devolutiva: DevolutivaView | null;
  escolha: EscolhaCuradoriaView | null;
  criado_em: string;
  atualizado_em: string;
}
