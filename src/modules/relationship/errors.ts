// RELATIONSHIP ENGINE — MVP — PR2/PR3. Códigos fechados — nunca uma
// mensagem genérica solta, sempre um RelationshipError com code + message.
//
// RELATIONSHIP_ALREADY_EXISTS, CONNECTION_INVALID e CONCURRENT_CONFLICT
// nunca são lançados por commands.ts (o domínio puro nunca consulta
// banco, logo nunca sabe se um Relationship já existe para o Connection,
// se o Connection referenciado é válido, nem se uma transição concorrente
// ocorreu) — são reservados para o repository concreto (repository.ts,
// PR3) mapear, respectivamente, a violação de unicidade (23505), a
// rejeição de `assert_relationship_matches_connection`/FK (23503/23514
// em `create_relationship_with_event`) e o conflito de concorrência
// otimista (55000) da camada de persistência (PR1) para o mesmo
// vocabulário de erro do domínio — exatamente o mesmo precedente já
// usado por ConnectionError.CONCURRENT_CONFLICT.
export type RelationshipErrorCode =
  | "INVALID_TRANSITION"
  | "RELATIONSHIP_ALREADY_EXISTS"
  | "RELATIONSHIP_NOT_ACTIVE"
  | "INVALID_AUTHOR"
  | "INVALID_REOPEN"
  | "INVALID_TERMINATION"
  | "CONNECTION_INVALID"
  | "CONCURRENT_CONFLICT";

export class RelationshipError extends Error {
  readonly code: RelationshipErrorCode;

  constructor({
    code,
    message,
  }: {
    code: RelationshipErrorCode;
    message: string;
  }) {
    super(message);
    this.name = "RelationshipError";
    this.code = code;
  }
}
