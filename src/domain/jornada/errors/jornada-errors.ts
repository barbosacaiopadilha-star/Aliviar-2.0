import { DomainError } from "@/domain/shared/errors/domain-error";

export abstract class JornadaDomainError extends DomainError {
  abstract readonly code: string;
}

export class EtapaForaDeSequenciaError extends JornadaDomainError {
  readonly code = "ETAPA_FORA_DE_SEQUENCIA";
}

export class EtapaObrigatoriaNaoConcluidaError extends JornadaDomainError {
  readonly code = "ETAPA_OBRIGATORIA_NAO_CONCLUIDA";
}

export class JornadaBloqueadaError extends JornadaDomainError {
  readonly code = "JORNADA_BLOQUEADA";
}

export class JornadaJaConcluidaError extends JornadaDomainError {
  readonly code = "JORNADA_JA_CONCLUIDA";
}

export class HistoricoImutavelError extends JornadaDomainError {
  readonly code = "HISTORICO_IMUTAVEL";
}

export class ReidratacaoInvalidaError extends JornadaDomainError {
  readonly code = "REIDRATACAO_INVALIDA";
}

export class EtapaInvalidaError extends JornadaDomainError {
  readonly code = "ETAPA_INVALIDA";
}
