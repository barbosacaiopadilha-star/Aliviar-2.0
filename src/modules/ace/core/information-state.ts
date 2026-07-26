// Estados semânticos de informação — evitam confundir "não possui",
// "não mencionado", "não se aplica" e "respondido negativamente".
//
// A disciplina foi absorvida em `src/platform/information/information-state.ts`,
// onde vale para qualquer informação da plataforma e não só para artefatos do
// ACE. O vocabulário aqui permanece o do ACE (em português, com `curador` e
// `paciente` nomeados) porque é o vocabulário que os protocolos e os testes já
// usam; o que deixou de ser duplicado é a REGRA — quais estados geram
// pendência —, que agora tem uma implementação só.

import {
  isPending,
  type EvidenceSource,
  type InformationState,
} from "@/platform/information/information-state";

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

// Tradução do vocabulário do ACE para o da Plataforma. Só um estado e três
// fontes mudam de nome: a Plataforma não pode nomear Curador nem paciente.
const ESTADO_NA_PLATAFORMA: Readonly<Record<EstadoInformacao, InformationState>> = {
  conhecido: "conhecido",
  ausencia_declarada: "ausencia_declarada",
  desconhecido: "desconhecido",
  nao_perguntado: "nao_perguntado",
  sem_resposta: "sem_resposta",
  nao_se_aplica: "nao_se_aplica",
  conflitante: "conflitante",
  requer_confirmacao: "requer_confirmacao",
  determinado_pelo_caso: "determinado_pelo_caso",
  determinado_pelo_curador: "determinado_por_quem_conduz",
};

const FONTE_NA_PLATAFORMA: Readonly<Record<FonteEvidencia, EvidenceSource>> = {
  resposta_paciente: "declaracao_da_pessoa",
  resposta_curador: "declaracao_de_quem_conduz",
  formulario: "formulario",
  interacao: "interacao",
  documento: "documento",
  inferencia_ia: "inferencia_de_modelo",
  regra_deterministica: "regra_deterministica",
};

export function estadoNaPlataforma(estado: EstadoInformacao): InformationState {
  return ESTADO_NA_PLATAFORMA[estado];
}

export function fonteNaPlataforma(fonte: FonteEvidencia): EvidenceSource {
  return FONTE_NA_PLATAFORMA[fonte];
}

export function estadoGeraPendencia(estado: EstadoInformacao): boolean {
  return isPending(estadoNaPlataforma(estado));
}

/** Estados que nunca devem gerar pendência em missingInformation. */
export const ESTADOS_SEM_PENDENCIA: ReadonlySet<EstadoInformacao> = new Set(
  (Object.keys(ESTADO_NA_PLATAFORMA) as EstadoInformacao[]).filter(
    (estado) => !estadoGeraPendencia(estado),
  ),
);
