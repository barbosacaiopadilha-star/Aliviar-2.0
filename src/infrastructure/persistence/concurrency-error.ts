export class PersistenceConcurrencyError extends Error {
  readonly code = "PERSISTENCE_CONCURRENCY_CONFLICT";

  constructor(message = "Conflito de versão ao persistir snapshot.") {
    super(message);
    this.name = "PersistenceConcurrencyError";
  }
}
