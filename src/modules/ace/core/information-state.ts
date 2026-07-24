// Estados semânticos de informação — evitam confundir "não possui",
// "não mencionado", "não se aplica" e "respondido negativamente".

export type EstadoInformacao =
  | "conhecido"
  | "ausencia_declarada"
  | "desconhecido"
  | "nao_perguntado"
  | "sem_resposta"
  | "nao_se_aplica"
  | "conflitante"
  | "requer_confirmacao"
  | "determinado_pelo_caso"
  | "determinado_pelo_curador";

export type FonteEvidencia =
  | "resposta_paciente"
  | "resposta_curador"
  | "formulario"
  | "interacao"
  | "documento"
  | "inferencia_ia"
  | "regra_deterministica";

export type EvidenciaOrigem = {
  tipo: FonteEvidencia;
  trecho?: string;
  identificador?: string;
  autor?: string;
  data?: string;
  confianca?: number;
  validadoPorHumano?: boolean;
};

export type InformacaoEstruturada<T> = {
  valor: T | null;
  estado: EstadoInformacao;
  fonte?: FonteEvidencia;
  evidencia?: EvidenciaOrigem;
  atualizadoEm?: string;
};

/** Estados que nunca devem gerar pendência em missingInformation. */
export const ESTADOS_SEM_PENDENCIA: ReadonlySet<EstadoInformacao> = new Set([
  "conhecido",
  "ausencia_declarada",
  "nao_se_aplica",
  "determinado_pelo_caso",
  "determinado_pelo_curador",
]);

export function estadoGeraPendencia(estado: EstadoInformacao): boolean {
  return !ESTADOS_SEM_PENDENCIA.has(estado);
}
