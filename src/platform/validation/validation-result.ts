/**
 * CONTRATO DE VALIDAÇÃO — o formato único de "o que está errado aqui".
 *
 * Por que existe: cada parte do sistema tinha o seu jeito de reportar
 * problema — array de string, objeto de erros por campo, exceção. Uma tela que
 * quisesse mostrar erros de duas origens precisava traduzir entre formatos, e
 * cada tradução perdia informação (tipicamente qual campo, que é justamente a
 * informação de que a pessoa precisa para corrigir).
 *
 * Absorvido de `src/modules/ace/core/validation-contract.ts`, que já tinha a
 * forma certa e o escopo errado — era de protocolo.
 *
 * Esta camada não conhece Curadoria, Mesa, Briefing, paciente, Concierge nem
 * Administrador. Conhece validação.
 */

/**
 * Um problema encontrado.
 *
 * `severity` separa o que impede de o que preocupa. Sem essa distinção o
 * sistema só tem duas opções — bloquear ou ficar calado — e passa a bloquear
 * coisas que um humano deveria apenas ver antes de seguir.
 */
export type ValidationIssue = {
  /** Onde o problema está, no vocabulário de quem vai corrigir. */
  readonly field: string;
  readonly message: string;
  readonly severity: "blocking" | "advisory";
  /** Código estável, quando quem chama precisa reagir a um caso específico. */
  readonly code?: string;
};

export type ValidationResult = {
  /** Não há problema bloqueante. Avisos podem existir mesmo assim. */
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
};

export interface Validator<T> {
  validate(value: T): ValidationResult;
}

export const VALID: ValidationResult = Object.freeze({ valid: true, issues: [] });

export function blocking(field: string, message: string, code?: string): ValidationIssue {
  return Object.freeze({ field, message, severity: "blocking" as const, code });
}

export function advisory(field: string, message: string, code?: string): ValidationIssue {
  return Object.freeze({ field, message, severity: "advisory" as const, code });
}

/** Monta um resultado; `valid` deriva dos achados, nunca é declarado à mão. */
export function resultOf(issues: readonly ValidationIssue[]): ValidationResult {
  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "blocking"),
    issues: Object.freeze([...issues]),
  });
}

/**
 * Junta resultados de validadores independentes preservando todos os achados.
 *
 * Deliberadamente não para no primeiro erro: fazer alguém corrigir um campo,
 * submeter, e descobrir o próximo é uma forma de desrespeito que o formato de
 * dado consegue impedir.
 */
export function combine(...results: readonly ValidationResult[]): ValidationResult {
  return resultOf(results.flatMap((result) => [...result.issues]));
}

/** Só o que impede — para quem precisa decidir se segue. */
export function blockingIssues(result: ValidationResult): readonly ValidationIssue[] {
  return result.issues.filter((issue) => issue.severity === "blocking");
}

/** Agrupa por campo, que é como uma tela precisa consumir. */
export function issuesByField(
  result: ValidationResult,
): ReadonlyMap<string, readonly ValidationIssue[]> {
  const grouped = new Map<string, ValidationIssue[]>();
  for (const issue of result.issues) {
    const list = grouped.get(issue.field);
    if (list) list.push(issue);
    else grouped.set(issue.field, [issue]);
  }
  return grouped;
}
